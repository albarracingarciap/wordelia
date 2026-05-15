"use client";

import * as React from "react";
import { login } from "@/app/auth/actions"; // Import server action
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
    // Server action handles redirect:


    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
            {/* Left: Branding */}
            <div className="bg-cream flex flex-col items-center justify-center p-8 md:p-12 relative overflow-hidden">
                <Link href="/" className="mb-8 z-10 flex items-center justify-center">
                    <div className="relative h-24 w-auto aspect-[4/1] flex items-center justify-center">
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

                <div className="max-w-md text-center z-10">
                    <h1 className="font-serif text-3xl md:text-4xl text-teal mb-4">
                        Tu refugio de lectura
                    </h1>
                    <p className="text-grey/80 leading-relaxed font-sans">
                        Únete a miles de lectores que han encontrado su ritmo. Sin presiones, sin ruido. Solo tú y tus historias.
                    </p>
                </div>
            </div>

            {/* Right: Login Form */}
            <div className="bg-white flex flex-col items-center justify-center p-8 md:p-12 relative">
                <Link href="/" className="absolute top-8 left-8 md:hidden text-sm text-grey hover:text-teal font-medium">
                    ← Volver
                </Link>

                <div className="w-full max-w-sm space-y-8">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-teal-dark">Bienvenido de nuevo</h2>
                        <p className="text-sm text-grey/60 mt-2">Continúa donde lo dejaste.</p>
                    </div>

                    <div className="space-y-4">
                        <form action={async (formData) => { await login(formData); }} className="space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-grey-dark mb-1.5" htmlFor="email">Email</label>
                                    <div className="relative">
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="tu@email.com"
                                            className="h-11"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="block text-sm font-bold text-grey-dark" htmlFor="password">Contraseña</label>
                                        <Link href="#" className="text-xs text-coral hover:underline font-medium">
                                            ¿Olvidaste tu contraseña?
                                        </Link>
                                    </div>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="h-11"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <Button fullWidth type="submit" size="lg">
                                    Entrar
                                </Button>
                            </div>
                        </form>
                    </div>

                    <div className="text-center pt-2">
                        <p className="text-sm text-grey/60">
                            ¿Aún no tienes una cuenta?{" "}
                            <Link href="/register" className="text-teal font-bold hover:underline">
                                Regístrate
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
