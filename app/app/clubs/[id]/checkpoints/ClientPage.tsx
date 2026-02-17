"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SpoilerGuard } from "@/components/club/SpoilerGuard";
import { CheckpointsList } from "@/components/club/checkpoints/CheckpointsList";
import { CheckpointDetail } from "@/components/club/checkpoints/CheckpointDetail";

// Mock Data
const CHECKPOINTS = [
    { id: "cp1", title: "Checkpoint 1", range: "p. 1 - 60", status: "completed" as const, checkins: 45, posts: 12 },
    { id: "cp2", title: "Checkpoint 2", range: "p. 61 - 120", status: "current" as const, checkins: 12, posts: 34, dueAt: "Dom 19" },
    { id: "cp3", title: "Checkpoint 3", range: "p. 121 - 180", status: "upcoming" as const, checkins: 0, posts: 0 },
    { id: "cp4", title: "Checkpoint 4", range: "p. 181 - 240", status: "upcoming" as const, checkins: 0, posts: 0 },
];

export default function ClientPage() {
    const params = useParams();
    const router = useRouter();
    const [activeId, setActiveId] = React.useState("cp2");

    const activeCheckpoint = CHECKPOINTS.find(c => c.id === activeId) || CHECKPOINTS[0];

    return (
        <div className="pb-20">
            {/* Header */}
            <SectionHeader
                eyebrow="CLUB"
                title="Checkpoints"
                subtitle="Lee por tramos, conversa con calma."
                action={{
                    label: "Volver al club",
                    onClick: () => router.push(`/app/clubs/${params.id}`), // Safe to assume id exists if page rendered
                    variant: "ghost"
                }}
            />

            <div className="flex flex-wrap gap-4 items-center text-xs text-grey/60 border-t border-black/5 pt-4 w-full mb-8">
                <div className="flex gap-2 items-center">
                    <span className="font-bold text-grey-dark">Libro:</span> Seda
                </div>
                <div className="w-1 h-1 bg-grey/20 rounded-full"></div>
                <div className="flex gap-2 items-center">
                    <span className="font-bold text-grey-dark">Ritmo:</span> 2 cap/semana
                </div>
                <div className="w-1 h-1 bg-grey/20 rounded-full"></div>
                <div className="flex gap-2 items-center">
                    <span className="font-bold text-grey-dark">Spoilers:</span> Por niveles
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
                {/* Sidebar (4 cols) */}
                <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">
                    <CheckpointsList
                        checkpoints={CHECKPOINTS}
                        activeId={activeId}
                        onSelect={setActiveId}
                    />
                </div>

                {/* Detail (8 cols) */}
                <div className="lg:col-span-8 order-1 lg:order-2">
                    <CheckpointDetail checkpoint={activeCheckpoint} />
                </div>
            </div>
        </div>
    );
}
