import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, BookOpen } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { hasSupabaseAdminConfig } from "@/utils/supabase/admin";
import { fetchBookWorkspace, fetchGuideContent, fetchGenomeRows } from "../data";
import { DatosTab } from "./DatosTab";
import { EdicionesTab } from "./EdicionesTab";
import { GuiaTab } from "./GuiaTab";
import { GenomaTab } from "./GenomaTab";
import { PublicacionTab } from "./PublicacionTab";

export const revalidate = 0;

const TABS = [
    { id: "datos", label: "Datos" },
    { id: "ediciones", label: "Ediciones" },
    { id: "guia", label: "Guía" },
    { id: "genoma", label: "Genoma" },
    { id: "publicacion", label: "Publicación" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default async function BookWorkspacePage({
    params,
    searchParams,
}: {
    params: Promise<{ bookId: string }>;
    searchParams: Promise<{ tab?: string }>;
}) {
    const { bookId } = await params;
    const { tab } = await searchParams;
    const active: TabId = TABS.some((t) => t.id === tab) ? (tab as TabId) : "datos";

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin" && profile?.role !== "editor") {
        return (
            <div className="bg-coral/10 text-coral p-6 rounded-xl border border-coral/20">
                <h3 className="font-semibold text-lg">Acceso Restringido</h3>
            </div>
        );
    }

    if (!hasSupabaseAdminConfig()) {
        return (
            <div className="bg-coral/10 text-coral p-6 rounded-xl border border-coral/20">
                <h3 className="font-semibold text-lg">Configuración incompleta</h3>
            </div>
        );
    }

    const ws = await fetchBookWorkspace(bookId);
    if (!ws) {
        return (
            <div className="space-y-6">
                <Link href="/app/admin/catalogo" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-teal-dark">
                    <ArrowLeft className="w-4 h-4" /> Volver al catálogo
                </Link>
                <div className="bg-muted/40 p-6 rounded-xl border border-teal/10">
                    <h3 className="font-semibold text-lg">Libro no encontrado</h3>
                </div>
            </div>
        );
    }

    const cover = ws.editions.find((e) => e.isPreferred)?.cover_url ?? ws.editions[0]?.cover_url ?? null;

    // Contenido pesado solo para la pestaña activa.
    const guideContent = active === "guia" ? await fetchGuideContent(bookId) : null;
    const genomeRows = active === "genoma" ? await fetchGenomeRows(bookId) : [];

    return (
        <div className="space-y-6">
            <Link href="/app/admin/catalogo" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-teal-dark transition-colors">
                <ArrowLeft className="w-4 h-4" /> Volver al catálogo
            </Link>

            {/* Cabecera */}
            <div className="flex items-start gap-4 pb-4 border-b border-teal/10">
                {cover ? (
                    <div className="relative w-16 h-24 shrink-0 rounded overflow-hidden shadow-sm">
                        <Image src={cover} alt={ws.book.title} fill className="object-cover" sizes="64px" />
                    </div>
                ) : (
                    <div className="w-16 h-24 shrink-0 rounded bg-grey/10 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-grey/40" />
                    </div>
                )}
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight">{ws.book.title}</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        {ws.book.author || "Autor desconocido"}
                        {ws.book.first_publication_year ? ` · ${ws.book.first_publication_year}` : ""}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs">
                        <span className="text-muted-foreground">
                            {ws.editions.length} {ws.editions.length === 1 ? "edición" : "ediciones"}
                        </span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">Guía: {ws.guide.exists ? ws.guide.status : "—"}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">Genoma: {ws.genome.chromosomes || "—"} crom.</span>
                    </div>
                </div>
            </div>

            {/* Pestañas */}
            <div className="border-b border-teal/10">
                <nav className="flex gap-1 overflow-x-auto">
                    {TABS.map((t) => (
                        <Link
                            key={t.id}
                            href={`/app/admin/catalogo/${bookId}?tab=${t.id}`}
                            scroll={false}
                            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                                active === t.id
                                    ? "border-teal text-teal-dark"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {t.label}
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Contenido */}
            <div className="animate-fade-in">
                {active === "datos" && <DatosTab bookId={ws.book.id} book={ws.book} />}
                {active === "ediciones" && <EdicionesTab bookId={ws.book.id} editions={ws.editions} />}
                {active === "guia" && <GuiaTab bookId={ws.book.id} content={guideContent} />}
                {active === "genoma" && <GenomaTab bookId={ws.book.id} rows={genomeRows} />}
                {active === "publicacion" && (
                    <PublicacionTab
                        bookId={ws.book.id}
                        guide={ws.guide}
                        genome={ws.genome}
                        collectionId={ws.collectionId}
                        isAdmin={profile?.role === "admin"}
                    />
                )}
            </div>
        </div>
    );
}
