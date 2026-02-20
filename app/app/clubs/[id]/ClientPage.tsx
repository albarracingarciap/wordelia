"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

import { ClubSummary } from "@/components/club/ClubSummary";
import { ClubFeed } from "@/components/club/ClubFeed";
import { ClubSidebar } from "@/components/club/ClubSidebar";
import { ClubManagement } from "@/components/club/management/ClubManagement";
import { ClubCheckpoints } from "@/components/club/ClubCheckpoints";
import { getClubDetails } from "@/app/app/clubs/[id]/actions";

export default function ClientPage() {
    const params = useParams();
    const router = useRouter();
    const clubId = params.id as string;

    const [club, setClub] = React.useState<any>(null);

    React.useEffect(() => {
        getClubDetails(clubId).then(setClub);
    }, [clubId]);

    return (
        <div className="pb-20">
            {/* Custom Header with Meta */}
            <div className="mb-8">
                <SectionHeader
                    eyebrow="CLUB"
                    title={club?.name || "Cargando..."}
                    subtitle={club?.currentBook ? `Leyendo: ${club.currentBook.book?.title || ""}` : "Sin libro activo"}
                >
                    <div className="flex flex-wrap gap-2 mt-2">
                        {club?.visibility && <Badge variant="neutral">{club.visibility === 'public' ? 'Público' : 'Privado'}</Badge>}
                        {club?.spoiler_policy && <Badge variant="brand">Spoilers: Niveles</Badge>}
                        {club?.pace_unit && <Badge variant="outline">Ritmo: {club.pace_unit}</Badge>}
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
                            {/* Mock Admin Check */}
                            <TabsTrigger value="manage" className="text-teal-dark font-bold">Gestionar</TabsTrigger>
                        </TabsList>

                        <TabsContent value="summary">
                            <ClubSummary club={club} />
                        </TabsContent>

                        <TabsContent value="feed">
                            <ClubFeed />
                        </TabsContent>

                        <TabsContent value="checkpoints">
                            <ClubCheckpoints club={club} />
                        </TabsContent>

                        <TabsContent value="announcements">
                            <div className="p-8 text-center text-grey/40 border-2 border-dashed border-grey/10 rounded-xl">
                                No hay anuncios recientes del moderador
                            </div>
                        </TabsContent>

                        <TabsContent value="manage">
                            <ClubManagement />
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
