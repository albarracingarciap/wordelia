"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteChallenge } from "@/app/app/admin/retos/nuevo/actions";

export function DeleteChallengeButton({ id }: { id: string }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm("¿Estás seguro de que quieres eliminar este reto? Esta acción no se puede deshacer.")) {
            return;
        }

        setIsDeleting(true);
        try {
            const result = await deleteChallenge(id);
            if (result.error) {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error("Failed to delete challenge", error);
            alert("Error al intentar borrar el reto.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 text-muted-foreground hover:bg-coral/10 hover:text-coral rounded-md transition-colors"
            title="Eliminar reto"
        >
            <Trash2 className="w-4 h-4" />
        </button>
    );
}
