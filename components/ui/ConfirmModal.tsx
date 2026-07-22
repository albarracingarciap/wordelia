"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Modal de confirmación reutilizable (sustituye a window.confirm por una ventana
// de la propia app). Controlado: se muestra cuando `open` es true.
export function ConfirmModal({
    open,
    title,
    message,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    tone = "default",
    busy = false,
    onConfirm,
    onCancel,
}: {
    open: boolean;
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: "default" | "danger";
    busy?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => { if (!busy) onCancel(); }}
        >
            <div
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone === "danger" ? "bg-red-100 text-red-600" : "bg-teal/10 text-teal"}`}>
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-serif text-lg font-bold text-grey-dark">{title}</h3>
                        {message && <p className="mt-1 text-sm leading-6 text-grey/70">{message}</p>}
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <Button variant="ghost" onClick={onCancel} disabled={busy}>
                        {cancelLabel}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={onConfirm}
                        disabled={busy}
                        isLoading={busy}
                        className={tone === "danger" ? "bg-red-600 text-white hover:bg-red-700" : ""}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}
