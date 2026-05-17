import { BookOpen, GraduationCap, Heart, LockKeyhole, Sparkles, UsersRound } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { ClubTemplateId } from "@/app/app/clubs/crear/CreateClubClient";
import type { ReactNode } from "react";

export interface ClubTemplate {
    id: ClubTemplateId;
    title: string;
    subtitle: string;
    description: string;
    icon: ReactNode;
    highlights: string[];
}

export const CLUB_TEMPLATES: ClubTemplate[] = [
    {
        id: "slow",
        title: "Lectura sin prisas",
        subtitle: "Para avanzar juntos con calma",
        description: "Ideal para clubs pequeños que quieren conversación constante sin presión semanal.",
        icon: <BookOpen size={22} />,
        highlights: ["Ritmo suave", "Spoilers por niveles", "Normas cuidadas"],
    },
    {
        id: "deep",
        title: "Análisis literario",
        subtitle: "Para leer con lupa",
        description: "Pensado para clásicos, ensayo o lecturas donde importan contexto, símbolos y estilo.",
        icon: <GraduationCap size={22} />,
        highlights: ["Preguntas guía", "Debate profundo", "Privacidad controlada"],
    },
    {
        id: "social",
        title: "Club social",
        subtitle: "Para crear hábito y comunidad",
        description: "Perfecto para grupos abiertos donde lo importante es participar, recomendar y descubrir.",
        icon: <UsersRound size={22} />,
        highlights: ["Público", "Conversación ligera", "Entrada fácil"],
    },
    {
        id: "private",
        title: "Círculo privado",
        subtitle: "Para grupos cerrados",
        description: "Un espacio más íntimo, por invitación o código, para leer con gente conocida.",
        icon: <LockKeyhole size={22} />,
        highlights: ["Privado", "Código de acceso", "Pocas normas claras"],
    },
    {
        id: "challenge",
        title: "Reto de lectura",
        subtitle: "Para mantener energía",
        description: "Orientado a retos con calendario, hitos visibles y un objetivo compartido.",
        icon: <Sparkles size={22} />,
        highlights: ["Ritmo intenso", "Checkpoints", "Alta actividad"],
    },
    {
        id: "emotional",
        title: "Lectura emocional",
        subtitle: "Para hablar de lo que remueve",
        description: "Un club pensado para novelas donde importan personajes, vínculos e impacto personal.",
        icon: <Heart size={22} />,
        highlights: ["Tono cercano", "Sin prisas", "Cierre reflexivo"],
    },
];

interface StepTemplateProps {
    selectedTemplate?: ClubTemplateId;
    onSelect: (templateId: ClubTemplateId) => void;
}

export function StepTemplate({ selectedTemplate, onSelect }: StepTemplateProps) {
    return (
        <Card className="animate-fade-in-up rounded-3xl">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-teal">Elige una experiencia</h3>
                <p className="mt-2 text-sm leading-6 text-grey/60">
                    La plantilla solo prepara el punto de partida. Después podrás ajustar nombre, normas, privacidad y etiquetas.
                </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                {CLUB_TEMPLATES.map((template) => {
                    const selected = selectedTemplate === template.id;

                    return (
                        <button
                            key={template.id}
                            type="button"
                            onClick={() => onSelect(template.id)}
                            className={`rounded-3xl border p-4 text-left transition-all ${selected
                                ? "border-teal bg-teal/5 shadow-sm ring-1 ring-teal/20"
                                : "border-grey/10 bg-white hover:border-teal/25 hover:bg-cream/40"
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${selected ? "bg-teal text-white" : "bg-teal/8 text-teal"}`}>
                                    {template.icon}
                                </span>
                                <div className="min-w-0">
                                    <h4 className="text-base font-bold text-teal-dark">{template.title}</h4>
                                    <p className="mt-0.5 text-xs font-bold uppercase tracking-[0.12em] text-grey/40">{template.subtitle}</p>
                                </div>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-grey/65">{template.description}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {template.highlights.map((highlight) => (
                                    <span key={highlight} className="rounded-full border border-teal/10 bg-white px-2.5 py-1 text-[11px] font-bold text-teal-dark/70">
                                        {highlight}
                                    </span>
                                ))}
                            </div>
                        </button>
                    );
                })}
            </div>
        </Card>
    );
}
