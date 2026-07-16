"use client";

import * as React from "react";
import { Suspense } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { login } from "@/app/auth/actions";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/Input";

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button fullWidth type="submit" size="lg" isLoading={pending}>
            Entrar
        </Button>
    );
}

function LoginContent() {
    const [state, formAction] = React.useActionState(login, null);
    const searchParams = useSearchParams();
    const next = searchParams.get("next") ?? "";
    const registerHref = next ? `/register?next=${encodeURIComponent(next)}` : "/register";

    return (
        <div className="min-h-dvh bg-white md:grid md:grid-cols-2">
            <section className="relative flex flex-col items-center justify-center overflow-hidden bg-cream px-6 pb-12 pt-8 text-center sm:px-8 sm:py-12 md:p-12">
                <Link href="/" className="relative z-10 mb-5 flex items-center justify-center md:mb-8">
                    <div className="relative flex h-14 w-56 items-center justify-center sm:h-16 sm:w-64 md:h-24 md:w-[300px]">
                        <Image
                            src="/assets/images/logo_wordelia.png"
                            alt="Wordelia Logo"
                            width={300}
                            height={80}
                            className="object-contain"
                            priority
                        />
                    </div>
                </Link>

                <div className="relative z-10 max-w-md">
                    <h1 className="mb-3 font-serif text-2xl text-teal sm:text-3xl md:mb-4 md:text-4xl">
                        Tu refugio de lectura
                    </h1>
                    <p className="font-sans text-sm leading-6 text-grey/75 sm:text-base sm:leading-7">
                        Únete a miles de lectores que han encontrado su ritmo. Sin presiones, sin ruido. Solo tú y tus historias.
                    </p>
                </div>
            </section>

            <section className="relative flex items-start justify-center bg-white px-6 py-10 sm:px-8 md:items-center md:p-12">
                <div className="w-full max-w-md space-y-7">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-teal-dark sm:text-3xl">Bienvenido de nuevo</h2>
                        <p className="mt-2 text-sm text-grey/60 sm:text-base">Continúa donde lo dejaste.</p>
                    </div>

                    <form action={formAction} className="space-y-5">
                        <input type="hidden" name="next" value={next} />
                        {state?.error ? (
                            <div className="rounded-2xl border border-coral/25 bg-coral/10 px-4 py-3 text-sm font-medium text-coral" role="alert">
                                {state.error}
                            </div>
                        ) : null}

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-grey-dark" htmlFor="email">
                                    Email
                                </label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="tu@email.com"
                                    className="h-14 text-base"
                                    autoComplete="email"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-grey-dark" htmlFor="password">
                                    Contraseña
                                </label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="h-14 text-base"
                                    autoComplete="current-password"
                                    required
                                />
                                <div className="mt-2 text-right">
                                    <Link href="#" className="text-sm font-medium text-coral hover:underline">
                                        ¿Olvidaste tu contraseña?
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="pt-1">
                            <SubmitButton />
                        </div>
                    </form>

                    <p className="text-center text-sm text-grey/60 sm:text-base">
                        ¿Aún no tienes una cuenta?{" "}
                        <Link href={registerHref} className="font-bold text-teal hover:underline">
                            Regístrate
                        </Link>
                    </p>
                </div>
            </section>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginContent />
        </Suspense>
    );
}
