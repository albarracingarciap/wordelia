"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { resendConfirmation } from "@/app/auth/actions";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";
    const [state, formAction, isPending] = useActionState(resendConfirmation, null);

    return (
        <div className="flex min-h-[100svh] flex-col items-center justify-center bg-cream px-5 py-10">
            <Link href="/" className="mb-8 flex items-center justify-center">
                <Image
                    src="/assets/images/logo_wordelia.png"
                    alt="Wordelia"
                    width={220}
                    height={60}
                    className="h-auto w-44 object-contain"
                    priority
                />
            </Link>

            <div className="w-full max-w-md rounded-2xl border border-teal/10 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-teal/10 text-teal">
                    <MailCheck className="h-8 w-8" />
                </div>

                <h1 className="font-serif text-2xl font-bold text-teal-dark">Revisa tu correo</h1>
                <p className="mt-3 text-sm leading-relaxed text-grey/70">
                    {email ? (
                        <>Te hemos enviado un enlace de confirmación a <span className="font-semibold text-teal-dark">{email}</span>. </>
                    ) : (
                        <>Te hemos enviado un enlace de confirmación. </>
                    )}
                    Ábrelo para activar tu cuenta y empezar. Si no lo ves, revisa la carpeta de spam.
                </p>

                <div className="mt-6 space-y-3">
                    <form action={formAction}>
                        <input type="hidden" name="email" value={email} />
                        <Button type="submit" variant="outline" fullWidth isLoading={isPending} disabled={!email}>
                            Reenviar correo
                        </Button>
                    </form>

                    {state?.error && <p className="text-sm font-medium text-coral">{state.error}</p>}

                    <Link href="/login" className="inline-block text-sm font-semibold text-teal hover:underline">
                        Volver a iniciar sesión
                    </Link>
                </div>
            </div>

            <p className="mt-6 max-w-md px-4 text-center text-xs leading-tight text-grey/45">
                ¿Problemas con la confirmación? Escríbenos a{" "}
                <a href="mailto:hola@wordelia.es" className="underline hover:text-teal">hola@wordelia.es</a>.
            </p>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={null}>
            <VerifyEmailContent />
        </Suspense>
    );
}
