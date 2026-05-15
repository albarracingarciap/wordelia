"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { signup } from "@/app/auth/actions"; // Import server action

export default function RegisterPage() {
    const [state, formAction, isPending] = useActionState(signup, null);
    const [name, setName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [newsletter, setNewsletter] = React.useState(false);
    const [clientError, setClientError] = React.useState("");

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
            {/* Left: Branding */}
            <div className="hidden bg-teal-dark md:flex flex-col items-center justify-center p-8 md:p-12 relative overflow-hidden text-cream">
                <Link href="/" className="mb-8 z-10 flex items-center justify-center bg-cream/5 rounded-2xl p-4 backdrop-blur-sm">
                    <div className="relative h-20 w-auto aspect-[4/1] flex items-center justify-center">
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

                <div className="max-w-md text-center z-10">
                    <h1 className="font-serif text-3xl md:text-4xl mb-4 text-cream">
                        Tu ritmo, tus libros
                    </h1>
                    <p className="text-cream/70 leading-relaxed font-sans">
                        Crea tu perfil y empieza a organizar tus lecturas hoy mismo.
                        Descubre clubes, guarda notas y encuentra tu próxima historia favorita.
                    </p>
                </div>
            </div>

            {/* Right: Register Form */}
            <div className="bg-white flex min-h-[100svh] flex-col items-center justify-start px-5 py-8 sm:px-8 md:justify-center md:p-12 relative">
                <Link href="/" className="absolute top-8 left-8 md:hidden text-sm text-grey hover:text-teal font-medium">
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
                        <h2 className="text-2xl font-bold text-teal-dark">Crear cuenta</h2>
                        <p className="text-sm text-grey/60 mt-2">Únete a la comunidad de lectura sin prisas</p>
                    </div>

                    <form action={formAction} onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-grey-dark mb-1.5" htmlFor="name">Nombre completo</label>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder="Juan Pérez"
                                    className="h-11 mb-0"
                                    value={name}
                                    onChange={(event) => {
                                        setName(event.target.value);
                                        setClientError("");
                                    }}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-grey-dark mb-1.5" htmlFor="email">Email</label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="hola@ejemplo.com"
                                    className="h-11 mb-0"
                                    value={email}
                                    onChange={(event) => {
                                        setEmail(event.target.value);
                                        setClientError("");
                                    }}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-grey-dark mb-1.5" htmlFor="password">Contraseña</label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="Mínimo 8 caracteres"
                                    className="h-11 mb-0"
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
                                    label="Quiero recibir novedades, recomendaciones y noticias literarias."
                                    checked={newsletter}
                                    onChange={(event) => setNewsletter(event.target.checked)}
                                // name="newsletter" // Handle newsletter separately if needed
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

                    <div className="text-center pt-4">
                        <p className="text-sm text-grey/60">
                            ¿Ya tienes una cuenta?{" "}
                            <Link href="/login" className="text-teal font-bold hover:underline">
                                Entrar
                            </Link>
                        </p>
                    </div>

                    <p className="text-center text-[10px] text-grey/40 leading-tight px-4">
                        Al regístrate, aceptas nuestros{" "}
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
