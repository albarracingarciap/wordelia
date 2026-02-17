import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function SessionSummary() {
    return (
        <Card className="animate-fade-in text-center p-8 bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
            <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-6 text-2xl">
                ✨
            </div>
            <h2 className="font-serif text-2xl font-bold text-indigo-900 mb-2">Sesión finalizada</h2>
            <p className="text-sm text-grey/60 mb-8 max-w-md mx-auto">
                Gracias a todos por participar. La IA está generando el resumen con las mejores ideas y preguntas abiertas.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left mb-8">
                <div className="bg-white p-4 rounded-xl border border-indigo-50 shadow-sm">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-300 mb-2">Idea clave</h4>
                    <p className="text-sm text-indigo-900 font-medium">"El silencio de Hervé no es debilidad, es su forma de procesar el trauma."</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-indigo-50 shadow-sm">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-300 mb-2">Pregunta abierta</h4>
                    <p className="text-sm text-indigo-900 font-medium">¿La carta final cambia la interpretación de todo el viaje?</p>
                </div>
            </div>

            <div className="flex justify-center gap-4">
                <Button variant="outline">Volver al club</Button>
                <Button variant="primary">Ver próximo hito</Button>
            </div>
        </Card>
    );
}
