"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteChallenge } from "@/app/app/admin/retos/nuevo/actions";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function DeleteChallengeButton({ id }: { id: string }) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);
        try {
            const result = await deleteChallenge(id);
            if (result.error) {
                setError(result.error);
                return;
            }
            setConfirmOpen(false);
        } catch (err) {
            console.error("Failed to delete challenge", err);
            setError("Error al intentar borrar el reto.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <button
                onClick={() => { setError(null); setConfirmOpen(true); }}
                disabled={isDeleting}
                className="p-1.5 text-muted-foreground hover:bg-coral/10 hover:text-coral rounded-md transition-colors"
                title="Eliminar reto"
            >
                <Trash2 className="w-4 h-4" />
            </button>

            <ConfirmModal
                open={confirmOpen}
                title="Eliminar reto"
                message={error ?? "¿Estás seguro de que quieres eliminar este reto? Esta acción no se puede deshacer."}
                confirmLabel="Eliminar"
                tone="danger"
                busy={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => { if (!isDeleting) setConfirmOpen(false); }}
            />
        </>
    );
}
