import { Card } from "@/components/ui/Card";
import { ClubCard } from "../ClubCard";
import type { CreateClubFormData } from "@/app/app/clubs/crear/CreateClubClient";
import { Check, Lock, Globe2, Mail } from "lucide-react";

interface StepInviteProps {
    data: CreateClubFormData;
    onUpdate: (field: keyof CreateClubFormData, value: CreateClubFormData[keyof CreateClubFormData]) => void;
    selectedTemplateTitle?: string;
}

const privacyLabel: Record<string, string> = {
    public: "Público",
    private: "Privado",
    secret: "Secreto",
};

const spoilerLabel: Record<string, string> = {
    levels: "Spoilers por niveles",
    strict: "Sin spoilers hasta el final",
    free: "Spoilers libres",
};

export function StepInvite({ data, selectedTemplateTitle }: StepInviteProps) {
    const visibleRules = data.rules.filter(rule => rule.trim()).slice(0, 3);
    const privacy = privacyLabel[data.privacy] || "Privado";
    const spoiler = spoilerLabel[data.spoilerPolicy] || "Spoilers por niveles";

    return (
        <div className="space-y-6">
            <Card className="animate-fade-in-up rounded-3xl">
                <div className="mb-6 flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal">
                        <Check className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-teal">Revisa antes de crear</h3>
                        <p className="mt-1 text-sm leading-6 text-grey/60">
                            Cuando lo crees, podrás invitar a tu gente con un código y terminar de preparar la primera lectura.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {selectedTemplateTitle && (
                        <div className="rounded-2xl border border-teal/10 bg-teal/5 p-4 sm:col-span-3">
                            <Check className="mb-3 h-5 w-5 text-teal" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-grey/40">Plantilla</p>
                            <p className="mt-1 text-sm font-bold text-teal-dark">{selectedTemplateTitle}</p>
                        </div>
                    )}
                    <div className="rounded-2xl border border-teal/10 bg-teal/5 p-4">
                        <Globe2 className="mb-3 h-5 w-5 text-teal" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-grey/40">Visibilidad</p>
                        <p className="mt-1 text-sm font-bold text-teal-dark">{privacy}</p>
                    </div>
                    <div className="rounded-2xl border border-teal/10 bg-white p-4">
                        <Lock className="mb-3 h-5 w-5 text-teal" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-grey/40">Spoilers</p>
                        <p className="mt-1 text-sm font-bold text-teal-dark">{spoiler}</p>
                    </div>
                    <div className="rounded-2xl border border-teal/10 bg-white p-4">
                        <Mail className="mb-3 h-5 w-5 text-teal" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-grey/40">Invitación</p>
                        <p className="mt-1 text-sm font-bold text-teal-dark">Código tras crear</p>
                    </div>
                </div>

                {data.tags.length > 0 && (
                    <div className="mt-5">
                        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-grey/40">Etiquetas</p>
                        <div className="flex flex-wrap gap-2">
                            {data.tags.map(tag => (
                                <span key={tag} className="rounded-full border border-teal/10 bg-teal/5 px-3 py-1.5 text-xs font-bold text-teal">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {visibleRules.length > 0 && (
                    <div className="mt-5">
                        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-grey/40">Primeras normas</p>
                        <div className="space-y-2">
                            {visibleRules.map((rule, index) => (
                                <div key={`${rule}-${index}`} className="rounded-2xl border border-grey/10 bg-white px-3 py-2 text-sm leading-5 text-grey/70">
                                    {rule}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Card>

            <div className="mx-auto max-w-sm">
                <div className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-grey/40">Vista previa</div>
                <ClubCard
                    id="preview"
                    name={data.name || "Sin nombre"}
                    description={data.description}
                    currentBook={data.book ? {
                        title: data.book.title || "",
                        author: data.book.author || data.book.authors?.[0] || "",
                        coverUrl: data.book.coverUrl || data.book.cover_url || "",
                    } : null}
                    members={[]}
                    memberCount={1}
                    badges={[{ label: privacy }, ...data.tags.map(tag => ({ label: `#${tag}` }))]}
                    pace={data.pace || "Sin ritmo"}
                    isMember={true}
                    preview={true}
                />
            </div>
        </div>
    );
}
