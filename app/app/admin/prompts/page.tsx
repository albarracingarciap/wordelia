import { adminListPrompts } from "@/app/app/comunidad/prompt-actions";
import { PromptsAdminClient } from "./PromptsAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPromptsPage() {
    const prompts = await adminListPrompts();
    return (
        <div className="p-6 md:p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground">Prompts de comunidad</h1>
                <p className="mt-1 text-sm text-muted-foreground">Preguntas que siembran conversación en la Comunidad. Solo una activa a la vez.</p>
            </div>
            <PromptsAdminClient initial={prompts} />
        </div>
    );
}
