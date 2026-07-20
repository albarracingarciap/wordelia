"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpenCheck, ChevronLeft, ChevronRight, Dna, Search } from "lucide-react";

export type CatalogGuide = {
    id: string;
    title: string;
    author: string | null;
    genre: string | null;
    firstPublicationYear: number | null;
    coverUrl: string | null;
};

const rowsPerPage = 10;

function formatPrice(value: number) {
    return new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR",
    }).format(value);
}

type GuidesCatalogTableProps = {
    guides: CatalogGuide[];
    title?: string;
    subtitle?: string;
    iconName?: "book" | "dna";
    price?: number;
    originalPrice?: number;
    emptyLabel?: string;
    noun?: string;
    sampleHref?: string;
    registerSource?: string;
};

export function GuidesCatalogTable({
    guides,
    title = "Guías individuales",
    subtitle = "Cada guía incluye preguntas por checkpoints, contexto y dinámicas para tu club.",
    iconName = "book",
    price = 6.99,
    originalPrice = 9.99,
    emptyLabel = "Aún no hay guías individuales disponibles.",
    noun = "guías",
    sampleHref = "/demo-guia",
    registerSource = "guia-catalogo",
}: GuidesCatalogTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [query, setQuery] = useState("");
    const Icon = iconName === "dna" ? Dna : BookOpenCheck;
    const registerHref = `/register?source=${registerSource}`;

    const filteredGuides = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return guides;
        return guides.filter(
            (g) =>
                g.title.toLowerCase().includes(q) ||
                (g.author ?? "").toLowerCase().includes(q),
        );
    }, [guides, query]);

    const pageCount = Math.max(1, Math.ceil(filteredGuides.length / rowsPerPage));

    // Al filtrar cambia el número de páginas; nunca dejar el índice fuera de rango.
    useEffect(() => {
        setCurrentPage(1);
    }, [query]);

    const visibleGuides = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredGuides.slice(start, start + rowsPerPage);
    }, [currentPage, filteredGuides]);

    return (
        <section>
            <div className="mb-4 flex items-center gap-3">
                <Icon className="h-6 w-6 text-coral" aria-hidden="true" />
                <div>
                    <h2 className="text-3xl text-teal">{title}</h2>
                    <p className="mt-1 text-sm text-grey">{subtitle}</p>
                </div>
            </div>

            <p className="mb-4 rounded-2xl border border-teal/10 bg-white px-4 py-3 text-sm text-grey shadow-sm">
                La compra de {noun} se realiza desde tu cuenta.{" "}
                <Link href={registerHref} className="font-semibold text-coral transition-colors hover:text-[#C25852]">
                    Regístrate gratis
                </Link>{" "}
                y accede al catálogo completo. ¿Aún no lo tienes claro?{" "}
                <Link href={sampleHref} className="font-semibold text-teal transition-colors hover:text-coral">
                    Ver una muestra gratuita
                </Link>
                .
            </p>

            {/* Buscador por título o autor: el catálogo ya supera las 170 obras. */}
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                    <Search
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grey/50"
                        aria-hidden="true"
                    />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar por título o autor…"
                        aria-label="Buscar por título o autor"
                        className="w-full rounded-2xl border border-teal/15 bg-white py-2.5 pl-9 pr-4 text-sm text-grey shadow-sm transition-colors placeholder:text-grey/50 focus:border-teal/40 focus:outline-none focus:ring-2 focus:ring-teal/10"
                    />
                </div>
                <p className="text-sm text-grey/70">
                    {filteredGuides.length}{" "}
                    {filteredGuides.length === 1 ? "obra" : "obras"}
                    {query.trim() && ` · "${query.trim()}"`}
                </p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-teal/10 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] border-collapse text-left">
                        <thead className="bg-offwhite text-xs font-bold uppercase tracking-[0.14em] text-teal">
                            <tr>
                                <th className="w-16 px-5 py-4">
                                    <span className="sr-only">Portada</span>
                                </th>
                                <th className="px-5 py-4">Libro</th>
                                <th className="px-5 py-4">Autor</th>
                                <th className="px-5 py-4">Género</th>
                                <th className="px-5 py-4 text-right">Precio Oferta</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleGuides.length > 0 ? visibleGuides.map((guide) => (
                                <tr key={guide.id} className="border-t border-teal/10 transition-colors hover:bg-cream/70">
                                    <td className="py-3 pl-5 pr-0">
                                        <div className="relative h-14 w-10 overflow-hidden rounded bg-grey/10 shadow-sm">
                                            {guide.coverUrl ? (
                                                <Image
                                                    src={guide.coverUrl}
                                                    alt={`Portada de ${guide.title}`}
                                                    fill
                                                    sizes="40px"
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-grey/20 to-grey/5 p-1">
                                                    <span className="line-clamp-3 text-center text-[8px] leading-tight text-grey/60">
                                                        {guide.title}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 font-semibold text-teal-dark">{guide.title}</td>
                                    <td className="px-5 py-4 text-grey">{guide.author || "Autor desconocido"}</td>
                                    <td className="px-5 py-4">
                                        {guide.genre ? (
                                            <span className="rounded-full bg-coral/10 px-3 py-1 text-xs font-bold text-coral">{guide.genre}</span>
                                        ) : (
                                            <span className="text-sm text-grey">N/D</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <span className="mr-2 text-sm font-medium text-grey/60 line-through">
                                            {formatPrice(originalPrice)}
                                        </span>
                                        <span className="font-semibold text-emerald-700">{formatPrice(price)}</span>
                                    </td>
                                </tr>
                            )) : (
                                <tr className="border-t border-teal/10">
                                    <td colSpan={5} className="px-5 py-10 text-center text-grey">
                                        {query.trim()
                                            ? `No hemos encontrado ${noun} para "${query.trim()}".`
                                            : emptyLabel}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-teal/10 bg-offwhite px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-grey">
                        Página <span className="font-semibold text-teal">{currentPage}</span> de{" "}
                        <span className="font-semibold text-teal">{pageCount}</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                            disabled={currentPage === 1}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-teal/20 px-4 text-sm font-semibold text-teal transition-colors hover:bg-teal hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-teal"
                        >
                            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                            Anterior
                        </button>
                        <button
                            type="button"
                            onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
                            disabled={currentPage === pageCount}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-teal px-4 text-sm font-semibold text-white transition-colors hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Siguiente
                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
