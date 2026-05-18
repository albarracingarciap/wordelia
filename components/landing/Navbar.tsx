"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "../ui/Button";

type NavbarProps = {
    mode?: "auto" | "public";
};

export function Navbar({ mode = "auto" }: NavbarProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const { isLoggedIn } = useAuth();
    const showLoggedInActions = mode === "auto" && isLoggedIn;
    const router = useRouter();

    const handleNavigation = (href: string, requiresAuth: boolean = false) => {
        if (requiresAuth && !showLoggedInActions) {
            router.push("/login");
            setIsOpen(false);
            return;
        }

        if (href.startsWith("#")) {
            const element = document.querySelector(href);
            if (element) {
                element.scrollIntoView({ behavior: "smooth" });
            } else {
                router.push(`/${href}`);
            }
        } else {
            router.push(href);
        }

        setIsOpen(false);
    };

    const links = [
        { label: "Explorar", href: "/explorar", requiresAuth: false },
        { label: "Clubes", href: "/clubes", requiresAuth: false },
        { label: "Lista de deseos", href: "/deseos", requiresAuth: false },
        { label: "ADN literario", href: "/app/adn", requiresAuth: true },
        { label: "Beta", href: "/register?source=beta", requiresAuth: false },
    ];

    return (
        <nav className="fixed top-0 z-50 w-full border-b border-black/5 bg-cream/95 backdrop-blur-md">
            <div className="mx-auto flex h-[68px] max-w-[1248px] items-center justify-between px-4 sm:px-6 md:h-[72px] md:px-8">
                <Link href="/" className="flex h-full items-center gap-2">
                    <div className="relative flex h-12 w-[176px] items-center justify-center sm:h-14 sm:w-[220px]">
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

                <div className="absolute left-1/2 hidden h-full -translate-x-1/2 items-center gap-5 lg:flex xl:gap-7">
                    {links.map((link) => (
                        <button
                            key={link.label}
                            onClick={() => handleNavigation(link.href, link.requiresAuth)}
                            className="text-sm font-medium text-grey transition-colors hover:text-teal hover:underline hover:decoration-teal/50 hover:underline-offset-4"
                        >
                            {link.label}
                        </button>
                    ))}
                </div>

                <div className="hidden lg:block">
                    <div className="flex items-center gap-4">
                        {showLoggedInActions ? (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => router.push("/app/mi-lectura")}
                                className="rounded-full px-6 shadow-coral/20"
                            >
                                Ir a mi lectura
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push("/login")}
                                    className="text-grey hover:text-teal"
                                >
                                    Entrar
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="rounded-full px-6 shadow-coral/20"
                                    onClick={() => router.push("/register?source=beta")}
                                >
                                    Acceso beta
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => setIsOpen((current) => !current)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full text-teal transition-colors hover:bg-teal/5 lg:hidden"
                >
                    <span className="sr-only">Abrir menú</span>
                    {isOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
                </button>
            </div>

            {isOpen && (
                <div className="absolute left-0 top-[68px] flex w-full flex-col gap-3 border-b border-black/5 bg-cream/98 px-5 py-4 shadow-lg md:top-[72px] lg:hidden">
                    {links.map((link) => (
                        <button
                            key={link.label}
                            onClick={() => handleNavigation(link.href, link.requiresAuth)}
                            className="border-b border-black/5 py-2 text-left text-base font-medium text-grey transition-colors last:border-0 hover:text-teal"
                        >
                            {link.label}
                        </button>
                    ))}

                    <div className="flex flex-col gap-2 pt-2">
                        {showLoggedInActions ? (
                            <Button fullWidth onClick={() => router.push("/app/mi-lectura")}>
                                Ir a mi lectura
                            </Button>
                        ) : (
                            <>
                                <Button fullWidth onClick={() => router.push("/register?source=beta")}>
                                    Solicitar acceso anticipado
                                </Button>
                                <Button variant="ghost" fullWidth onClick={() => router.push("/login")}>
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
