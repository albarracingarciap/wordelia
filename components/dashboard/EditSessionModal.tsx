"use client";

import * as React from "react";
import { AlertCircle, Trash2 } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import {
    getLastReadingSession,
    updateReadingSession,
    deleteReadingSession,
    LastReadingSession,
} from "@/app/app/mi-lectura/actions";

export interface EditSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookId?: string;
    bookTitle?: string;
    onSuccess?: () => void | Promise<void>;
}

export function EditSessionModal({ isOpen, onClose, bookId, bookTitle, onSuccess }: EditSessionModalProps) {
    const [isLoading, setIsLoading] = React.useState(false);
    const [session, setSession] = React.useState<LastReadingSession | null>(null);
    const [pagesValue, setPagesValue] = React.useState("");
    const [minutesValue, setMinutesValue] = React.useState("");
    const [error, setError] = React.useState("");
    const [isSaving, setIsSaving] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [confirmDelete, setConfirmDelete] = React.useState(false);

    React.useEffect(() => {
        if (!isOpen || !bookId) return;

        let cancelled = false;
        setIsLoading(true);
        setError("");
        setSession(null);
        setConfirmDelete(false);

        getLastReadingSession(bookId)
            .then((data) => {
                if (cancelled) return;
                setSession(data);
                setPagesValue(data?.pagesRead != null ? String(data.pagesRead) : "");
                setMinutesValue(data ? String(data.durationMinutes) : "");
            })
            .catch(() => {
                if (!cancelled) setError("No hemos podido cargar la última sesión.");
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [isOpen, bookId]);

    const handleSave = async () => {
        if (!session) return;
        setError("");

        const pages = pagesValue.trim() ? parseInt(pagesValue, 10) : null;
        const minutes = minutesValue.trim() ? parseInt(minutesValue, 10) : 0;

        if (pages !== null && (isNaN(pages) || pages < 0)) {
            setError("Introduce un número de páginas válido.");
            return;
        }
        if (isNaN(minutes) || minutes < 0) {
            setError("Introduce un número de minutos válido.");
            return;
        }

        setIsSaving(true);
        try {
            const result = await updateReadingSession(session.id, minutes, pages);
            if (result.error) {
                setError(result.error);
                return;
            }
            onClose();
            await onSuccess?.();
        } catch {
            setError("No hemos podido guardar los cambios. Inténtalo de nuevo.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!session) return;
        setError("");
        setIsDeleting(true);
        try {
            const result = await deleteReadingSession(session.id);
            if (result.error) {
                setError(result.error);
                return;
            }
            onClose();
            await onSuccess?.();
        } catch {
            setError("No hemos podido eliminar la sesión. Inténtalo de nuevo.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Corregir última sesión" size="sm">
            {bookTitle && (
                <p className="mb-4 text-sm text-grey/70">
                    Última sesión de <span className="font-bold text-teal-dark">{bookTitle}</span>
                </p>
            )}

            {isLoading ? (
                <p className="py-6 text-center text-sm text-grey/50">Cargando…</p>
            ) : !session ? (
                <div className="space-y-4">
                    <p className="rounded-2xl border border-teal/10 bg-cream/20 px-4 py-6 text-center text-sm text-grey/60">
                        No hay ninguna sesión reciente para corregir en este libro.
                    </p>
                    <div className="flex justify-end">
                        <Button type="button" variant="ghost" onClick={onClose} className="h-11 px-6">
                            Cerrar
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {error && (
                        <div className="flex items-start gap-3 rounded-2xl border border-coral/20 bg-coral/10 px-4 py-3 text-sm font-medium text-coral">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Input
                            label="Páginas"
                            type="number"
                            min={0}
                            placeholder="Páginas"
                            value={pagesValue}
                            onChange={(e) => setPagesValue(e.target.value)}
                            helperText="Avance de esta sesión."
                        />
                        <Input
                            label="Tiempo (min)"
                            type="number"
                            min={0}
                            placeholder="Minutos"
                            value={minutesValue}
                            onChange={(e) => setMinutesValue(e.target.value)}
                            helperText="Duración estimada."
                        />
                    </div>

                    <div className="rounded-2xl border border-coral/15 bg-coral/[0.04] p-3">
                        {confirmDelete ? (
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-grey-dark">¿Eliminar esta sesión por completo?</p>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setConfirmDelete(false)}
                                        disabled={isDeleting}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="bg-coral hover:bg-[#C25852] text-white"
                                        onClick={handleDelete}
                                        isLoading={isDeleting}
                                    >
                                        Eliminar
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setConfirmDelete(true)}
                                className="inline-flex items-center gap-2 text-sm font-medium text-coral transition-colors hover:text-[#C25852]"
                            >
                                <Trash2 className="h-4 w-4" /> Eliminar sesión
                            </button>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-1">
                        <Button type="button" variant="ghost" onClick={onClose} className="h-11 px-6" disabled={isSaving}>
                            Cancelar
                        </Button>
                        <Button type="button" onClick={handleSave} className="h-11 px-8" isLoading={isSaving}>
                            Guardar cambios
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
