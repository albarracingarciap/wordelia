"use server";

import { createHash } from "crypto";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient, hasSupabaseAdminConfig } from "@/utils/supabase/admin";
import { sendEmail } from "@/lib/email";
import { emailContactNotification, emailContactReceived } from "@/lib/emails";

// Buzón interno que recibe los avisos del formulario.
const CONTACT_INBOX = process.env.CONTACT_INBOX || "hola@wordelia.es";

// Ventana y topes del rate limit.
// El límite por IP es el que impide usar el formulario como relé de correo:
// sin él, variar el email daría cuota nueva en cada intento.
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_IP = 5;
const MAX_PER_EMAIL = 3;

// Primera barrera, en memoria: descarta ráfagas sin tocar la base de datos.
// No basta por sí sola (cada instancia serverless tiene la suya y se pierde
// al reiniciar), por eso detrás va el recuento persistido.
const recentSubmissions = new Map<string, number[]>();

function hitsInMemory(key: string, max: number): boolean {
    const now = Date.now();
    const hits = (recentSubmissions.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);

    if (hits.length >= max) {
        recentSubmissions.set(key, hits);
        return true;
    }

    hits.push(now);
    recentSubmissions.set(key, hits);

    // Poda perezosa para que el Map no crezca sin límite.
    if (recentSubmissions.size > 500) {
        for (const [k, times] of recentSubmissions) {
            if (times.every((t) => now - t >= RATE_WINDOW_MS)) recentSubmissions.delete(k);
        }
    }

    return false;
}

async function clientIp(): Promise<string> {
    const h = await headers();
    // x-forwarded-for puede traer una cadena de proxies: la primera IP es la real.
    return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

// Hash con sal: el espacio de IPv4 es pequeño y un sha256 pelado se revierte
// por fuerza bruta en minutos. Con sal secreta el valor guardado deja de ser
// reversible y sigue sirviendo para contar.
let warnedMissingSalt = false;

function hashIp(ip: string): string {
    const salt = process.env.IP_HASH_SALT || "";
    if (!salt && !warnedMissingSalt) {
        warnedMissingSalt = true;
        console.warn("[contacto] IP_HASH_SALT no definida: los hashes de IP son reversibles por fuerza bruta.");
    }
    return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

// Recuento persistido en contact_messages. Devuelve true si hay que frenar.
// Ante cualquier fallo deja pasar el mensaje: es preferible un envío de más
// que perder el contacto de un lector por un problema de infraestructura.
async function isRateLimitedInDb(ipHash: string, email: string): Promise<boolean> {
    if (!hasSupabaseAdminConfig()) return false;

    const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();

    try {
        const admin = createAdminClient() as unknown as { from: (table: string) => any };

        const [byIp, byEmail] = await Promise.all([
            admin.from("contact_messages")
                .select("id", { count: "exact", head: true })
                .eq("ip_hash", ipHash)
                .gte("created_at", since),
            admin.from("contact_messages")
                .select("id", { count: "exact", head: true })
                .eq("email", email)
                .gte("created_at", since),
        ]);

        if (byIp.error || byEmail.error) {
            console.error("Rate limit check failed:", byIp.error ?? byEmail.error);
            return false;
        }

        return (byIp.count ?? 0) >= MAX_PER_IP || (byEmail.count ?? 0) >= MAX_PER_EMAIL;
    } catch (error) {
        console.error("Unexpected error checking rate limit:", error);
        return false;
    }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALID_SUBJECTS = ["general", "clubs", "librerias", "educacion", "otro"] as const;
type Subject = (typeof VALID_SUBJECTS)[number];

export type ContactSubmitResult =
    | { success: true }
    | { success: false; error: string };

export async function submitContactMessage(formData: FormData): Promise<ContactSubmitResult> {
    // Honeypot anti-spam: campo oculto que un humano nunca rellena.
    const honeypot = String(formData.get("company") ?? "").trim();
    if (honeypot) {
        // Fingimos éxito para no dar pistas al bot.
        return { success: true };
    }

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const message = String(formData.get("message") ?? "").trim();
    const rawSubject = String(formData.get("subject") ?? "general").trim();
    const rawSource = String(formData.get("source") ?? "").trim();

    const subject: Subject = (VALID_SUBJECTS as readonly string[]).includes(rawSubject)
        ? (rawSubject as Subject)
        : "general";
    const source = rawSource ? rawSource.slice(0, 120) : null;

    if (!name || name.length < 2) {
        return { success: false, error: "Indícanos tu nombre." };
    }
    if (!email || !EMAIL_REGEX.test(email)) {
        return { success: false, error: "Introduce un email válido." };
    }
    if (!message || message.length < 10) {
        return { success: false, error: "Cuéntanos un poco más (mínimo 10 caracteres)." };
    }
    if (message.length > 5000) {
        return { success: false, error: "El mensaje es demasiado largo (máximo 5000 caracteres)." };
    }

    // Se comprueba tras validar para no gastar cuota con envíos malformados.
    const ipHash = hashIp(await clientIp());
    const tooManyRequests = {
        success: false as const,
        error: "Has enviado varios mensajes seguidos. Espera unos minutos antes de volver a escribirnos.",
    };

    if (hitsInMemory(`ip|${ipHash}`, MAX_PER_IP) || hitsInMemory(`email|${email}`, MAX_PER_EMAIL)) {
        return tooManyRequests;
    }
    if (await isRateLimitedInDb(ipHash, email)) {
        return tooManyRequests;
    }

    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from("contact_messages")
            .insert({
                name: name.slice(0, 120),
                email,
                subject,
                message,
                source,
                ip_hash: ipHash,
            });

        if (error) {
            console.error("Error saving contact message:", error);
            return { success: false, error: "No hemos podido enviar tu mensaje. Inténtalo de nuevo." };
        }

        // Aviso interno. El mensaje ya está guardado, así que un fallo de email
        // no debe hacer fracasar el envío de cara al visitante: sendEmail
        // registra sus propios errores y nunca lanza.
        await Promise.all([
            sendEmail({
                to: CONTACT_INBOX,
                replyTo: email,
                ...emailContactNotification({ name, email, subject, message, source }),
            }),
            // Acuse de recibo al visitante.
            sendEmail({ to: email, replyTo: CONTACT_INBOX, ...emailContactReceived() }),
        ]);

        return { success: true };
    } catch (error) {
        console.error("Unexpected error saving contact message:", error);
        return { success: false, error: "No hemos podido enviar tu mensaje. Inténtalo de nuevo." };
    }
}
