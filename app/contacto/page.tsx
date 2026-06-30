import Link from "next/link";
import { Mail, MessageCircle, Clock, Instagram, Send, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { ContactForm } from "@/components/contacto/ContactForm";

export const metadata = {
    title: "Contacto · Wordelia",
    description: "¿Tienes un club, librería o proyecto educativo? Escríbenos y te respondemos lo antes posible.",
};

// Mapea el ?source=... (de los enlaces de la web) al motivo preseleccionado.
function subjectFromSource(source?: string): string {
    switch (source) {
        case "librerias":
            return "librerias";
        case "educacion":
            return "educacion";
        case "planes-b2b":
        case "create-club":
            return "clubs";
        default:
            return "general";
    }
}

export default async function ContactoPage({
    searchParams,
}: {
    searchParams: Promise<{ source?: string }>;
}) {
    const { source } = await searchParams;
    const initialSubject = subjectFromSource(source);

    return (
        <main className="min-h-screen bg-cream">
            <Navbar mode="public" />

            <section className="px-6 pb-16 pt-28 md:px-8 md:pb-24 md:pt-32">
                <div className="mx-auto max-w-[1100px]">
                    <Link
                        href="/"
                        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-grey transition-colors hover:text-teal"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Volver al inicio
                    </Link>

                    <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-coral">Contacto</p>
                        <h1 className="mt-3 text-3xl leading-tight text-teal md:text-5xl">
                            Hablemos con calma
                        </h1>
                        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-grey md:text-lg">
                            ¿Tienes un club, librería o proyecto educativo? ¿Una duda sobre Wordelia o una idea
                            que compartir? Escríbenos y te respondemos lo antes posible.
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-[0.85fr_1.15fr] md:items-start md:gap-12">
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-coral/10 text-coral">
                                    <Mail className="h-5 w-5" aria-hidden="true" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-teal-dark">Escríbenos</h3>
                                    <a
                                        href="mailto:hola@wordelia.es"
                                        className="text-sm text-grey transition-colors hover:text-teal"
                                    >
                                        hola@wordelia.es
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-coral/10 text-coral">
                                    <Clock className="h-5 w-5" aria-hidden="true" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-teal-dark">Tiempo de respuesta</h3>
                                    <p className="text-sm text-grey">Normalmente respondemos en 1-2 días laborables.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-coral/10 text-coral">
                                    <MessageCircle className="h-5 w-5" aria-hidden="true" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-teal-dark">Síguenos</h3>
                                    <div className="mt-2 flex items-center gap-4 text-teal">
                                        <a
                                            href="https://instagram.com"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="transition-colors hover:text-coral"
                                            aria-label="Instagram"
                                        >
                                            <Instagram className="h-5 w-5" aria-hidden="true" />
                                        </a>
                                        <a
                                            href="https://telegram.org"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="transition-colors hover:text-coral"
                                            aria-label="Telegram"
                                        >
                                            <Send className="h-5 w-5" aria-hidden="true" />
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-3xl border border-teal/10 bg-white/70 p-5 text-sm leading-relaxed text-grey/80">
                                ¿Buscas el acceso a la beta?{" "}
                                <Link href="/register?source=beta" className="font-medium text-teal underline-offset-2 hover:underline">
                                    Solicita tu plaza fundadora aquí
                                </Link>
                                .
                            </div>
                        </div>

                        <ContactForm initialSubject={initialSubject} source={source} />
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
