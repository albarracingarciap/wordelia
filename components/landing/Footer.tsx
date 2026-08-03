"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Instagram, Send, Youtube } from "lucide-react";
import { Button } from "../ui/Button";
import { subscribeToNewsletter } from "@/app/actions";

const footerGroups = [
    {
        title: "Explorar",
        links: [
            { label: "Clubs públicos", href: "/clubes" },
            { label: "Libros", href: "/explorar" },
            { label: "Librerías", href: "/librerias" },
            { label: "Planes", href: "/planes" },
        ],
    },
    {
        title: "Wordelia",
        links: [
            { label: "Para clubs", href: "/register?source=footer&intent=create-club" },
            { label: "Para librerías", href: "/contacto?source=librerias" },
            { label: "Educación", href: "/contacto?source=educacion" },
            { label: "Contacto", href: "/contacto" },
        ],
    },
    {
        title: "Legal",
        links: [
            { label: "Privacidad", href: "/privacidad" },
            { label: "Términos", href: "/terminos" },
            { label: "Cookies", href: "/cookies" },
        ],
    },
];

// TikTok no está en lucide-react: SVG inline con fill=currentColor para heredar
// el color (teal → coral al hover) igual que el resto de iconos sociales.
function TikTokIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
            <path d="M16.5 3c.3 2.03 1.44 3.24 3.5 3.5v2.65c-1.2.12-2.25-.27-3.47-1.01v4.6c0 5.85-6.38 7.68-8.94 3.49-1.65-2.7-.64-7.43 4.67-7.62v2.79c-.4.07-.83.17-1.23.31-1.19.4-1.86 1.15-1.67 2.48.36 2.55 5.04 3.3 4.65-1.68V3h2.49z" />
        </svg>
    );
}

export function Footer() {
    const [email, setEmail] = useState("");
    const [subscribed, setSubscribed] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubscribe = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!email.trim() || submitting) return;

        setSubmitting(true);
        setError(null);

        const result = await subscribeToNewsletter(email, "footer");

        if (result.success) {
            setSubscribed(true);
            setEmail("");
        } else {
            setError(result.error);
        }

        setSubmitting(false);
    };

    return (
        <footer id="footer" className="relative bg-[#FFFAEF] pb-8 pt-12 text-grey md:pt-16">
            <div className="mx-auto max-w-[1200px] px-6 md:px-8">
                <div className="grid grid-cols-1 gap-8 border-t border-teal/10 pt-8 md:grid-cols-[1.2fr_2fr_1.1fr] md:gap-10 md:pt-12">
                    <div className="space-y-5">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="relative h-12 w-48">
                                <Image
                                    src="/assets/images/logo_wordelia.png"
                                    alt="Wordelia"
                                    fill
                                    className="object-contain object-left"
                                />
                            </div>
                        </Link>
                        <p className="max-w-sm text-sm leading-relaxed text-grey/80">
                            Wordelia nace para leer sin prisa, guardar lo que te mueve y compartir libros en clubs
                            cuidados, sin spoilers y con ritmo propio.
                        </p>
                        <div className="flex items-center gap-4 text-teal">
                            <a href="https://www.instagram.com/somoswordelia/" target="_blank" rel="noreferrer" className="transition-colors hover:text-coral" aria-label="Instagram">
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a href="https://t.me/+PMVyX_PWx5M4ODNk" target="_blank" rel="noreferrer" className="transition-colors hover:text-coral" aria-label="Telegram">
                                <Send className="h-5 w-5" />
                            </a>
                            <a href="https://www.youtube.com/@Wordelia" target="_blank" rel="noreferrer" className="transition-colors hover:text-coral" aria-label="Youtube">
                                <Youtube className="h-5 w-5" />
                            </a>
                            <a href="https://www.tiktok.com/@wordelia.libros" target="_blank" rel="noreferrer" className="transition-colors hover:text-coral" aria-label="TikTok">
                                <TikTokIcon className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
                        {footerGroups.map((group) => (
                            <div key={group.title}>
                                <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-teal">
                                    {group.title}
                                </h4>
                                <ul className="space-y-3 text-sm text-grey">
                                    {group.links.map((link) => (
                                        <li key={link.href}>
                                            <Link href={link.href} className="transition-colors hover:text-coral">
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-3xl border border-teal/10 bg-white/70 p-5 shadow-sm">
                        <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-teal">Suscríbete a la newsletter</h4>
                        <p className="mt-3 text-sm leading-relaxed text-grey/80">
                            Lecturas recomendadas, novedades y rincones de Wordelia directos a tu correo. Sin spam, a tu ritmo.
                        </p>
                        {subscribed ? (
                            <div className="mt-4 rounded-2xl border border-teal/20 bg-teal/10 px-4 py-3 text-center text-sm font-medium text-teal-dark">
                                ¡Listo! Te has suscrito a la newsletter.
                            </div>
                        ) : (
                            <form onSubmit={handleSubscribe} className="mt-4 space-y-3">
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(event) => {
                                        setEmail(event.target.value);
                                        if (error) setError(null);
                                    }}
                                    placeholder="tu@email.com"
                                    aria-invalid={error ? true : undefined}
                                    className="w-full rounded-2xl border border-teal/10 bg-white px-4 py-3 text-sm transition-all placeholder:text-grey/40 focus:border-teal/30 focus:outline-none focus:ring-2 focus:ring-teal/10"
                                />
                                {error && (
                                    <p className="text-xs font-medium text-coral">{error}</p>
                                )}
                                <Button type="submit" disabled={submitting} className="w-full justify-center">
                                    {submitting ? "Suscribiendo…" : "Suscribirme"}
                                </Button>
                            </form>
                        )}
                    </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 border-t border-teal/10 pt-6 text-xs text-grey/60 md:flex-row md:items-center md:justify-between">
                    <p>© 2026 Wordelia. Todos los derechos reservados.</p>
                    <p>Hecho con calma por lectores para lectores.</p>
                </div>
            </div>
        </footer>
    );
}
