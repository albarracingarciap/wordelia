import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Chip } from "@/components/ui/Chip";

interface StepRulesProps {
    data: any;
    onUpdate: (field: string, value: any) => void;
}

export function StepRules({ data, onUpdate }: StepRulesProps) {
    return (
        <Card className="animate-fade-in-up">
            <h3 className="text-lg font-serif text-teal mb-6">Normas y Privacidad</h3>

            <div className="space-y-8">
                {/* Privacy */}
                <div>
                    <label className="block text-sm font-bold text-grey-dark mb-3">Privacidad del club</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                            { value: "public", label: "Público", desc: "Visible en Explorar. Cualquiera entra." },
                            { value: "private", label: "Privado", desc: "Visible, pero requiere aprobación." },
                            { value: "secret", label: "Secreto", desc: "Oculto. Solo invitación." },
                        ].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => onUpdate("privacy", opt.value)}
                                className={`text-left p-3 rounded-xl border transition-all ${data.privacy === opt.value ? 'bg-teal/5 border-teal ring-1 ring-teal/20' : 'bg-white border-grey/10 hover:border-teal/30'}`}
                            >
                                <div className="font-bold text-sm text-grey-dark mb-1">{opt.label}</div>
                                <div className="text-xs text-grey/60 leading-tight">{opt.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Max Members */}
                <div>
                    <label className="block text-sm font-bold text-grey-dark mb-1.5">Límite de miembros</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            placeholder="Sin límite"
                            className="w-32 rounded-xl border border-grey/20 bg-white px-4 py-2 text-sm text-grey-dark focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/20"
                            value={data.maxMembers || ""}
                            onChange={(e) => onUpdate("maxMembers", e.target.value)}
                        />
                        <span className="text-xs text-grey/50">Dejar vacío para ilimitado.</span>
                    </div>
                </div>

                {/* Spoilers */}
                <div>
                    <label className="block text-sm font-bold text-grey-dark mb-1.5">Política de Spoilers</label>
                    <Select
                        options={[
                            { label: "Por niveles (Recomendado)", value: "levels" },
                            { label: "Estricto (Sin spoilers hasta el final)", value: "strict" },
                            { label: "Libre (Peligroso)", value: "free" },
                        ]}
                        value={data.spoilerPolicy || "levels"}
                        onChange={(e) => onUpdate("spoilerPolicy", e.target.value)}
                    />
                    <p className="text-xs text-grey/50 mt-1">"Por niveles es lo más cómodo para cuidar a todo el mundo."</p>
                </div>

                {/* Custom Rules List */}
                <div>
                    <label className="block text-sm font-bold text-grey-dark mb-3">Normas de convivencia</label>

                    <div className="space-y-3 mb-4">
                        {(data.rules || []).map((rule: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 group">
                                <span className="text-teal mt-1.5">•</span>
                                <input
                                    className="flex-1 bg-transparent border-b border-transparent hover:border-grey/20 focus:border-teal focus:outline-none py-1 text-sm text-grey-dark"
                                    value={rule}
                                    onChange={(e) => {
                                        const newRules = [...(data.rules || [])];
                                        newRules[i] = e.target.value;
                                        onUpdate("rules", newRules);
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        const newRules = (data.rules || []).filter((_: any, idx: number) => idx !== i);
                                        onUpdate("rules", newRules);
                                    }}
                                    className="text-grey/20 hover:text-coral opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                    aria-label="Borrar norma"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => {
                            const newRules = [...(data.rules || []), ""];
                            onUpdate("rules", newRules);
                        }}
                        className="text-xs font-bold text-teal hover:underline flex items-center gap-1"
                    >
                        <span className="text-lg leading-none">+</span> Añadir norma
                    </button>
                    <p className="text-xs text-grey/40 mt-2 italic">Puedes editar o borrar las sugeridas.</p>
                </div>
            </div>
        </Card>
    );
}
