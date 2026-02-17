import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// Mock Data
const CHECKPOINTS = [
    { id: "c1", title: "Checkpoint 1: El Comienzo", range: "p. 1 - 60", date: "Dom 12 Oct" },
    { id: "c2", title: "Checkpoint 2: Desarrollo", range: "p. 61 - 120", date: "Dom 19 Oct" },
    { id: "c3", title: "Checkpoint 3: Clímax", range: "p. 121 - 180", date: "Dom 26 Oct" },
];

export function PlanEditor() {
    return (
        <div className="space-y-6">
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-serif text-teal">Plan de lectura</h3>
                        <p className="text-sm text-grey/60">Gestiona los tramos y fechas de discusión.</p>
                    </div>
                    <Button variant="primary" size="sm">+ Nuevo checkpoint</Button>
                </div>

                <div className="space-y-3">
                    {CHECKPOINTS.map((chk, i) => (
                        <div key={chk.id} className="group relative bg-white border border-black/5 rounded-xl p-4 hover:border-teal/30 transition-all flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-center justify-center w-8 h-8 rounded-full bg-grey/5 text-xs font-bold text-grey/40">
                                    {i + 1}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-grey-dark">{chk.title}</h4>
                                    <div className="flex items-center gap-3 text-xs text-grey/60">
                                        <span>{chk.range}</span>
                                        <span>•</span>
                                        <span>{chk.date}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="sm">Editar</Button>
                                <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50">Borrar</Button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-black/5">
                    <div className="flex items-center gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm text-blue-900">Asistente de Planificación</h4>
                            <p className="text-xs text-blue-700/70">¿Quieres que la IA sugiera nuevos checkpoints basados en el libro?</p>
                        </div>
                        <Button variant="outline" size="sm" className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50">Sugerir</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
