"use client";

import { useMemo, useState } from "react";
import { BookOpenCheck, ChevronLeft, ChevronRight, Dna } from "lucide-react";

export type CatalogGuide = {
    id: string;
    title: string;
    author: string | null;
    genre: string | null;
    firstPublicationYear: number | null;
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
};

export function GuidesCatalogTable({
    guides,
    title = "Guías individuales",
    subtitle = "Selecciona varias guías para preparar un pack personalizado.",
    iconName = "book",
    price = 6.99,
    originalPrice = 9.99,
    emptyLabel = "Aún no hay guías individuales disponibles.",
}: GuidesCatalogTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedGuideIds, setSelectedGuideIds] = useState<Set<string>>(new Set());
    const pageCount = Math.max(1, Math.ceil(guides.length / rowsPerPage));
    const Icon = iconName === "dna" ? Dna : BookOpenCheck;

    const visibleGuides = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return guides.slice(start, start + rowsPerPage);
    }, [currentPage, guides]);

    const selectedCount = selectedGuideIds.size;
    const selectedTotal = selectedCount * price;

    const toggleGuide = (id: string) => {
        setSelectedGuideIds((current) => {
            const next = new Set(current);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <section>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-center gap-3">
                    <Icon className="h-6 w-6 text-coral" aria-hidden="true" />
                    <div>
                        <h2 className="text-3xl text-teal">{title}</h2>
                        <p className="mt-1 text-sm text-grey">
                            {subtitle}
                        </p>
                    </div>
                </div>
                <div className="rounded-2xl border border-teal/10 bg-white px-4 py-3 text-sm shadow-sm">
                    <span className="font-semibold text-teal">{selectedCount} seleccionadas</span>
                    <span className="mx-2 text-grey/40">·</span>
                    <span className="font-semibold text-coral">{formatPrice(selectedTotal)}</span>
                </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-teal/10 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] border-collapse text-left">
                        <thead className="bg-offwhite text-xs font-bold uppercase tracking-[0.14em] text-teal">
                            <tr>
                                <th className="px-5 py-4">Libro</th>
                                <th className="px-5 py-4">Autor</th>
                                <th className="px-5 py-4">Género</th>
                                <th className="px-5 py-4">Año</th>
                                <th className="px-5 py-4 text-right">Precio Oferta</th>
                                <th className="px-5 py-4 text-center">Comprar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleGuides.length > 0 ? visibleGuides.map((guide) => {
                                const isSelected = selectedGuideIds.has(guide.id);

                                return (
                                    <tr key={guide.id} className="border-t border-teal/10 transition-colors hover:bg-cream/70">
                                        <td className="px-5 py-4 font-semibold text-teal-dark">{guide.title}</td>
                                        <td className="px-5 py-4 text-grey">{guide.author || "Autor desconocido"}</td>
                                        <td className="px-5 py-4">
                                            {guide.genre ? (
                                                <span className="rounded-full bg-coral/10 px-3 py-1 text-xs font-bold text-coral">{guide.genre}</span>
                                            ) : (
                                                <span className="text-sm text-grey">N/D</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-sm text-grey">{guide.firstPublicationYear || "N/D"}</td>
                                        <td className="px-5 py-4 text-right">
                                            <span className="mr-2 text-sm font-medium text-grey/60 line-through">
                                                {formatPrice(originalPrice)}
                                            </span>
                                            <span className="font-semibold text-emerald-700">{formatPrice(price)}</span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <label className="inline-flex cursor-pointer items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleGuide(guide.id)}
                                                    className="peer sr-only"
                                                    aria-label={`Añadir ${guide.title} al pack`}
                                                />
                                                <span className="flex h-6 w-6 items-center justify-center rounded-md border border-teal/25 bg-white text-white transition-colors peer-checked:border-coral peer-checked:bg-coral">
                                                    <span className="text-sm font-bold leading-none">✓</span>
                                                </span>
                                            </label>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr className="border-t border-teal/10">
                                    <td colSpan={6} className="px-5 py-10 text-center text-grey">
                                        {emptyLabel}
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
