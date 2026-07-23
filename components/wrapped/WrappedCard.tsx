import Image from "next/image";
import type { SharedWrapped } from "@/lib/shared-wrapped";

function cap(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

export function WrappedCard({ wrapped }: { wrapped: SharedWrapped }) {
    const reader = wrapped.reader.name || (wrapped.reader.username ? `@${wrapped.reader.username}` : null);

    const cells = [
        { value: wrapped.pages.toLocaleString("es-ES"), label: "páginas" },
        { value: `${wrapped.hours}h`, label: "leídas" },
        { value: String(wrapped.daysRead), label: "días con lectura" },
        wrapped.avgRating !== null ? { value: `${wrapped.avgRating}★`, label: "valoración media" } : null,
        wrapped.topGenre ? { value: wrapped.topGenre, label: "tu género top" } : null,
        wrapped.bestMonth ? { value: cap(wrapped.bestMonth), label: "tu mejor mes" } : null,
    ].filter(Boolean) as { value: string; label: string }[];

    return (
        <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_rgba(35,74,78,0.12)]">
            <div className="h-3 bg-gradient-to-r from-teal to-coral" />
            <div className="p-8 sm:p-10">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal">Tu año en lectura {wrapped.year}</p>

                <div className="mt-3 flex items-baseline gap-3">
                    <span className="font-serif text-6xl font-bold leading-none text-teal-dark sm:text-7xl">{wrapped.booksRead}</span>
                    <span className="text-2xl text-grey/60">{wrapped.booksRead === 1 ? "libro" : "libros"}</span>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-3">
                    {cells.map((c, i) => (
                        <div key={i} className="rounded-2xl bg-teal/5 p-4">
                            <p className="font-serif text-2xl font-bold text-teal">{c.value}</p>
                            <p className="mt-1 text-xs text-grey/55">{c.label}</p>
                        </div>
                    ))}
                </div>

                {reader && (
                    <div className="mt-8 flex items-center gap-3 border-t border-teal/5 pt-6">
                        {wrapped.reader.avatarUrl ? (
                            <Image src={wrapped.reader.avatarUrl} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cream font-serif text-lg text-teal-dark">
                                {(reader || "?").replace("@", "").charAt(0).toUpperCase()}
                            </div>
                        )}
                        <span className="text-sm font-medium text-grey/70">{reader}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
