// "ADN lector": identidad de lectura agregada desde los libros LEÍDOS de un usuario
// (géneros dominantes, autores, stats, personalidad). Server-only, service role
// (lee user_books de otro usuario para la página pública compartible).
import { createAdminClient } from "@/utils/supabase/admin";

type LooseClient = { from: (table: string) => any };

export interface ReaderDna {
    userId: string;
    username: string;
    name: string;
    avatarUrl: string | null;
    booksRead: number;
    totalPages: number;
    avgRating: number | null;
    topGenres: { genre: string; count: number }[];
    topAuthors: { author: string; count: number }[];
    personality: { label: string; blurb: string };
}

// Personalidad lectora derivada del género dominante (match por substring, sin tildes).
const PERSONALITIES: { match: string[]; label: string; blurb: string }[] = [
    { match: ["negra", "policiac", "thriller", "misterio", "crimen", "intriga"], label: "Alma de intriga", blurb: "Te mueven los secretos, las pistas y el lado oscuro de las historias." },
    { match: ["fantasia", "fantastic", "epica"], label: "Explorador de mundos", blurb: "Buscas mundos donde perderte y reglas nuevas que descubrir." },
    { match: ["ciencia ficcion", "ciencia-ficcion", "distop", "cyberpunk"], label: "Mente futurista", blurb: "Te fascina imaginar hacia dónde vamos." },
    { match: ["romantic", "romance", "amor"], label: "Corazón romántico", blurb: "Lees por los vínculos y por todo lo que nos une." },
    { match: ["historic", "historia"], label: "Viajero del tiempo", blurb: "Te atrae el pasado y las vidas que lo habitaron." },
    { match: ["terror", "horror"], label: "Buscador de escalofríos", blurb: "Te gusta que un libro te quite el sueño." },
    { match: ["poes"], label: "Alma poética", blurb: "Lees por la música de las palabras." },
    { match: ["ensayo", "no ficcion", "divulga", "filosof", "biograf"], label: "Mente inquieta", blurb: "Lees para entender el mundo y a quienes lo habitan." },
    { match: ["clasic"], label: "Espíritu clásico", blurb: "Vuelves a las historias que perduran." },
    { match: ["juvenil", "young"], label: "Corazón joven", blurb: "Lees con la intensidad de las primeras veces." },
];

function normalize(s: string): string {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function personalityFor(topGenre: string | null): { label: string; blurb: string } {
    if (topGenre) {
        const g = normalize(topGenre);
        for (const p of PERSONALITIES) {
            if (p.match.some((m) => g.includes(m))) return { label: p.label, blurb: p.blurb };
        }
    }
    return { label: "Lector ecléctico", blurb: "Tu ADN mezcla muchos mundos. No cabes en una sola etiqueta." };
}

function topN(counts: Map<string, number>, n: number) {
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

export async function getReaderDna(username: string): Promise<ReaderDna | null> {
    const admin = createAdminClient() as unknown as LooseClient;

    const { data: profile } = await admin
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .eq("username", username)
        .maybeSingle();
    if (!profile) return null;

    const { data: ub } = await admin
        .from("user_books")
        .select("book_id, rating")
        .eq("user_id", profile.id)
        .eq("status", "READ");
    const readRows = (ub ?? []) as any[];

    const bookIds = [...new Set(readRows.map((r) => r.book_id).filter(Boolean))];
    let books: any[] = [];
    if (bookIds.length) {
        const { data } = await admin.from("books").select("id, author, genre, preferred_edition_id").in("id", bookIds);
        books = (data ?? []) as any[];
    }

    // Páginas (edición preferida).
    const edIds = books.map((b) => b.preferred_edition_id).filter(Boolean);
    const pagesByEd = new Map<string, number>();
    if (edIds.length) {
        const { data: eds } = await admin.from("editions").select("id, page_count").in("id", edIds);
        for (const e of (eds ?? []) as any[]) pagesByEd.set(e.id, e.page_count ?? 0);
    }

    const genreCounts = new Map<string, number>();
    const authorCounts = new Map<string, number>();
    let totalPages = 0;
    for (const b of books) {
        if (b.genre) genreCounts.set(b.genre, (genreCounts.get(b.genre) ?? 0) + 1);
        if (b.author) authorCounts.set(b.author, (authorCounts.get(b.author) ?? 0) + 1);
        if (b.preferred_edition_id) totalPages += pagesByEd.get(b.preferred_edition_id) ?? 0;
    }

    const ratings = readRows.map((r) => r.rating).filter((r) => typeof r === "number" && r > 0);
    const avgRating = ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null;

    const topGenres = topN(genreCounts, 5).map(([genre, count]) => ({ genre, count }));
    const topAuthors = topN(authorCounts, 4).map(([author, count]) => ({ author, count }));

    return {
        userId: profile.id,
        username: profile.username,
        name: profile.full_name || profile.username || "Lector",
        avatarUrl: profile.avatar_url ?? null,
        booksRead: readRows.length,
        totalPages,
        avgRating,
        topGenres,
        topAuthors,
        personality: personalityFor(topGenres[0]?.genre ?? null),
    };
}
