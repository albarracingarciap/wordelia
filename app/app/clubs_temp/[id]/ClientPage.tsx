"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";

import { ClubSummary } from "@/components/club/ClubSummary";
import { ClubFeed } from "@/components/club/ClubFeed";
import { ClubSidebar } from "@/components/club/ClubSidebar";

export default function ClientPage() {
    const params = useParams();
    const clubId = params.id; // Could fetch data based on this

    return (
        <div className="pb-20">
            {/* Custom Header with Meta */}
            <div className="mb-8">
                <SectionHeader
                    eyebrow="CLUB"
                    title="Lectura Calmada" // Mock Data
                    subtitle="Leyendo: Seda — Alessandro Baricco"
                    action={{
                        label: "Hacer check-in",
                        onClick: () => console.log("Check-in"),
                        variant: "primary"
                    }}
                >
                    <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="neutral">Privado</Badge>
                        <Badge variant="brand">Spoilers: Niveles</Badge>
                        <Badge variant="outline">Ritmo: 2 cap/sem</Badge>
                    </div>
                </SectionHeader>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content (8 cols) */}
                <div className="lg:col-span-8">
                    <Tabs defaultValue="summary">
                        <TabsList className="mb-6 sticky top-[64px] z-20 bg-cream/95 backdrop-blur shadow-sm -mx-4 px-4 md:mx-0 md:px-0 md:shadow-none md:bg-transparent md:static">
                            <TabsTrigger value="summary">Resumen</TabsTrigger>
                            <TabsTrigger value="feed">Conversación</TabsTrigger>
                            <TabsTrigger value="checkpoints">Checkpoints</TabsTrigger>
                            <TabsTrigger value="announcements">Anuncios</TabsTrigger>
                        </TabsList>

                        <TabsContent value="summary">
                            <ClubSummary />
                        </TabsContent>

                        <TabsContent value="feed">
                            <ClubFeed />
                        </TabsContent>

                        <TabsContent value="checkpoints">
                            <div className="p-8 text-center text-grey/40 border-2 border-dashed border-grey/10 rounded-xl">
                                Próximamente: Lista detallada de hitos
                            </div>
                        </TabsContent>

                        <TabsContent value="announcements">
                            <div className="p-8 text-center text-grey/40 border-2 border-dashed border-grey/10 rounded-xl">
                                No hay anuncios recientes del moderador
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Sidebar (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                    <ClubSidebar />
                </div>
            </div>
        </div>
    );
}
