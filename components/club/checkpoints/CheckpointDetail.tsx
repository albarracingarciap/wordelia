import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { GuideAI } from "./GuideAI";
import { CheckInModal } from "./CheckInModal";
import { ClubFeed } from "../ClubFeed"; // Reusing feed for simplicity as per specs

interface CheckpointDetailProps {
    checkpoint: any;
}

export function CheckpointDetail({ checkpoint }: CheckpointDetailProps) {
    const [isCheckInOpen, setIsCheckInOpen] = React.useState(false);

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header Card */}
            <Card className="border-teal/20 bg-gradient-to-br from-white to-teal/5">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] uppercase font-bold text-teal bg-white px-2 py-1 rounded border border-teal/10">Checkpoint Actual</span>
                            <span className="text-[10px] text-grey/50">Vence el Domingo</span>
                        </div>
                        <h2 className="font-serif text-3xl text-teal-dark font-bold mb-1">{checkpoint.title}</h2>
                        <p className="text-lg text-grey/60 font-medium">{checkpoint.range}</p>
                    </div>
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                        <Button variant="primary" onClick={() => setIsCheckInOpen(true)}>Hacer Check-in</Button>
                        <Button variant="ghost" className="text-xs">Ver objetivos</Button>
                    </div>
                </div>
            </Card>

            <CheckInModal
                isOpen={isCheckInOpen}
                onClose={() => setIsCheckInOpen(false)}
                checkpointTitle={checkpoint.title}
            />

            {/* AI Guide */}
            <GuideAI />

            {/* Discussion Tabs */}
            <div className="mt-8">
                <Tabs defaultValue="thread">
                    <TabsList className="mb-6">
                        <TabsTrigger value="thread">Hilo del tramo</TabsTrigger>
                        <TabsTrigger value="checkins">
                            Check-ins <span className="ml-2 bg-grey/10 px-1.5 py-0.5 rounded-full text-[10px] text-grey-dark">12</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="thread">
                        <ClubFeed />
                    </TabsContent>

                    <TabsContent value="checkins">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Mock Check-in Grid */}
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="p-4 bg-white rounded-xl border border-black/5 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-teal/10"></div>
                                            <span className="text-xs font-bold text-grey-dark">Usuario {i}</span>
                                        </div>
                                        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">Intrigado</span>
                                    </div>
                                    <p className="text-sm text-grey/70 line-clamp-3">"Me ha parecido fascinante la descripción del lago..."</p>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
