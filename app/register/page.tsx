"use client";

import * as React from "react";
import { Suspense, useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { signup } from "@/app/auth/actions";

function RegisterContent() {
    const searchParams = useSearchParams();
    const [state, formAction, isPending] = useActionState(signup, null);
    const [name, setName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [newsletter, setNewsletter] = React.useState(false);
    const [clientError, setClientError] = React.useState("");

    const source = searchParams.get("source") || "";
    const intent = searchParams.get("intent") || "";
    const requestedPlan = searchParams.get("plan") || (intent.startsWith("plan-") ? intent.replace("plan-", "") : "");
    const billingPeriod = searchParams.get("billing") || "";
    const isBetaSignup = source === "beta" || intent.includes("beta") || Boolean(requestedPlan);
    const errorMessage = clientError || state?.error;

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        setClientError("");

        if (password.length < 8) {
            event.preventDefault();
            setClientError("La contraseña debe tener al menos 8 caracteres.");
        }
    };

    return (
        <div className="min-h-[100svh] bg-white md:grid md:grid-cols-2">
            <div className="relative hidden overflow-hidden bg-teal-dark p-8 text-cream md:flex md:flex-col md:items-center md:justify-center md:p-12">
                <Link href="/" className="z-10 mb-8 flex items-center justify-center rounded-2xl bg-cream/5 p-4 backdrop-blur-sm">
                    <div className="relative flex h-20 aspect-[4/1] w-auto items-center justify-center">
                        <Image
                            src="/assets/images/logo_wordelia.png"
                            alt="Wordelia Logo"
                            width={300}
                            height={80}
                            className="object-contain brightness-0 invert"
                            priority
                        />
                    </div>
                </Link>

                <div className="z-10 max-w-md text-center">
                    <h1 className="mb-4 text-3xl text-cream md:text-4xl">
                        Tu ritmo, tus libros
                    </h1>
                    <p className="leading-relaxed text-cream/70">
                        Crea tu perfil y empieza a organizar tus lecturas hoy mismo. Descubre clubes, guarda notas y
                        encuentra tu próxima historia favorita.
                    </p>
                </div>
            </div>

            <div className="relative flex min-h-[100svh] flex-col items-center justify-start bg-white px-5 py-8 sm:px-8 md:justify-center md:p-12">
                <Link href="/" className="absolute left-8 top-8 text-sm font-medium text-grey hover:text-teal md:hidden">
                    ← Volver
                </Link>

                <div className="mb-8 mt-8 flex justify-center md:hidden">
                    <Link href="/" className="flex items-center justify-center">
                        <Image
                            src="/assets/images/logo_wordelia.png"
                            alt="Wordelia Logo"
                            width={220}
                            height={60}
                            className="h-auto w-44 object-contain"
                            priority
                        />
                    </Link>
                </div>

                <div className="w-full max-w-sm space-y-6">
                    <div className="text-center">
                        {isBetaSignup && (
                            <p className="mb-3 inline-flex rounded-full bg-coral/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-coral">
                                Acceso fundador
                            </p>
                        )}
                        <h2 className="text-2xl font-bold text-teal-dark">Crear cuenta</h2>
                        <p className="mt-2 text-sm text-grey/60">Únete a la comunidad de lectura sin prisas</p>
                    </div>

                    <form action={formAction} onSubmit={handleSubmit} className="space-y-5">
                        <input type="hidden" name="signup_source" value={source} />
                        <input type="hidden" name="signup_intent" value={intent} />
                        <input type="hidden" name="requested_plan" value={requestedPlan} />
                        <input type="hidden" name="billing_period" value={billingPeriod} />

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-grey-dark" htmlFor="name">Nombre completo</label>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder="Juan Pérez"
                                    className="mb-0 h-11"
                                    value={name}
                                    onChange={(event) => {
                                        setName(event.target.value);
                                        setClientError("");
                                    }}
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-grey-dark" htmlFor="email">Email</label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="hola@ejemplo.com"
                                    className="mb-0 h-11"
                                    value={email}
                                    onChange={(event) => {
                                        setEmail(event.target.value);
                                        setClientError("");
                                    }}
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-grey-dark" htmlFor="password">Contraseña</label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="Mínimo 8 caracteres"
                                    className="mb-0 h-11"
                                    value={password}
                                    onChange={(event) => {
                                        setPassword(event.target.value);
                                        setClientError("");
                                    }}
                                    required
                                />
                            </div>

                            <div className="pt-2">
                                <Checkbox
                                    name="newsletter_opt_in"
                                    label="Quiero recibir novedades, recomendaciones y noticias literarias."
                                    checked={newsletter}
                                    onChange={(event) => setNewsletter(event.target.checked)}
                                />
                            </div>
                        </div>

                        {errorMessage && (
                            <p className="rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
                                {errorMessage}
                            </p>
                        )}

                        <div className="pt-2">
                            <Button fullWidth type="submit" className="h-12 text-base" isLoading={isPending}>
                                Regístrate
                            </Button>
                        </div>
                    </form>

                    <div className="pt-4 text-center">
                        <p className="text-sm text-grey/60">
                            ¿Ya tienes una cuenta?{" "}
                            <Link href="/login" className="font-bold text-teal hover:underline">
                                Entrar
                            </Link>
                        </p>
                    </div>

                    <p className="px-4 text-center text-[10px] leading-tight text-grey/40">
                        Al registrarte, aceptas nuestros{" "}
                        <Link href="/terminos" className="underline hover:text-teal">
                            Términos de Servicio
                        </Link>{" "}
                        y{" "}
                        <Link href="/privacidad" className="underline hover:text-teal">
                            Política de Privacidad
                        </Link>
                        . Nos tomamos en serio tus datos.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={null}>
            <RegisterContent />
        </Suspense>
    );
}
