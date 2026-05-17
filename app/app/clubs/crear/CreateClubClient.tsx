"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { WizardStepper } from "@/components/clubs/create/WizardStepper";
import { StepTemplate, CLUB_TEMPLATES } from "@/components/clubs/create/StepTemplate";
import { StepIdentity } from "@/components/clubs/create/StepIdentity";
import { StepRules } from "@/components/clubs/create/StepRules";
import { StepInvite } from "@/components/clubs/create/StepInvite";
import { createClub } from "./actions";
import { ArrowLeft, AlertCircle } from "lucide-react";

const STEPS = ["Plantilla", "Identidad", "Normas", "Revisar"];

export type ClubTemplateId = "slow" | "deep" | "social" | "private" | "challenge" | "emotional";

export type CreateClubFormData = {
    name: string;
    description: string;
    language: string;
    readingType: string;
    privacy: string;
    maxMembers: string;
    spoilerPolicy: string;
    templateId?: ClubTemplateId;
    tags: string[];
    rules: string[];
    is_official?: boolean;
    price?: string;
    pace?: string;
    book?: {
        id?: string;
        title?: string;
        author?: string;
        authors?: string[];
        coverUrl?: string;
        cover_url?: string;
        description?: string;
        isbn?: string;
        page_count?: number;
    } | null;
};

type CreateClubFieldValue = CreateClubFormData[keyof CreateClubFormData];

