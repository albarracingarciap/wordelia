"use client";

import * as React from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Select } from "@/components/ui/Select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";

import { StatsSummary } from "@/components/stats/StatsSummary";
import { StatsPace } from "@/components/stats/StatsPace";
import { StatsLibrary } from "@/components/stats/StatsLibrary";
import { StatsEmotions } from "@/components/stats/StatsEmotions";
import { PrivacyPanel } from "@/components/stats/PrivacyPanel";

export default function StatsPage() {
    const [isPrivacyOpen, setIsPrivacyOpen] = React.useState(false);
    const [emotionsEnabled, setEmotionsEnabled] = React.useState(false);

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
                    { label: "Racha actual", val: "3 días" },
                    { label: "Sesiones", val: "12" },
                    { label: "Páginas", val: "820" },
                    { label: "Libros term.", val: "2" },
                ].map((c, i) => (
                    <div key={i} className="px-3 py-1.5 bg-white border border-teal/10 rounded-full shadow-sm text-xs text-grey flex gap-1.5 items-center">
                        <span className="opacity-60">{c.label}:</span>
                        <span className="font-bold text-teal">{c.val}</span>
                    </div>
                ))}
                <span className="text-[10px] text-grey/40 self-center ml-2">Basado en tus registros (últ. 30 días)</span>
            </div>

            {/* Range Select (Mobile/Desktop) */}
            <div className="flex justify-end mb-4">
                <Select
                    options={[
                        { label: "Últimos 30 días", value: "30d" },
                        { label: "Últimos 7 días", value: "7d" },
                        { label: "Todo el año", value: "year" },
                    ]}
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
                    <StatsSummary
                        sessions={12}
                        timeMinutes={430}
                        pages={820}
                        finishedBooks={2}
                    />
                </TabsContent>

                <TabsContent value="pace">
                    <StatsPace />
                </TabsContent>

                <TabsContent value="library">
                    <StatsLibrary />
                </TabsContent>

                <TabsContent value="emotions">
                    <StatsEmotions
                        enabled={emotionsEnabled}
                        onEnable={() => setEmotionsEnabled(true)}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
