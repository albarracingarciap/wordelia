"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updatePassword } from "@/app/auth/actions";

export default function NuevaPasswordPage() {
    const [state, formAction, isPending] = useActionState(updatePassword, null);
    const [password, setPassword] = React.useState("");
    const [confirm, setConfirm] = React.useState("");
    const [clientError, setClientError] = React.useState("");

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        setClientError("");
        if (password.length < 8) {
            e.preventDefault();
            setClientError("La contraseña debe tener al menos 8 caracteres.");
        } else if (password !== confirm) {
            e.preventDefault();
            setClientError("Las contraseñas no coinciden.");
        }
    };

    const errorMessage = clientError || state?.error;

    return (
        <div className="flex min-h-[100svh] flex-col items-center justify-center bg-cream px-5 py-10">
            <Link href="/" className="mb-8 flex items-center justify-center">
                <Image src="/assets/images/logo_wordelia.png" alt="Wordelia" width={220} height={60} className="h-auto w-44 object-contain" priority />
            </Link>

            <div className="w-full max-w-md rounded-2xl border border-teal/10 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-teal/10 text-teal">
                    <Lock className="h-8 w-8" />
                </div>
                <h1 className="font-serif text-2xl font-bold text-teal-dark">Elige una nueva contraseña</h1>
                <p className="mt-3 text-sm leading-relaxed text-grey/70">
                    Escribe tu nueva contraseña. Después entrarás directamente en Wordelia.
                </p>

                <form action={formAction} onSubmit={onSubmit} className="mt-6 space-y-4 text-left">
                    <div>
                        <label className="mb-1.5 block text-sm font-bold text-grey-dark" htmlFor="password">Nueva contraseña</label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Mínimo 8 caracteres"
                            className="h-12"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setClientError(""); }}
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-bold text-grey-dark" htmlFor="confirm">Repite la contraseña</label>
                        <Input
                            id="confirm"
                            type="password"
                            placeholder="Repite la contraseña"
                            className="h-12"
                            autoComplete="new-password"
                            value={confirm}
                            onChange={(e) => { setConfirm(e.target.value); setClientError(""); }}
                            required
                        />
                    </div>
                    {errorMessage && (
                        <p className="rounded-xl border border-coral/25 bg-coral/10 px-4 py-3 text-sm font-medium text-coral">{errorMessage}</p>
                    )}
                    <Button fullWidth type="submit" size="lg" isLoading={isPending}>
                        Guardar contraseña
                    </Button>
                </form>

                <Link href="/login" className="mt-5 inline-block text-sm font-semibold text-teal hover:underline">
                    Volver a iniciar sesión
                </Link>
            </div>
        </div>
    );
}
