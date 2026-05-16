import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import type { CreateClubFormData } from "@/app/app/clubs/crear/CreateClubClient";
import { Check, Plus, X } from "lucide-react";

interface StepRulesProps {
    data: CreateClubFormData;
    onUpdate: (field: keyof CreateClubFormData, value: CreateClubFormData[keyof CreateClubFormData]) => void;
}

const PRIVACY_OPTIONS = [
    { value: "public", label: "Público", desc: "Visible en Explorar. Cualquiera puede entrar." },
    { value: "private", label: "Privado", desc: "Visible, pero requiere aprobación." },
    { value: "secret", label: "Secreto", desc: "Oculto. Solo por invitación." },
];

export function StepRules({ data, onUpdate }: StepRulesProps) {
    return (
        <Card className="animate-fade-in-up rounded-3xl">
            <h3 className="mb-6 text-xl font-bold text-teal">Normas y privacidad</h3>

            <div className="space-y-7">
                <section>
                    <label className="mb-3 block text-sm font-bold text-grey-dark">Privacidad del club</label>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        {PRIVACY_OPTIONS.map(option => {
                            const selected = data.privacy === option.value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => onUpdate("privacy", option.value)}
                                    className={`relative rounded-2xl border p-4 pr-10 text-left transition-all ${selected ? "border-teal bg-teal/5 ring-1 ring-teal/20" : "border-grey/10 bg-white hover:border-teal/30"}`}
                                >
                                    {selected && (
                                        <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-teal text-white">
                                            <Check className="h-3.5 w-3.5" />
                                        </span>
                                    )}
                                    <div className="mb-1 text-sm font-bold text-grey-dark">{option.label}</div>
                                    <div className="text-xs leading-5 text-grey/60">{option.desc}</div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-1.5 block text-sm font-bold text-grey-dark">Límite de miembros</label>
                        <input
                            type="number"
                            min="1"
                            placeholder="Sin límite"
                            className="h-12 w-full rounded-2xl border border-grey/20 bg-white px-4 text-base text-grey-dark focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/20"
                            value={data.maxMembers || ""}
                            onChange={(event) => onUpdate("maxMembers", event.target.value)}
                        />
                        <p className="mt-1 text-xs text-grey/50">Déjalo vacío para ilimitado.</p>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-bold text-grey-dark">Spoilers</label>
                        <Select
                            className="h-12 w-full"
                            options={[
                                { label: "Por niveles", value: "levels" },
                                { label: "Estricto", value: "strict" },
                                { label: "Libre", value: "free" },
                            ]}
                            value={data.spoilerPolicy || "levels"}
                            onChange={(event) => onUpdate("spoilerPolicy", event.target.value)}
                        />
                        <p className="mt-1 text-xs text-grey/50">Por niveles es la opción recomendada.</p>
                    </div>
                </section>

                <section>
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <label className="block text-sm font-bold text-grey-dark">Normas de convivencia</label>
                        <button
                            type="button"
                            onClick={() => onUpdate("rules", [...data.rules, ""])}
                            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-teal/10 bg-white px-3 py-1.5 text-xs font-bold text-teal shadow-sm hover:bg-teal/5"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Norma
                        </button>
                    </div>

                    <div className="space-y-3">
                        {data.rules.map((rule, index) => (
                            <div key={index} className="group rounded-2xl border border-grey/10 bg-white px-3 py-3">
                                <div className="flex items-start gap-2">
                                    <span className="mt-2 text-sm font-bold text-teal">{index + 1}</span>
                                    <textarea
                                        rows={2}
                                        className="min-h-12 flex-1 resize-none bg-transparent py-1 text-sm leading-5 text-grey-dark outline-none placeholder:text-grey/40"
                                        value={rule}
                                        placeholder="Escribe una norma..."
                                        onChange={(event) => {
                                            const nextRules = [...data.rules];
                                            nextRules[index] = event.target.value;
                                            onUpdate("rules", nextRules);
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => onUpdate("rules", data.rules.filter((_, ruleIndex) => ruleIndex !== index))}
                                        className="rounded-full p-2 text-grey/35 transition-colors hover:bg-coral/10 hover:text-coral"
                                        aria-label="Borrar norma"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <p className="mt-3 text-xs italic text-grey/40">Puedes editar o borrar las sugeridas.</p>
                </section>
            </div>
        </Card>
    );
}
