"use client";

import { ChallengeForm } from "@/components/admin/retos/ChallengeForm";
import { createChallenge } from "./actions";

export function CreateChallengeClient({ badges }: { badges: { id: string; name: string }[] }) {
    return (
        <ChallengeForm
            title="Crear nuevo reto"
            submitLabel="Crear reto"
            badges={badges}
            onSubmit={createChallenge}
        />
    );
}
