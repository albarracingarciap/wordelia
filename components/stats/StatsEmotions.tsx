import * as React from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { SimpleChart } from "./SimpleChart";

interface StatsEmotionsProps {
    enabled?: boolean;
    onEnable: () => void;
}

export function StatsEmotions({ enabled = false, onEnable }: StatsEmotionsProps) {
    if (!enabled) {
        return (
            <div className="py-8">
                <Card className="text-center py-12 px-6 max-w-lg mx-auto bg-gradient-to-b from-white to-cream/20">
                    <div className="text-4xl mb-4">😌</div>
                    <h3 className="text-xl font-serif text-teal mb-3">¿Te apetece registrar cómo te sientes?</h3>
                    <p className="text-grey/60 mb-8 leading-relaxed">
                        Solo si quieres. Al registrar tus emociones al leer, Wordelia te ayuda a descubrir qué libros te acompañan mejor en cada momento vital.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Button variant="ghost" onClick={() => console.log("Not now")}>Ahora no</Button>
                        <Button onClick={onEnable}>Activar emociones</Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card title="Mapa emocional (Último mes)">
                <div className="pt-6">
                    <SimpleChart
                        type="bar"
                        color="bg-purple-400"
                        data={[
                            { label: "Calmado", value: 12 },
                            { label: "Inspirado", value: 8 },
                            { label: "Tenso", value: 3 },
                            { label: "Triste", value: 1 },
                            { label: "Alegre", value: 5 },
                        ]}
                    />
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mock content for populated state */}
                <Card title="Emociones por libro">
                    <ul className="space-y-3 mt-2">
                        <li className="flex justify-between items-center text-sm">
                            <span className="text-grey">El cuento de la criada</span>
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">Tenso</span>
                        </li>
                        <li className="flex justify-between items-center text-sm">
                            <span className="text-grey">Seda</span>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">Melancólico</span>
                        </li>
                    </ul>
                </Card>
            </div>
        </div>
    );
}
