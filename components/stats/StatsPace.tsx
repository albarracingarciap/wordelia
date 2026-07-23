"use client";

import * as React from "react";
import { Card } from "../ui/Card";
import { SimpleChart } from "./SimpleChart";
import type { ReadingStatsOverview, StatsRange } from "@/app/app/mi-lectura/estadisticas-actions";

interface StatsPaceProps {
    stats: ReadingStatsOverview | null;
    isLoading?: boolean;
    range: StatsRange;
}

const PROGRESS_TITLE: Record<StatsRange, string> = {
    "7d": "Progreso (últimos 7 días)",
    "30d": "Progreso (últimos 30 días)",
    "year": "Progreso (este año)",
};

export function StatsPace({ stats, isLoading, range }: StatsPaceProps) {
    const [unit, setUnit] = React.useState<"minutes" | "pages">("minutes");

    if (isLoading || !stats) {
        return (
            <div className="space-y-8">
                <div className="h-64 rounded-xl bg-white border border-teal/10 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-40 rounded-xl bg-white border border-teal/10 animate-pulse" />
                    <div className="h-40 rounded-xl bg-white border border-teal/10 animate-pulse" />
                </div>
            </div>
        );
    }

    const progressData = stats.byPeriod.map((b) => ({
        label: b.label,
        value: unit === "minutes" ? b.minutes : b.pages,
        tooltip: unit === "minutes" ? `${b.minutes} min` : `${b.pages} pág`,
    }));
    const hasProgress = progressData.some((d) => d.value > 0);
    const hasTimeOfDay = stats.byTimeOfDay.some((d) => d.value > 0);
    const hasWeekday = stats.byWeekday.some((d) => d.value > 0);

    return (
        <div className="space-y-8">
            <section>
                <div className="flex items-center justify-between mb-4 gap-3">
                    <h3 className="text-sm font-bold text-grey/40 uppercase tracking-widest">{PROGRESS_TITLE[range]}</h3>
                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={() => setUnit("minutes")}
                            className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${unit === "minutes" ? "text-white bg-teal" : "text-grey hover:bg-grey/10 font-medium"}`}
                        >
                            Minutos
                        </button>
                        <button
                            onClick={() => setUnit("pages")}
                            className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${unit === "pages" ? "text-white bg-teal" : "text-grey hover:bg-grey/10 font-medium"}`}
                        >
                            Páginas
                        </button>
                    </div>
                </div>
                <Card className="h-64 flex items-end pb-4 px-4 bg-white">
                    {hasProgress ? (
                        <SimpleChart type="bar" color="bg-teal/60" data={progressData} height={200} />
                    ) : (
                        <div className="w-full text-center text-sm text-grey/50 self-center pb-16">
                            Aún no hay progreso registrado en este periodo.
                        </div>
                    )}
                </Card>
                <p className="text-center text-sm text-grey/60 mt-4 italic">
                    {'"Cuando registras aunque sea poquito, tu hábito se sostiene."'}
                </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <h3 className="font-serif text-teal text-lg">Momentos del día</h3>
                    <div className="pt-4">
                        {hasTimeOfDay ? (
                            <SimpleChart type="bar" color="bg-coral" height={120} data={stats.byTimeOfDay} />
                        ) : (
                            <p className="py-8 text-center text-sm text-grey/50">Sin datos todavía.</p>
                        )}
                    </div>
                </Card>
                <Card>
                    <h3 className="font-serif text-teal text-lg">Días de la semana</h3>
                    <div className="pt-4">
                        {hasWeekday ? (
                            <SimpleChart type="bar" color="bg-teal" height={120} data={stats.byWeekday} />
                        ) : (
                            <p className="py-8 text-center text-sm text-grey/50">Sin datos todavía.</p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
