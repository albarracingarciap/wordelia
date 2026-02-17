import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { SpoilerGuard } from "../SpoilerGuard";

export function GuideAI() {
    const [spoilerLevel, setSpoilerLevel] = React.useState<"none" | "mild" | "strict">("none");

    return (
        <Card className="border border-purple-100 bg-purple-50/30">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">IA</span>
                        <h3 className="font-serif text-lg text-purple-900 font-bold">Guía de discusión</h3>
                    </div>
                    <p className="text-xs text-purple-800/60">"La guía cambia según el nivel de spoilers. Tú mandas."</p>
                </div>

                <div className="flex gap-2 bg-white p-1 rounded-lg border border-purple-100 shadow-sm">
                    <button
                        onClick={() => setSpoilerLevel("none")}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${spoilerLevel === 'none' ? 'bg-purple-100 text-purple-800' : 'text-grey/40 hover:text-purple-500'}`}
                    >
                        Sin spoilers
                    </button>
                    <button
                        onClick={() => setSpoilerLevel("mild")}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${spoilerLevel === 'mild' ? 'bg-orange-100 text-orange-800' : 'text-grey/40 hover:text-orange-500'}`}
                    >
                        Suave
                    </button>
                    <button
                        onClick={() => setSpoilerLevel("strict")}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${spoilerLevel === 'strict' ? 'bg-coral/10 text-coral' : 'text-grey/40 hover:text-coral'}`}
                    >
                        Total
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Questions */}
                <div>
                    <h4 className="text-xs font-bold text-purple-900 uppercase tracking-widest mb-3">Preguntas sugeridas</h4>
                    <SpoilerGuard level={spoilerLevel === 'none' ? 'none' : 'mild'}>
                        <ul className="space-y-3">
                            <li className="flex gap-3 text-sm text-purple-900/80 bg-white p-3 rounded-lg border border-purple-100">
                                <span className="font-bold text-purple-400">1</span>
                                ¿Qué os parece la evolución de Hervé Joncour en este segundo viaje?
                            </li>
                            <li className="flex gap-3 text-sm text-purple-900/80 bg-white p-3 rounded-lg border border-purple-100">
                                <span className="font-bold text-purple-400">2</span>
                                El símbolo de la jaula de pájaros: ¿Libertad o posesión?
                            </li>
                        </ul>
                    </SpoilerGuard>
                </div>

                {/* Themes */}
                <div>
                    <h4 className="text-xs font-bold text-purple-900 uppercase tracking-widest mb-3">Temas clave</h4>
                    <SpoilerGuard level={spoilerLevel === 'strict' ? 'strict' : 'none'}>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-white border border-purple-100 rounded-full text-xs font-bold text-purple-800">Obsesión silenciosa</span>
                            <span className="px-3 py-1 bg-white border border-purple-100 rounded-full text-xs font-bold text-purple-800">El viaje interior</span>
                        </div>
                    </SpoilerGuard>
                </div>
            </div>
        </Card>
    );
}
