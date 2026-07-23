"use client";

import * as React from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Select } from "@/components/ui/Select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";

import { StatsSummary } from "@/components/stats/StatsSummary";
import { StatsPace } from "@/components/stats/StatsPace";
import { StatsLibrary } from "@/components/stats/StatsLibrary";
import { StatsEmotions } from "@/components/stats/StatsEmotions";
import { PrivacyPanel } from "@/components/stats/PrivacyPanel";
import { StatsNarrativeCard } from "@/components/assistant/StatsNarrativeCard";

import { getReadingStats, getReadingInsights, type ReadingStatsOverview, type ReadingInsights, type StatsRange } from "@/app/app/mi-lectura/estadisticas-actions";
import { getEmotionBookGroups, type EmotionBookGroup } from "@/app/app/mi-lectura/actions";

const RANGE_OPTIONS: { label: string; value: StatsRange }[] = [
    { label: "Últimos 30 días", value: "30d" },
    { label: "Últimos 7 días", value: "7d" },
    { label: "Todo el año", value: "year" },
];

const RANGE_SHORT: Record<StatsRange, string> = {
    "7d": "últ. 7 días",
    "30d": "últ. 30 días",
    "year": "este año",
};

export default function StatsPage() {
    const [isPrivacyOpen, setIsPrivacyOpen] = React.useState(false);
    const [range, setRange] = React.useState<StatsRange>("30d");
    const [stats, setStats] = React.useState<ReadingStatsOverview | null>(null);
    const [insights, setInsights] = React.useState<ReadingInsights | null>(null);
    const [emotionGroups, setEmotionGroups] = React.useState<EmotionBookGroup[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        let active = true;
        setIsLoading(true);
        // Zona horaria del navegador → para que racha, franjas y días se calculen en local.
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        getReadingStats(range, tz)
            .then((data) => { if (active) setStats(data); })
            .catch((e) => console.error("Error cargando estadísticas:", e))
            .finally(() => { if (active) setIsLoading(false); });
        return () => { active = false; };
    }, [range]);

    // Insights anuales y emociones no dependen del rango (foto global).
    React.useEffect(() => {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        getReadingInsights(tz)
            .then(setInsights)
            .catch((e) => console.error("Error cargando insights:", e));
        getEmotionBookGroups()
            .then(setEmotionGroups)
            .catch((e) => console.error("Error cargando emociones:", e));
    }, []);

    const rangeShort = RANGE_SHORT[range];

    return (
        <div>
            {/* Header */}
            <SectionHeader
                eyebrow="MI LECTURA"
                title="Estadísticas"
                subtitle="Sin comparaciones. Solo tu ritmo."
                action={{
                    label: "Privacidad",
                    onClick: () => setIsPrivacyOpen(!isPrivacyOpen),
                    variant: "ghost"
                }}
            />

            <PrivacyPanel isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />

            {/* Context Chips (Header Extra) */}
            <div className="flex flex-wrap gap-3 mb-8 px-1">
                {[
                    { label: "Racha actual", val: stats ? `${stats.streak} ${stats.streak === 1 ? "día" : "días"}` : "—" },
                    { label: "Sesiones", val: stats ? String(stats.sessions) : "—" },
                    { label: "Páginas", val: stats ? String(stats.pages) : "—" },
                    { label: "Libros term.", val: stats ? String(stats.finishedBooks) : "—" },
                ].map((c, i) => (
                    <div key={i} className="px-3 py-1.5 bg-white border border-teal/10 rounded-full shadow-sm text-xs text-grey flex gap-1.5 items-center">
                        <span className="opacity-60">{c.label}:</span>
                        <span className="font-bold text-teal">{c.val}</span>
                    </div>
                ))}
                <span className="text-[10px] text-grey/40 self-center ml-2">Basado en tus registros ({rangeShort})</span>
            </div>

            {/* Range Select (Mobile/Desktop) */}
            <div className="flex justify-end mb-4">
                <Select
                    options={RANGE_OPTIONS}
                    value={range}
                    onChange={(e) => setRange(e.target.value as StatsRange)}
                />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="summary">
                <TabsList>
                    <TabsTrigger value="summary">Resumen</TabsTrigger>
                    <TabsTrigger value="pace">Ritmo</TabsTrigger>
                    <TabsTrigger value="library">Biblioteca</TabsTrigger>
                    <TabsTrigger value="emotions">Emociones</TabsTrigger>
                </TabsList>

                <TabsContent value="summary">
                    <StatsNarrativeCard />
                    <StatsSummary stats={stats} insights={insights} isLoading={isLoading} range={range} />
                </TabsContent>

                <TabsContent value="pace">
                    <StatsPace stats={stats} isLoading={isLoading} range={range} />
                </TabsContent>

                <TabsContent value="library">
                    <StatsLibrary stats={stats} insights={insights} isLoading={isLoading} />
                </TabsContent>

                <TabsContent value="emotions">
                    <StatsEmotions groups={emotionGroups} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
