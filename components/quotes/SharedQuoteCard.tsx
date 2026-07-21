import type { SharedQuote } from "@/lib/shared-quote";

/**
 * Tarjeta visual de una cita para la página pública /cita/[id]. Presentacional
 * (Tailwind). La imagen OG (next/og) es una implementación aparte con estilos
 * inline que comparte este lenguaje visual.
 */
export function SharedQuoteCard({ quote }: { quote: SharedQuote }) {
    const readerName = quote.reader.name || (quote.reader.username ? `@${quote.reader.username}` : null);

    return (
        <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-teal/10 bg-white shadow-xl">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-teal via-teal/60 to-coral" />

            <div className="px-8 py-10 md:px-12 md:py-14">
                <span className="block font-serif text-6xl leading-none text-teal/25 select-none">&ldquo;</span>

                <blockquote className="mt-2 font-serif text-2xl leading-relaxed text-teal-dark md:text-[1.7rem]">
                    {quote.content}
                </blockquote>

                <div className="mt-8 flex items-center gap-4 border-t border-teal/10 pt-6">
                    {quote.book.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={quote.book.coverUrl}
                            alt={quote.book.title}
                            className="h-16 w-11 shrink-0 rounded object-cover shadow"
                        />
                    ) : (
                        <div className="h-16 w-11 shrink-0 rounded bg-teal/10" />
                    )}
                    <div className="min-w-0">
                        <p className="truncate font-semibold text-teal-dark">{quote.book.title}</p>
                        {quote.book.author && <p className="truncate text-sm text-grey/70">{quote.book.author}</p>}
                        {(quote.chapter || quote.pageNumber) && (
                            <p className="mt-0.5 text-xs text-grey/50">
                                {[quote.chapter, quote.pageNumber ? `p. ${quote.pageNumber}` : null].filter(Boolean).join(" · ")}
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-between text-xs text-grey/50">
                    <span>{readerName ? `Compartido por ${readerName}` : "Leído en Wordelia"}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/assets/images/logo_wordelia.png" alt="Wordelia" className="h-5 w-auto" />
                </div>
            </div>
        </div>
    );
}
