import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ClubCard } from "../ClubCard";

interface StepInviteProps {
    data: any;
    onUpdate: (field: string, value: any) => void;
}

export function StepInvite({ data }: StepInviteProps) {
    return (
        <div className="space-y-6">
            <Card className="animate-fade-in-up text-center py-8">
                <h3 className="text-lg font-serif text-teal mb-2">¡Casi listo!</h3>
                <p className="text-sm text-grey/60 mb-6">Este es el código para invitar a tus amigos</p>

                <div className="bg-teal/5 border-2 border-dashed border-teal/20 rounded-xl p-4 max-w-xs mx-auto mb-4">
                    <span className="text-2xl font-mono font-bold text-teal-dark tracking-widest">WDL-8X2</span>
                </div>
                <p className="text-xs text-grey/40">Puedes compartirlo por WhatsApp o Email.</p>
            </Card>

            <div className="max-w-sm mx-auto opacity-80 pointer-events-none scale-95">
                <div className="text-center text-xs font-bold text-grey/40 uppercase tracking-widest mb-2">Vista Previa</div>
                <ClubCard
                    id="preview"
                    name={data.name || "Sin nombre"}
                    description={data.description}
                    currentBook={data.book}
                    members={[]}
                    memberCount={1}
                    badges={[{ label: data.privacy === 'public' ? 'Público' : 'Privado' }]}
                    pace={data.pace || "Sin ritmo"}
                    isMember={true}
                    preview={true}
                />
            </div>
        </div>
    );
}
