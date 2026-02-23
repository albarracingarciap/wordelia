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

const STEPS = ["Identidad", "Normas", "Invitar"];

export function CreateClubClient() {
    const router = useRouter();
    const [step, setStep] = React.useState(1);
    const [formData, setFormData] = React.useState({
        name: "",
        description: "",
        language: "es",
        readingType: "guided", // or "analysis"
        privacy: "public",
        maxMembers: "", // empty = unlimited
        spoilerPolicy: "levels",
        tags: [] as string[],
        rules: [
            "Debatimos ideas, no personas.",
            "Spoilers siempre marcados.",
            "Citas cortas por respeto a derechos.",
            "Si algo incomoda, repórtalo."
        ],
        is_official: false,
    });

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = async () => {
        if (step < STEPS.length) {
            setStep(step + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            // Submit
            try {
                const result = await createClub(formData);
                if (result?.error) {
                    alert(`Error: ${result.error}`);
                    console.error("Server action error:", result.error);
                } else if (result?.success && result?.clubId) {
                    router.push(`/app/clubs/${result.clubId}`);
                }
            } catch (error) {
                console.error("Failed to create club", error);
                alert("Error creando el club. Inténtalo de nuevo.");
            }
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            router.back();
        }
    };

    // Validation
    const isNextDisabled = () => {
        if (step === 1) return !formData.name; // Name required
        return false;
    };

    return (
        <div className="pb-24">
            <Container className="max-w-3xl">
                <SectionHeader
                    eyebrow="CLUBS"
                    title="Crear un club"
                    subtitle="Un espacio pequeño puede dar conversaciones enormes."
                >
                    <Button variant="ghost" className="text-grey hover:text-coral" onClick={() => router.push("/app/clubs")}>Cancelar</Button>
                </SectionHeader>

                <WizardStepper steps={STEPS} currentStep={step} />

                <div className="mt-8 min-h-[400px]">
                    {step === 1 && <StepIdentity data={formData} onUpdate={updateField} />}
                    {step === 2 && <StepRules data={formData} onUpdate={updateField} />}
                    {step === 3 && <StepInvite data={formData} onUpdate={updateField} />}
                </div>
            </Container>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-black/5 p-4 z-40">
                <Container className="max-w-3xl flex justify-between items-center">
                    <Button variant="ghost" onClick={handleBack}>
                        {step === 1 ? "Cancelar" : "Atrás"}
                    </Button>

                    <div className="flex gap-4 items-center">
                        <span className="text-xs text-grey/40 uppercase tracking-widest hidden md:block">
                            Paso {step} de {STEPS.length}
                        </span>
                        <Button variant="primary" onClick={handleNext} disabled={isNextDisabled()}>
                            {step === STEPS.length ? "Crear Club" : "Siguiente"}
                        </Button>
                    </div>
                </Container>
            </div>
        </div>
    );
}
