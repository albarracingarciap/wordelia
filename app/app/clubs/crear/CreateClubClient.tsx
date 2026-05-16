"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { WizardStepper } from "@/components/clubs/create/WizardStepper";
import { StepIdentity } from "@/components/clubs/create/StepIdentity";
import { StepRules } from "@/components/clubs/create/StepRules";
import { StepInvite } from "@/components/clubs/create/StepInvite";
import { createClub } from "./actions";
import { ArrowLeft, AlertCircle } from "lucide-react";

const STEPS = ["Identidad", "Normas", "Revisar"];

export type CreateClubFormData = {
    name: string;
    description: string;
    language: string;
    readingType: string;
    privacy: string;
    maxMembers: string;
    spoilerPolicy: string;
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

    const handleNext = async () => {
        setError("");

        if (step === 1 && !formData.name.trim()) {
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

    const isNextDisabled = step === 1 && !formData.name.trim();

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
                    {step === 1 && <StepIdentity data={formData} onUpdate={updateField} />}
                    {step === 2 && <StepRules data={formData} onUpdate={updateField} />}
                    {step === 3 && <StepInvite data={formData} onUpdate={updateField} />}
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
