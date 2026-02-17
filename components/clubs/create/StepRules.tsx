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

                {/* Rules List (Mock) */}
                <div>
                    <label className="block text-sm font-bold text-grey-dark mb-3">Normas de convivencia</label>
                    <ul className="space-y-2">
                        {[
                            "Debatimos ideas, no personas.",
                            "Spoilers siempre marcados.",
                            "Citas cortas por respeto a derechos.",
                            "Si algo incomoda, repórtalo."
                        ].map((rule, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-grey">
                                <span className="text-teal">•</span>
                                {rule}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </Card>
    );
}
