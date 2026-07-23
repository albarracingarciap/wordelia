import Link from "next/link";
import { TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import { SimpleChart } from "./SimpleChart";
import { HeatmapCalendar } from "./HeatmapCalendar";
import type { ReadingStatsOverview, ReadingInsights, StatsRange } from "@/app/app/mi-lectura/estadisticas-actions";

interface StatsSummaryProps {
    stats: ReadingStatsOverview | null;
    insights?: ReadingInsights | null;
    isLoading?: boolean;
    range: StatsRange;
}

const PREV_WORD: Record<StatsRange, string> = {
    "7d": "semana anterior",
    "30d": "mes anterior",
    "year": "año anterior",
};

const FINISHED_WORD: Record<StatsRange, string> = {
    "7d": "esta semana",
    "30d": "este mes",
    "year": "este año",
};

function deltaLabel(cur: number, prev: number, range: StatsRange, unit = ""): string {
    if (cur === 0 && prev === 0) return "Sin registros aún";
    const diff = cur - prev;
    if (diff === 0) return `Igual que la ${PREV_WORD[range]}`;
    const sign = diff > 0 ? "+" : "−";
    return `${sign}${Math.abs(diff)}${unit} vs ${PREV_WORD[range]}`;
}

export function StatsSummary({ stats, insights, isLoading, range }: StatsSummaryProps) {
    if (isLoading || !stats) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-28 rounded-xl bg-white border border-teal/5 animate-pulse" />
                    ))}
                </div>
                <div className="h-64 rounded-xl bg-[#FAF9F6] border border-teal/10 animate-pulse" />
            </div>
        );
    }

    const { minutes, sessions, pages, finishedBooks } = stats;
    const timeStr = `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

    const metrics = [
        { label: "Sesiones", value: sessions, sub: deltaLabel(sessions, stats.prevSessions, range) },
        { label: "Tiempo", value: timeStr, sub: deltaLabel(minutes, stats.prevMinutes, range, "m") },
        { label: "Páginas", value: pages, sub: deltaLabel(pages, stats.prevPages, range) },
        { label: "Libros term.", value: finishedBooks, sub: FINISHED_WORD[range] },
    ];

    const weekdayData = stats.byWeekday.map((d) => ({ label: d.label, value: d.value }));
    const hasWeekdayData = weekdayData.some((d) => d.value > 0);

    return (
        <div className="space-y-6">
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((m, i) => (
                    <div key={i} className="bg-white rounded-xl p-5 border border-teal/5 flex flex-col justify-between h-28 shadow-sm">
                        <span className="text-3xl font-serif text-teal-dark">{m.value}</span>
                        <div>
                            <p className="text-xs font-bold text-grey/60 uppercase tracking-widest">{m.label}</p>
                            <p className="text-[10px] text-grey/40 mt-1">{m.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Proyección del año (a este ritmo) */}
            {insights && insights.projectedBooks > 0 && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-teal/10 bg-teal/[0.04] px-4 py-3">
                    <TrendingUp className="h-4 w-4 shrink-0 text-teal" />
                    <p className="text-sm text-grey-dark">
                        A este ritmo terminarás <span className="font-bold text-teal-dark">{insights.projectedBooks}</span> libros este año.
                    </p>
                    {insights.goalTarget && (
                        <span className="text-xs text-grey/50">
                            Tu meta: {insights.goalTarget}{insights.projectedBooks >= insights.goalTarget ? " · ¡vas a cumplirla!" : ""}
                        </span>
                    )}
                </div>
            )}

            {/* Featured Chart: Weekly Calm */}
            <div className="bg-[#FAF9F6] rounded-xl p-6 border border-teal/10">
                <div className="flex items-center justify-between mb-6 gap-3">
                    <h3 className="font-serif text-teal text-lg">Tu semana en calma</h3>
                    {stats.bestWeekday && (
                        <span className="text-xs text-coral font-medium px-2 py-0.5 bg-coral/10 rounded-full whitespace-nowrap">
                            Mejor día: {stats.bestWeekday}
                        </span>
                    )}
                </div>

                {hasWeekdayData ? (
                    <>
                        <SimpleChart type="bar" data={weekdayData} />
                        <div className="mt-6 pt-4 border-t border-teal/5 text-center">
                            <p className="text-sm text-grey/80 italic">
                                {insightForWeekday(stats)}
                            </p>
                        </div>
                    </>
                ) : (
                    <div className="py-10 text-center text-sm text-grey/50">
                        Aún no hay sesiones registradas en este periodo.
                    </div>
                )}
            </div>

            {/* Heatmap de constancia (siempre últimos 12 meses, independiente del rango) */}
            {insights && insights.heatmap.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-teal/10">
                    <div className="flex items-center justify-between mb-4 gap-3">
                        <h3 className="font-serif text-teal text-lg">Tu año lector</h3>
                        <span className="text-xs text-grey/50 whitespace-nowrap">
                            {insights.daysRead} {insights.daysRead === 1 ? "día leído" : "días leídos"}
                        </span>
                    </div>
                    <HeatmapCalendar data={insights.heatmap} metric={insights.heatmapMetric} />
                    <p className="mt-4 text-sm text-grey/70 italic text-center">{insightForHeatmap(insights)}</p>
                </div>
            )}

            {/* Compartir "Tu año en lectura" */}
            {insights?.username && (
                <Link
                    href={`/anio/${insights.username}`}
                    target="_blank"
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-coral/20 bg-gradient-to-br from-coral/5 to-cream/40 p-5 transition-colors hover:border-coral/35"
                >
                    <span className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-coral/10 text-coral">
                            <Sparkles className="h-5 w-5" />
                        </span>
                        <span>
                            <span className="block font-serif text-lg text-teal-dark">Tu año en lectura</span>
                            <span className="block text-xs text-grey/55">Un resumen precioso para ver y compartir.</span>
                        </span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white">
                        Ver y compartir <ArrowRight className="h-4 w-4" />
                    </span>
                </Link>
            )}
        </div>
    );
}

// Frase natural para el heatmap de constancia.
function insightForHeatmap(insights: ReadingInsights): string {
    const { daysRead } = insights;
    if (daysRead >= 200) return "Impresionante constancia. La lectura es parte de tu día a día.";
    if (daysRead >= 100) return "Vas construyendo un hábito sólido, día a día.";
    if (daysRead >= 30) return "Poco a poco, tus días de lectura van sumando.";
    return "Cada cuadrito es un rato para ti. Sin prisa.";
}

// Frase en lenguaje natural según el momento de lectura dominante.
function insightForWeekday(stats: ReadingStatsOverview): string {
    const tod = stats.byTimeOfDay;
    const top = [...tod].sort((a, b) => b.value - a.value)[0];
    if (top && top.value > 0) {
        if (top.label === "Noche") return "Tu mejor momento suele ser a última hora. ¿Te va bien ese ritmo?";
        if (top.label === "Mañana") return "Las mañanas son tu momento de lectura. Empezar el día leyendo sienta bien.";
        return "Las tardes son tu refugio lector. Un buen hábito.";
    }
    return "Cada rato que lees cuenta, sin prisa.";
}
