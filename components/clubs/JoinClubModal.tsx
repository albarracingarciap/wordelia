"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { joinClubByCode } from "@/app/app/clubs/actions";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { CheckCircle } from "lucide-react";

interface JoinClubModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialCode?: string;
    onJoined?: () => void;
}

export function JoinClubModal({ isOpen, onClose, initialCode = "", onJoined }: JoinClubModalProps) {
    const router = useRouter();
    const [code, setCode] = React.useState(normalizeInviteCode(initialCode));
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);
    const [joinedClubId, setJoinedClubId] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!isOpen) return;

        setCode(normalizeInviteCode(initialCode));
        setError(null);
        setSuccess(null);
        setJoinedClubId(null);
    }, [initialCode, isOpen]);

    const handleClose = () => {
        onClose();
        setError(null);
        setSuccess(null);
        setJoinedClubId(null);
    };

    const handleJoin = async () => {
        if (!code.trim() || loading) return;

        setLoading(true);
        setError(null);
        setSuccess(null);
        setJoinedClubId(null);

        const result = await joinClubByCode(code);
        setLoading(false);

        if (result?.error) {
            setError(result.error);
            return;
        }

        setSuccess(result?.message || "Solicitud enviada.");
        setJoinedClubId(result?.clubId || null);
        onJoined?.();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Unirme con invitación"
            size="sm"
            className="mb-[calc(4.75rem+env(safe-area-inset-bottom))] sm:mb-0"
        >
            <div className="space-y-4 pt-2">
                <p className="text-sm leading-relaxed text-grey/70">
                    Si tienes un código de acceso o enlace de invitación para un club privado o secreto, introdúcelo aquí.
                </p>

                <div className="space-y-2">
                    <Input
                        placeholder="Ej. BOOK-XYZ-123"
                        value={code}
                        onChange={(e) => {
                            setCode(normalizeInviteCode(e.target.value));
                            setError(null);
                            setSuccess(null);
                            setJoinedClubId(null);
                        }}
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleJoin();
                            }
                        }}
                    />
                    <p className="px-1 text-xs leading-relaxed text-grey/50">
                        Introduce el código que te ha compartido el moderador. También puedes pegar el enlace completo.
                    </p>
                </div>

                {error && (
                    <p className="rounded-2xl bg-coral/10 px-4 py-3 text-sm font-bold text-coral">
                        {error}
                    </p>
                )}

                {success && (
                    <p className="flex items-start gap-2 rounded-2xl bg-teal/10 px-4 py-3 text-sm font-bold text-teal">
                        <CheckCircle size={18} className="mt-0.5 shrink-0" />
                        {success}
                    </p>
                )}

                <div className="grid grid-cols-1 gap-3 border-t border-teal/5 pt-4 sm:flex sm:justify-end">
                    <Button variant="ghost" onClick={handleClose} className="h-12 w-full sm:w-auto">
                        Cancelar
                    </Button>

                    {success && joinedClubId ? (
                        <Button
                            className="h-12 w-full sm:w-auto"
                            onClick={() => {
                                handleClose();
                                router.push(`/app/clubs/${joinedClubId}`);
                            }}
                        >
                            Ir al club
                        </Button>
                    ) : success ? (
                        <Button className="h-12 w-full sm:w-auto" onClick={handleClose}>
                            Cerrar
                        </Button>
                    ) : (
                        <Button
                            disabled={!code.trim() || loading}
                            onClick={handleJoin}
                            className="h-12 w-full disabled:shadow-none disabled:opacity-45 sm:w-auto"
                        >
                            {loading ? "Validando..." : "Enviar solicitud"}
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
}

function normalizeInviteCode(value: string) {
    const trimmed = value.trim();

    try {
        const url = new URL(trimmed);
        const joinCode = url.searchParams.get("join");
        if (joinCode) return normalizeInviteCode(joinCode);
    } catch {
        // Not a full URL; keep normalizing as a code.
    }

    return trimmed
        .replace(/^.*join=/i, "")
        .replace(/[^a-zA-Z0-9-]/g, "")
        .toUpperCase();
}
