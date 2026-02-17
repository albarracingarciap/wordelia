import { Card } from "../ui/Card";
import { SimpleChart, SparkLine } from "./SimpleChart";

interface StatsSummaryProps {
    sessions: number;
    timeMinutes: number;
    pages: number;
    finishedBooks: number;
}

export function StatsSummary({ sessions, timeMinutes, pages, finishedBooks }: StatsSummaryProps) {
    return (
        <div className="space-y-6">
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Sesiones", value: sessions, sub: "Similar semana pasada" },
                    { label: "Tiempo", value: `${Math.floor(timeMinutes / 60)}h ${timeMinutes % 60}m`, sub: "+15m vs semana pasada" },
                    { label: "Páginas", value: pages, sub: "Gran ritmo" },
                    { label: "Libros term.", value: finishedBooks, sub: "En el último mes" }
                ].map((m, i) => (
                    <div key={i} className="bg-white rounded-xl p-5 border border-teal/5 flex flex-col justify-between h-28 shadow-sm">
                        <span className="text-3xl font-serif text-teal-dark">{m.value}</span>
                        <div>
                            <p className="text-xs font-bold text-grey/60 uppercase tracking-widest">{m.label}</p>
                            <p className="text-[10px] text-grey/40 mt-1">{m.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Featured Chart: Weekly Calm */}
                <div className="bg-[#FAF9F6] rounded-xl p-6 border border-teal/10">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-serif text-teal text-lg">Tu semana en calma</h3>
                        <span className="text-xs text-coral font-medium px-2 py-0.5 bg-coral/10 rounded-full">Mejor día: Martes</span>
                    </div>

                    <SimpleChart
                        type="bar"
                        data={[
                            { label: "L", value: 20 },
                            { label: "M", value: 45 },
                            { label: "X", value: 30 },
                            { label: "J", value: 15 },
                            { label: "V", value: 60 },
                            { label: "S", value: 90 },
                            { label: "D", value: 40 },
                        ]}
                    />

                    <div className="mt-6 pt-4 border-t border-teal/5 text-center">
                        <p className="text-sm text-grey/80 italic">"Tu mejor momento suele ser a última hora. ¿Te va bien ese ritmo?"</p>
                    </div>
                </div>

                {/* Formats */}
                <div className="bg-white rounded-xl p-6 border border-teal/10 flex flex-col justify-center">
                    <h3 className="font-serif text-teal text-lg mb-6">Formatos</h3>
                    <div className="space-y-4">
                        {[
                            { label: "Papel", pct: 60, color: "bg-teal" },
                            { label: "Ebook", pct: 25, color: "bg-coral" },
                            { label: "Audio", pct: 15, color: "bg-yellow-400" },
                        ].map(fmt => (
                            <div key={fmt.label}>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="font-medium text-grey">{fmt.label}</span>
                                    <span className="text-grey/60">{fmt.pct}%</span>
                                </div>
                                <div className="w-full h-2 bg-grey/10 rounded-full overflow-hidden">
                                    <div className={`h-full ${fmt.color}`} style={{ width: `${fmt.pct}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-grey/40 text-center mt-8">No hay formato mejor. El tuyo es el que te acompaña.</p>
                </div>
            </div>
        </div>
    );
}
