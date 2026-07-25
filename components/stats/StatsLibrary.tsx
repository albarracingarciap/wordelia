import { Star } from "lucide-react";
import { Card } from "../ui/Card";
import { SimpleChart } from "./SimpleChart";
import type { ReadingStatsOverview, ReadingInsights } from "@/app/app/mi-lectura/estadisticas-actions";

interface StatsLibraryProps {
    stats: ReadingStatsOverview | null;
    insights?: ReadingInsights | null;
    isLoading?: boolean;
}

export function StatsLibrary({ stats, insights, isLoading }: StatsLibraryProps) {
    if (isLoading || !stats) {
        return (
            <div className="space-y-6">
                <div className="h-48 rounded-xl bg-white border border-teal/10 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-40 rounded-xl bg-white border border-teal/10 animate-pulse" />
                    <div className="h-40 rounded-xl bg-white border border-teal/10 animate-pulse" />
                </div>
            </div>
        );
    }

    const { genres, authors, avgPages, booksInRange } = stats;

    return (
        <div className="space-y-6">
            <section>
                <Card>
                    <h3 className="font-serif text-teal text-lg">Géneros y temas</h3>
                    {genres.length > 0 ? (
                        <div className="space-y-3 mt-4">
                            {genres.map((tag) => (
                                <div key={tag.label} className="flex items-center gap-3">
                                    <span className="w-24 text-sm text-grey truncate text-right">{tag.label}</span>
                                    <div className="flex-1 h-2 bg-grey/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-teal opacity-60" style={{ width: `${tag.pct}%` }} />
                                    </div>
                                    <span className="w-8 text-xs text-grey/60">{tag.count}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="py-8 text-center text-sm text-grey/50">
                            Todavía no hay géneros para mostrar. Se van clasificando a medida que lees.
                        </p>
                    )}
                </Card>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <h3 className="font-serif text-teal text-lg mb-1">Autores recurrentes</h3>
                    {authors.length > 0 ? (
                        <ul className="space-y-3 mt-2">
                            {authors.map((author, i) => (
                                <li key={i} className="flex justify-between items-center py-1 border-b border-dashed border-teal/5 last:border-0">
                                    <span className="text-sm text-grey-dark truncate pr-2">{author.name}</span>
                                    <span className="shrink-0 text-xs font-bold text-teal bg-teal/5 px-2 py-0.5 rounded-full">
                                        {author.count} {author.count === 1 ? "libro" : "libros"}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="py-6 text-center text-sm text-grey/50">Sin autores para mostrar aún.</p>
                    )}
                </Card>

                <Card className="bg-[#D8E2DC]/20 border-none flex flex-col justify-center">
                    <h3 className="font-serif text-teal text-lg mb-4 text-center">Longitud</h3>
                    <div className="flex justify-around text-center mb-4">
                        <div>
                            <span className="block text-2xl font-bold text-teal-dark">{avgPages ?? "—"}</span>
                            <span className="text-xs text-grey/60 uppercase tracking-widest">Promedio pág.</span>
                        </div>
                        <div>
                            <span className="block text-2xl font-bold text-teal-dark">{booksInRange}</span>
                            <span className="text-xs text-grey/60 uppercase tracking-widest">Libros leídos</span>
                        </div>
                    </div>
                    <p className="text-center text-[10px] text-grey/40 opacity-70">{'"Esto no es un examen. Es una foto de tus gustos."'}</p>
                </Card>
            </div>

            {/* Valoraciones (histórico) + Libros terminados por mes (este año) */}
            {insights && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="font-serif text-teal text-lg">Tus valoraciones</h3>
                            {insights.ratingsAvg !== null && (
                                <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                                    <Star className="h-3 w-3 fill-current" /> {insights.ratingsAvg} media
                                </span>
                            )}
                        </div>
                        {insights.ratingsTotal > 0 ? (
                            <div className="space-y-2 mt-4">
                                {[...insights.ratings].reverse().map((r) => {
                                    const max = Math.max(1, ...insights.ratings.map((x) => x.count));
                                    const pct = Math.round((r.count / max) * 100);
                                    return (
                                        <div key={r.star} className="flex items-center gap-2">
                                            <span className="flex w-10 shrink-0 items-center justify-end gap-0.5 text-xs text-grey/70">
                                                {r.star}<Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                            </span>
                                            <div className="flex-1 h-2.5 bg-grey/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-amber-400/80 rounded-full" style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="w-6 text-xs text-grey/60 text-right">{r.count}</span>
                                        </div>
                                    );
                                })}
                                <p className="pt-1 text-[11px] text-grey/45">{insights.ratingsTotal} libros valorados en total.</p>
                            </div>
                        ) : (
                            <p className="py-6 text-center text-sm text-grey/50">Aún no has valorado libros.</p>
                        )}
                    </Card>

                    <Card>
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="font-serif text-teal text-lg">Terminados por mes</h3>
                            <span className="text-xs text-grey/50 whitespace-nowrap">{insights.booksThisYear} este año</span>
                        </div>
                        {insights.booksThisYear > 0 ? (
                            <div className="pt-6">
                                <SimpleChart type="bar" color="bg-teal/60" height={140} data={insights.booksByMonth} />
                                {insights.bestMonth && (
                                    <p className="pt-3 text-center text-[11px] text-grey/45">Tu mejor mes: {insights.bestMonth}.</p>
                                )}
                            </div>
                        ) : (
                            <p className="py-6 text-center text-sm text-grey/50">Todavía no has terminado libros este año.</p>
                        )}
                    </Card>
                </div>
            )}

            {/* Formatos (real) + Ritmo de lectura */}
            {insights && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <h3 className="font-serif text-teal text-lg mb-1">Formatos</h3>
                        {insights.formatsTotal > 0 ? (
                            <div className="space-y-4 mt-4">
                                {insights.formats.map((fmt) => (
                                    <div key={fmt.key}>
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span className="font-medium text-grey">{fmt.label}</span>
                                            <span className="text-grey/60">{fmt.pct}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-grey/10 rounded-full overflow-hidden">
                                            <div className={`h-full ${FORMAT_COLORS[fmt.key]}`} style={{ width: `${fmt.pct}%` }} />
                                        </div>
                                    </div>
                                ))}
                                <p className="text-xs text-grey/40 text-center pt-2">No hay formato mejor. El tuyo es el que te acompaña.</p>
                            </div>
                        ) : (
                            <p className="py-8 text-center text-sm text-grey/50">
                                Marca el formato al registrar tus lecturas y aparecerá aquí.
                            </p>
                        )}
                    </Card>

                    <Card className="bg-[#D8E2DC]/20 border-none flex flex-col justify-center">
                        <h3 className="font-serif text-teal text-lg mb-4 text-center">Ritmo de lectura</h3>
                        <div className="flex justify-around text-center">
                            <div>
                                <span className="block text-2xl font-bold text-teal-dark">{insights.pagesPerHour ?? "—"}</span>
                                <span className="text-xs text-grey/60 uppercase tracking-widest">Pág. / hora</span>
                            </div>
                            <div>
                                <span className="block text-2xl font-bold text-teal-dark">{insights.avgDaysToFinish ?? "—"}</span>
                                <span className="text-xs text-grey/60 uppercase tracking-widest">Días / libro</span>
                            </div>
                            {insights.listeningMinutes > 0 && (
                                <div>
                                    <span className="block text-2xl font-bold text-teal-dark">{formatListening(insights.listeningMinutes)}</span>
                                    <span className="text-xs text-grey/60 uppercase tracking-widest">Audio (año)</span>
                                </div>
                            )}
                        </div>
                        <p className="text-center text-[10px] text-grey/40 opacity-70 mt-4">
                            {insights.pagesPerHour === null && insights.listeningMinutes === 0
                                ? "Registra el tiempo de tus sesiones para ver tu ritmo."
                                : insights.listeningMinutes > 0
                                    ? "Páginas y horas de escucha conviven, sin presión."
                                    : "Tu velocidad media, sin presión."}
                        </p>
                    </Card>
                </div>
            )}
        </div>
    );
}

const FORMAT_COLORS: Record<"paper" | "ebook" | "audio", string> = {
    paper: "bg-teal",
    ebook: "bg-coral",
    audio: "bg-yellow-400",
};

// Minutos escuchados → etiqueta compacta para la tarjeta ("12h" / "45m").
function formatListening(minutes: number): string {
    if (minutes >= 60) return `${Math.round(minutes / 60)}h`;
    return `${minutes}m`;
}
