"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { WizardStepper } from "@/components/clubs/create/WizardStepper";
import { StepIdentity } from "@/components/clubs/create/StepIdentity";
import { StepRules } from "@/components/clubs/create/StepRules";
import { StepInvite } from "@/components/clubs/create/StepInvite";

import { createOriginalClub } from "./actions";

const STEPS = ["Identidad", "Normas", "Invitar"];

export function CreateOriginalClient() {
    const router = useRouter();
    const [step, setStep] = React.useState(1);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [formData, setFormData] = React.useState({
        name: "",
        description: "",
        language: "es",
        readingType: "guided",
        privacy: "public",
        maxMembers: "",
        spoilerPolicy: "levels",
        tags: [] as string[],
        rules: [
            "Debatimos ideas, no personas.",
            "Spoilers siempre marcados.",
            "Citas cortas por respeto a derechos.",
            "Si algo incomoda, repórtalo."
        ],
    });

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = async () => {
        if (step < STEPS.length) {
            setStep(step + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            setIsSubmitting(true);
            try {
                const result = await createOriginalClub(formData);
                if (result?.error) {
                    alert(`Error: ${result.error}`);
                    console.error("Server action error:", result.error);
                } else if (result?.success) {
                    router.push(`/app/admin/clubes`);
                }
            } catch (error) {
                console.error("Failed to create official club", error);
                alert("Error creando el club. Inténtalo de nuevo.");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            router.push("/app/admin/clubes");
        }
    };

    const isNextDisabled = () => {
        if (step === 1) return !formData.name;
        return isSubmitting;
    };

    return (
        <div className="max-w-3xl pb-24">
            <div className="mb-8 flex items-center gap-4">
                <Link href="/app/admin/clubes" className="p-2 border border-border bg-card rounded-md hover:bg-accent text-muted-foreground transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-teal-dark flex items-center gap-2">
                        <span className="text-2xl">🏅</span> Crear Wordelia Original
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Configura un nuevo club oficial de Wordelia para la comunidad.
                    </p>
                </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-xl">
                <WizardStepper steps={STEPS} currentStep={step} />

                <div className="mt-8 min-h-[400px]">
                    {step === 1 && <StepIdentity data={formData} onUpdate={updateField} />}
                    {step === 2 && <StepRules data={formData} onUpdate={updateField} />}
                    {step === 3 && <StepInvite data={formData} onUpdate={updateField} />}
                </div>

                <div className="mt-8 pt-6 border-t border-border flex justify-between items-center">
                    <Button variant="ghost" onClick={handleBack} disabled={isSubmitting}>
                        {step === 1 ? "Cancelar" : "Atrás"}
                    </Button>

                    <div className="flex gap-4 items-center">
                        <span className="text-xs text-muted-foreground uppercase tracking-widest hidden md:block">
                            Paso {step} de {STEPS.length}
                        </span>
                        <Button variant="primary" onClick={handleNext} disabled={isNextDisabled()}>
                            {isSubmitting ? "Creando..." : (step === STEPS.length ? "Crear Wordelia Original" : "Siguiente")}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