export function CreateClubClient() {
    const router = useRouter();
    const [step, setStep] = React.useState(1);
    const [error, setError] = React.useState("");
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [formData, setFormData] = React.useState<CreateClubFormData>({
        name: "",
        description: "",
        language: "es",
        readingType: "guided",
        privacy: "public",
        maxMembers: "",
        spoilerPolicy: "levels",
        templateId: undefined,
        tags: [],
        rules: [
            "Debatimos ideas, no personas.",
            "Spoilers siempre marcados.",
            "Citas cortas por respeto a derechos.",
            "Si algo incomoda, repórtalo."
        ],
        is_official: false,
    });

    const updateField = (field: keyof CreateClubFormData, value: CreateClubFieldValue) => {
        setError("");
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const applyTemplate = (templateId: ClubTemplateId) => {
        setError("");

        const templateDefaults: Record<ClubTemplateId, Partial<CreateClubFormData>> = {
            slow: {
                readingType: "guided",
                privacy: "public",
                spoilerPolicy: "levels",
                tags: ["sin-prisas", "novela", "debate"],
                pace: "Suave",
                description: "Leemos sin prisa y compartimos ideas con calma, sin presión por llegar antes.",
                rules: [
                    "Avanzamos al ritmo marcado, sin competir.",
                    "Los spoilers van siempre en su tramo correspondiente.",
                    "Compartimos impresiones con respeto y curiosidad.",
                    "No hace falta comentar todo: mejor una buena idea que mucho ruido.",
                ],
            },
            deep: {
                readingType: "analysis",
                privacy: "private",
                spoilerPolicy: "strict",
                tags: ["analisis", "clasicos", "contexto"],
                pace: "Estándar",
                description: "Un club para leer con lupa: contexto, estructura, símbolos y preguntas que abren conversación.",
                rules: [
                    "Traemos citas breves y preguntas concretas al debate.",
                    "Diferenciamos interpretación de dato cuando sea posible.",
                    "Evitamos spoilers fuera del tramo acordado.",
                    "Cuidamos el tono aunque no estemos de acuerdo.",
                ],
            },
            social: {
                readingType: "guided",
                privacy: "public",
                spoilerPolicy: "levels",
                tags: ["comunidad", "recomendaciones", "lectura"],
                pace: "Estándar",
                description: "Un espacio abierto para descubrir libros, comentar sin presión y conocer otros lectores.",
                rules: [
                    "Damos la bienvenida a nuevos lectores.",
                    "Recomendamos sin imponer gustos.",
                    "Marcamos spoilers y respetamos ritmos distintos.",
                    "Las conversaciones deben sumar al ambiente del club.",
                ],
            },
            private: {
                readingType: "guided",
                privacy: "private",
                spoilerPolicy: "levels",
                tags: ["privado", "amigos", "club-cerrado"],
                pace: "Suave",
                description: "Un club privado para leer con gente conocida y mantener conversaciones cuidadas.",
                rules: [
                    "El código de acceso no se comparte fuera del grupo.",
                    "Respetamos los tiempos de quienes leen más despacio.",
                    "Usamos los tramos para evitar spoilers.",
                    "Si surge un problema, lo hablamos o se reporta.",
                ],
            },
            challenge: {
                readingType: "guided",
                privacy: "public",
                spoilerPolicy: "levels",
                tags: ["reto", "checkpoints", "habito"],
                pace: "Intenso",
                description: "Un reto de lectura con hitos claros para mantener energía y terminar juntos.",
                rules: [
                    "Los checkpoints marcan el ritmo común del reto.",
                    "Celebramos avances, no penalizamos retrasos.",
                    "Los spoilers se publican solo en el tramo adecuado.",
                    "Cada cierre debe aportar una conclusión útil para el club.",
                ],
            },
            emotional: {
                readingType: "guided",
                privacy: "private",
                spoilerPolicy: "levels",
                tags: ["emocional", "personajes", "reflexion"],
                pace: "Suave",
                description: "Leemos poniendo atención a personajes, vínculos y a lo que la historia nos remueve.",
                rules: [
                    "Hablamos desde la experiencia propia sin invalidar la de otros.",
                    "Avisamos si un tema puede ser sensible.",
                    "Cuidamos spoilers y momentos clave.",
                    "Dejamos espacio para silencios, dudas y lecturas distintas.",
                ],
            },
        };

        setFormData((prev) => {
            const defaults = templateDefaults[templateId];
            return {
                ...prev,
                ...defaults,
                templateId,
                name: prev.name,
                price: prev.price,
            };
        });
    };

    const handleNext = async () => {
        setError("");

        if (step === 1 && !formData.templateId) {
            setError("Elige una plantilla para preparar el club.");
            return;
        }

        if (step === 2 && !formData.name.trim()) {
            setError("Ponle un nombre al club para poder continuar.");
            return;
        }

        if (step < STEPS.length) {
            setStep(step + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await createClub(formData);
            if (result?.error) {
                setError(result.error);
            } else if (result?.success && result?.clubId) {
                router.push(`/app/clubs/${result.clubId}`);
            }
        } catch (submitError) {
            console.error("Failed to create club", submitError);
            setError("Error creando el club. Inténtalo de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        setError("");
        if (step > 1) {
            setStep(step - 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            router.push("/app/clubs");
        }
    };

    const isNextDisabled = (step === 1 && !formData.templateId) || (step === 2 && !formData.name.trim());
    const selectedTemplate = CLUB_TEMPLATES.find((template) => template.id === formData.templateId);

    return (
        <div className="pb-52 lg:pb-32">
            <Container className="max-w-3xl">
                <button
                    type="button"
                    onClick={() => router.push("/app/clubs")}
                    className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-grey/50 transition-colors hover:text-teal"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver
                </button>

                <SectionHeader
                    eyebrow="CLUBS"
                    title="Crear un club"
                    subtitle="Un espacio pequeño puede dar conversaciones enormes."
                    className="mb-5 [&_h1]:text-[1.8rem] [&_h1]:leading-tight [&_p]:text-base"
                />

                <WizardStepper steps={STEPS} currentStep={step} />

                {error && (
                    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-coral/25 bg-coral/10 px-4 py-3 text-sm font-medium text-coral">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <div className="mt-6 min-h-[400px]">
                    {step === 1 && <StepTemplate selectedTemplate={formData.templateId} onSelect={applyTemplate} />}
                    {step === 2 && <StepIdentity data={formData} onUpdate={updateField} selectedTemplateTitle={selectedTemplate?.title} />}
                    {step === 3 && <StepRules data={formData} onUpdate={updateField} />}
                    {step === 4 && <StepInvite data={formData} onUpdate={updateField} selectedTemplateTitle={selectedTemplate?.title} />}
                </div>
            </Container>

            <div className="fixed bottom-16 left-0 z-40 w-full border-t border-black/5 bg-white/95 p-4 shadow-[0_-8px_24px_rgba(35,74,78,0.08)] backdrop-blur-md lg:bottom-0">
                <Container className="flex max-w-3xl items-center justify-between gap-3">
                    <Button variant="ghost" onClick={handleBack} disabled={isSubmitting}>
                        {step === 1 ? "Cancelar" : "Atrás"}
                    </Button>

                    <div className="flex flex-1 items-center justify-end gap-4">
                        <span className="hidden text-xs uppercase tracking-widest text-grey/40 md:block">
                            Paso {step} de {STEPS.length}
                        </span>
                        <Button
                            variant="primary"
                            onClick={handleNext}
                            disabled={isNextDisabled || isSubmitting}
                            isLoading={isSubmitting}
                            className="min-w-[150px]"
                        >
                            {step === STEPS.length ? "Crear club" : "Siguiente"}
                        </Button>
                    </div>
                </Container>
            </div>
        </div>
    );
}
