"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/Button";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function Navbar() {
    const [isOpen, setIsOpen] = React.useState(false);
    const { isLoggedIn, logout } = useAuth();
    const router = useRouter();

    const handleNavigation = (href: string, requiresAuth: boolean = false) => {
        if (requiresAuth) {
            if (isLoggedIn) {
                router.push(href);
            } else {
                router.push("/login");
            }
        } else {
            // Logic for internal anchors vs external pages
            if (href.startsWith("#")) {
                const element = document.querySelector(href);
                if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                } else if (window.location.pathname !== "/") {
                    // If we are not on home, go to home then anchor (simple approach: just go home)
                    router.push("/" + href);
                }
            } else {
                router.push(href);
            }
        }
        setIsOpen(false);
    };

    const links = [
        { label: "Explorar", href: "/explorar", requiresAuth: false },
        { label: "Clubes", href: "/clubes", requiresAuth: false },
        { label: "Lista de deseos", href: "/deseos", requiresAuth: false },
        { label: "ADN literario", href: "/app/adn", requiresAuth: false },
        { label: "Planes", href: "/planes", requiresAuth: false },
    ];

    return (
        <nav className="fixed top-0 z-50 w-full bg-cream/90 backdrop-blur-sm border-b border-black/5">
            <div className="mx-auto flex h-[72px] max-w-[1248px] items-center justify-between px-6 md:px-8">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 h-full">
                    {/* TRIPLED SIZE: Increased from h-8 to h-20 (approx 80px), adjusted aspect ratio */}
                    {/* Added relative positioning to parent link to help centering if needed, but flex items-center on container should handle it. 
                        If the image has whitespace, it might look off-center. Ensuring flex centering. */}
                    <div className="relative h-20 w-auto aspect-[4/1] flex items-center justify-center">
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

                {/* Desktop Links - Centered */}
                <div className="hidden lg:flex items-center gap-6 xl:gap-8 h-full absolute left-1/2 transform -translate-x-1/2">
                    {links.map((link) => (
                        <button
                            key={link.label}
                            onClick={() => handleNavigation(link.href, link.requiresAuth)}
                            className="text-sm font-medium text-grey hover:text-teal hover:underline decoration-teal/50 underline-offset-4 transition-colors"
                        >
                            {link.label}
                        </button>
                    ))}
                </div>

                {/* Desktop CTA */}
                <div className="hidden lg:block">
                    <div className="flex items-center gap-4">
                        {isLoggedIn ? (
                            <Button variant="ghost" size="sm" onClick={logout} className="text-grey hover:text-teal">
                                Cerrar sesión
                            </Button>
                        ) : (
                            <>
                                <Button variant="ghost" size="sm" onClick={() => router.push("/register")} className="text-grey hover:text-teal">
                                    Registrar
                                </Button>
                                <Button variant="primary" size="sm" className="rounded-full px-6 shadow-coral/20" onClick={() => router.push("/login")}>
                                    Entrar
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Mobile menu button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="lg:hidden p-2 text-teal"
                >
                    <span className="sr-only">Abrir menú</span>
                    {isOpen ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="absolute top-[72px] left-0 w-full bg-cream/98 border-b border-black/5 py-4 px-6 lg:hidden shadow-lg flex flex-col gap-4">
                    {links.map((link) => (
                        <button
                            key={link.label}
                            onClick={() => handleNavigation(link.href, link.requiresAuth)}
                            className="text-base font-medium text-grey hover:text-teal py-2 border-b border-black/5 last:border-0 text-left"
                        >
                            {link.label}
                        </button>
                    ))}
                    <div className="pt-2 flex flex-col gap-2">
                        {isLoggedIn ? (
                            <Button fullWidth onClick={() => { logout(); setIsOpen(false); }}>
                                Cerrar sesión
                            </Button>
                        ) : (
                            <>
                                <Button variant="ghost" fullWidth onClick={() => router.push("/register")}>
                                    Registrar
                                </Button>
                                <Button fullWidth onClick={() => router.push("/login")}>
                                    Entrar
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
