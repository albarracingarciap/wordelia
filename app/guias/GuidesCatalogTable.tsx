"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
    const pageCount = Math.max(1, Math.ceil(guides.length / rowsPerPage));
    const Icon = iconName === "dna" ? Dna : BookOpenCheck;
    const registerHref = `/register?source=${registerSource}`;

    const visibleGuides = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return guides.slice(start, start + rowsPerPage);
    }, [currentPage, guides]);

    return (
        <section>
            <div className="mb-4 flex items-center gap-3">
                <Icon className="h-6 w-6 text-coral" aria-hidden="true" />
                <div>
                    <h2 className="text-3xl text-teal">{title}</h2>
                    <p className="mt-1 text-sm text-grey">{subtitle}</p>
                </div>
            </div>

            <p className="mb-6 rounded-2xl border border-teal/10 bg-white px-4 py-3 text-sm text-grey shadow-sm">
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

            <div className="overflow-hidden rounded-3xl border border-teal/10 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] border-collapse text-left">
                        <thead className="bg-offwhite text-xs font-bold uppercase tracking-[0.14em] text-teal">
                            <tr>
                                <th className="px-5 py-4">Libro</th>
                                <th className="px-5 py-4">Autor</th>
                                <th className="px-5 py-4">Género</th>
                                <th className="px-5 py-4 text-right">Precio Oferta</th>
                                <th className="px-5 py-4 text-right">Acceso</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleGuides.length > 0 ? visibleGuides.map((guide) => (
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
                                    <td className="px-5 py-4 text-right">
                                        <span className="mr-2 text-sm font-medium text-grey/60 line-through">
                                            {formatPrice(originalPrice)}
                                        </span>
                                        <span className="font-semibold text-emerald-700">{formatPrice(price)}</span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <Link
                                            href={registerHref}
                                            className="inline-flex h-9 items-center justify-center rounded-xl border border-coral/40 px-4 text-sm font-semibold text-coral transition-colors hover:bg-coral hover:text-white"
                                        >
                                            Regístrate para comprar
                                        </Link>
                                    </td>
                                </tr>
                            )) : (
                                <tr className="border-t border-teal/10">
                                    <td colSpan={5} className="px-5 py-10 text-center text-grey">
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
