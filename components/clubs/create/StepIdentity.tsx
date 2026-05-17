import * as React from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import type { CreateClubFormData } from "@/app/app/clubs/crear/CreateClubClient";
import { X } from "lucide-react";

interface StepIdentityProps {
    data: CreateClubFormData;
    onUpdate: (field: keyof CreateClubFormData, value: CreateClubFormData[keyof CreateClubFormData]) => void;
    selectedTemplateTitle?: string;
}

export function StepIdentity({ data, onUpdate, selectedTemplateTitle }: StepIdentityProps) {
    const [tagInput, setTagInput] = React.useState("");

    const addTag = (rawTag: string) => {
        const tag = rawTag.trim().replace(/^#/, "").replace(/\s+/g, "-").toLowerCase();
        if (!tag || data.tags.includes(tag)) return;

        onUpdate("tags", [...data.tags, tag]);
        setTagInput("");
    };

    const removeTag = (tag: string) => {
        onUpdate("tags", data.tags.filter(item => item !== tag));
    };

    return (
        <Card className="animate-fade-in-up rounded-3xl">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-teal">Identidad del club</h3>
                {selectedTemplateTitle && (
                    <p className="mt-2 inline-flex rounded-full bg-teal/5 px-3 py-1 text-xs font-bold text-teal-dark">
                        Plantilla: {selectedTemplateTitle}
                    </p>
                )}
            </div>

            <div className="space-y-6">
                <div>
                    <label className="mb-1.5 block text-sm font-bold text-grey-dark">
                        Nombre del club <span className="text-coral">*</span>
                    </label>
                    <Input
                        placeholder="Ej. Lecturas con calma"
                        value={data.name}
                        onChange={(event) => onUpdate("name", event.target.value)}
                        autoFocus
                        className="h-12 text-base"
                    />
                    <p className="mt-1 text-xs text-grey/50">Puedes cambiarlo luego.</p>
                </div>

                <div>
                    <label className="mb-3 block text-sm font-bold text-grey-dark">Tipo de club</label>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {[
                            { value: "guided" as const, label: "Lectura guiada", desc: "Leemos juntos paso a paso. Ideal para primeras lecturas." },
                            { value: "analysis" as const, label: "Club de análisis", desc: "Ya lo hemos leído. Nos reunimos para profundizar." },
                        ].map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => onUpdate("readingType", option.value)}
                                className={`rounded-2xl border p-4 text-left transition-all ${data.readingType === option.value ? "border-teal bg-teal/5 ring-1 ring-teal/20" : "border-grey/10 bg-white hover:border-teal/30"}`}
                            >
                                <div className="mb-1 text-sm font-bold text-grey-dark">{option.label}</div>
                                <div className="text-xs leading-5 text-grey/60">{option.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-bold text-grey-dark">¿De qué va este club?</label>
                    <textarea
                        className="min-h-[120px] w-full resize-none rounded-2xl border border-grey/20 bg-white px-4 py-3 text-base text-grey-dark placeholder:text-grey/40 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/20"
                        placeholder="Leemos sin prisa y debatimos con respeto..."
                        value={data.description}
                        onChange={(event) => onUpdate("description", event.target.value)}
                    />
                    <p className="mt-1 text-xs text-grey/50">2-3 líneas bastan.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-bold text-grey-dark">Idioma</label>
                        <Select
                            className="h-12 w-full"
                            options={[
                                { label: "Español", value: "es" },
                                { label: "English", value: "en" },
                                { label: "Català", value: "ca" },
                            ]}
                            value={data.language}
                            onChange={(event) => onUpdate("language", event.target.value)}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-bold text-grey-dark">Precio opcional</label>
                        <div className="relative">
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={data.price || ""}
                                onChange={(event) => onUpdate("price", event.target.value)}
                                className="h-12 pl-12 text-base"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-grey/60">€</span>
                        </div>
                        <p className="mt-1 text-[10px] text-grey/50">Déjalo vacío para gratuito.</p>
                    </div>
                </div>

                <div>
                    <label className="mb-2 block text-sm font-bold text-grey-dark">Etiquetas</label>
                    {data.tags.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                            {data.tags.map((tag) => (
                                <span key={tag} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-teal/10 bg-teal/5 px-3 text-sm font-bold text-teal">
                                    #{tag}
                                    <button
                                        type="button"
                                        onClick={() => removeTag(tag)}
                                        className="rounded-full p-0.5 text-teal/60 transition-colors hover:bg-teal/10 hover:text-coral"
                                        aria-label={`Eliminar etiqueta ${tag}`}
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                    <Input
                        placeholder="Escribe una etiqueta y pulsa Enter"
                        value={tagInput}
                        onChange={(event) => setTagInput(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === ",") {
                                event.preventDefault();
                                addTag(tagInput);
                            }

                            if (event.key === "Backspace" && !tagInput && data.tags.length > 0) {
                                removeTag(data.tags[data.tags.length - 1]);
                            }
                        }}
                        onBlur={() => addTag(tagInput)}
                        className="h-12 text-base"
                    />
                    <p className="mt-1 text-xs text-grey/50">Ej. #clásicos, #feminismo, #scifi.</p>
                </div>
            </div>

            <div className="mt-8 border-t border-black/5 pt-6 text-center">
                <p className="text-sm italic text-grey/60">&ldquo;Un buen club empieza con un propósito sencillo.&rdquo;</p>
            </div>
        </Card>
    );
}
