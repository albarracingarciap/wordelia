"use client";

import { useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MailCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { requestPasswordReset } from "@/app/auth/actions";

export default function RecuperarPage() {
    const [state, formAction, isPending] = useActionState(requestPasswordReset, null);
    const sent = state?.sent === true;

    return (
        <div className="flex min-h-[100svh] flex-col items-center justify-center bg-cream px-5 py-10">
            <Link href="/" className="mb-8 flex items-center justify-center">
                <Image src="/assets/images/logo_wordelia.png" alt="Wordelia" width={220} height={60} className="h-auto w-44 object-contain" priority />
            </Link>

            <div className="w-full max-w-md rounded-2xl border border-teal/10 bg-white p-8 text-center shadow-sm">
                {sent ? (
                    <>
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-teal/10 text-teal">
                            <MailCheck className="h-8 w-8" />
                        </div>
                        <h1 className="font-serif text-2xl font-bold text-teal-dark">Revisa tu correo</h1>
                        <p className="mt-3 text-sm leading-relaxed text-grey/70">
                            Si hay una cuenta con ese email, te hemos enviado un enlace para restablecer tu contraseña.
                            Ábrelo y elige una nueva. Si no lo ves, revisa la carpeta de spam.
                        </p>
                        <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-teal hover:underline">
                            Volver a iniciar sesión
                        </Link>
                    </>
                ) : (
                    <>
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-coral/10 text-coral">
                            <KeyRound className="h-8 w-8" />
                        </div>
                        <h1 className="font-serif text-2xl font-bold text-teal-dark">Recuperar contraseña</h1>
                        <p className="mt-3 text-sm leading-relaxed text-grey/70">
                            Introduce tu email y te enviaremos un enlace para elegir una nueva contraseña.
                        </p>

                        <form action={formAction} className="mt-6 space-y-4 text-left">
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-grey-dark" htmlFor="email">Email</label>
                                <Input id="email" name="email" type="email" placeholder="tu@email.com" className="h-12" autoComplete="email" required />
                            </div>
                            {state?.error && (
                                <p className="rounded-xl border border-coral/25 bg-coral/10 px-4 py-3 text-sm font-medium text-coral">{state.error}</p>
                            )}
                            <Button fullWidth type="submit" size="lg" isLoading={isPending}>
                                Enviar enlace
                            </Button>
                        </form>

                        <Link href="/login" className="mt-5 inline-block text-sm font-semibold text-teal hover:underline">
                            Volver a iniciar sesión
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}
