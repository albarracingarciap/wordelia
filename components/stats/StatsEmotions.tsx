import * as React from "react";
import Link from "next/link";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { SimpleChart } from "./SimpleChart";
import type { EmotionBookGroup } from "@/app/app/mi-lectura/actions";

interface StatsEmotionsProps {
    groups: EmotionBookGroup[];
}

const EMOTION_STYLES: Record<string, string> = {
    asombro: "bg-purple-100 text-purple-700",
    tristeza: "bg-blue-100 text-blue-700",
    enojo: "bg-red-100 text-red-700",
    miedo: "bg-slate-200 text-slate-700",
    alegria: "bg-amber-100 text-amber-700",
    disgusto: "bg-lime-100 text-lime-700",
    empatia: "bg-rose-100 text-rose-700",
    confusion: "bg-orange-100 text-orange-700",
    esperanza: "bg-teal/10 text-teal-dark",
};

function cap(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

export function StatsEmotions({ groups }: StatsEmotionsProps) {
    if (!groups || groups.length === 0) {
        return (
            <div className="py-8">
                <Card className="text-center py-12 px-6 max-w-lg mx-auto bg-gradient-to-b from-white to-cream/20">
                    <div className="text-4xl mb-4">😌</div>
                    <h3 className="text-xl font-serif text-teal mb-3">¿Te apetece registrar cómo te sientes?</h3>
                    <p className="text-grey/60 mb-8 leading-relaxed">
                        Al registrar tus emociones al leer (el &ldquo;Pulso de la sesión&rdquo;), Wordelia te ayuda a descubrir qué
                        libros te acompañan mejor en cada momento vital.
                    </p>
                    <Link href="/app/mi-lectura/registrar">
                        <Button>Registrar una lectura</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    const chartData = groups.map((g) => ({ label: cap(g.emotion), value: g.count }));

    // Aplanar libros con su emoción para la lista "Emociones por libro".
    const bookRows = groups
        .flatMap((g) => g.books.map((b) => ({ ...b, emotion: g.emotion })))
        .slice(0, 8);

    return (
        <div className="space-y-6">
            <Card>
                <h3 className="font-serif text-teal text-lg">Mapa emocional</h3>
                <div className="pt-6">
                    <SimpleChart type="bar" color="bg-purple-400" data={chartData} />
                </div>
            </Card>

            <Card>
                <h3 className="font-serif text-teal text-lg mb-1">Emociones por libro</h3>
                <ul className="space-y-3 mt-2">
                    {bookRows.map((b, i) => (
                        <li key={`${b.id}-${i}`} className="flex justify-between items-center gap-3 text-sm">
                            <span className="text-grey truncate">{b.title}</span>
                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs ${EMOTION_STYLES[b.emotion] || "bg-grey/10 text-grey"}`}>
                                {cap(b.emotion)}
                            </span>
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
    );
}
