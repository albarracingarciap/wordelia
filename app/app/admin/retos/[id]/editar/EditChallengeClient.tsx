"use client";

import { ChallengeForm } from "@/components/admin/retos/ChallengeForm";
import { updateChallenge, type AdminChallenge, type ChallengeInput } from "@/app/app/admin/retos/nuevo/actions";

export function EditChallengeClient({ challenge, badges }: { challenge: AdminChallenge; badges: { id: string; name: string }[] }) {
    const initial: Partial<ChallengeInput> = {
        title: challenge.title,
        description: challenge.description ?? "",
        start_date: challenge.startDate ? challenge.startDate.split("T")[0] : "",
        end_date: challenge.endDate ? challenge.endDate.split("T")[0] : "",
        rules: challenge.rules ?? "",
        is_published: challenge.isPublished,
        goal_type: challenge.goalType ?? "books",
        goal_target: challenge.goalTarget ?? 5,
        goal_genre: challenge.goalGenre ?? "",
        reward_badge_id: challenge.rewardBadgeId ?? "",
    };

    return (
        <ChallengeForm
            title="Editar reto"
            submitLabel="Guardar cambios"
            badges={badges}
            initial={initial}
            onSubmit={(input) => updateChallenge(challenge.id, input)}
        />
    );
}
