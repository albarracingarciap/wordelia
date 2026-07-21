import Link from "next/link";
import { Sparkles, Store, MapPin } from "lucide-react";
import type { BookRecommender } from "@/app/app/librerias/recommendation-actions";

/**
 * Vista "Recomendado por librerías" (presentacional, sin datos propios). La usan la
 * ficha pública (datos server-side) y la in-app (vía BookRecommenders, client).
 */
export function RecommendersView({ recommenders }: { recommenders: BookRecommender[] }) {
    if (recommenders.length === 0) return null;

    return (
        <section className="rounded-2xl border border-teal/10 bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-grey/50">
                <Sparkles className="h-4 w-4 text-coral" aria-hidden="true" /> Recomendado por librerías
            </h2>
            <div className="space-y-3">
                {recommenders.map((r) => {
                    const header = (
                        <span className="inline-flex items-center gap-2">
                            <span
                                className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-teal/5 text-teal"
                                style={r.brandColor ? { color: r.brandColor, backgroundColor: `${r.brandColor}14` } : undefined}
                            >
                                {r.logoUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={r.logoUrl} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    <Store className="h-4 w-4" aria-hidden="true" />
                                )}
                            </span>
                            <span className="min-w-0">
                                <span className="block text-sm font-semibold text-teal-dark">{r.name}</span>
                                {r.city && (
                                    <span className="flex items-center gap-1 text-xs text-grey/50">
                                        <MapPin className="h-3 w-3" aria-hidden="true" /> {r.city}
                                    </span>
                                )}
                            </span>
                        </span>
                    );
                    return (
                        <div key={r.orgId} className="rounded-xl border border-teal/5 bg-cream/40 p-3">
                            {r.slug ? (
                                <Link href={`/librerias/${r.slug}`} className="hover:opacity-80">{header}</Link>
                            ) : header}
                            {r.note && <p className="mt-1.5 text-sm italic leading-relaxed text-grey">“{r.note}”</p>}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
