"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Heart, User, Users } from "lucide-react";

// Pestañas del shell móvil.
const TABS = [
    { label: "Leyendo", href: "/m", icon: BookOpen, match: (p: string) => p === "/m" },
    { label: "Clubs", href: "/m/clubs", icon: Users, match: (p: string) => p.startsWith("/m/clubs") },
    { label: "Deseos", href: "/m/deseos", icon: Heart, match: (p: string) => p.startsWith("/m/deseos") },
    { label: "Yo", href: "/m/yo", icon: User, match: (p: string) => p.startsWith("/m/yo") },
];

export function MobileTabBar() {
    const pathname = usePathname() || "/m";

    return (
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-teal/5 bg-white/95 backdrop-blur-lg safe-area-bottom">
            <div className="mx-auto flex h-16 max-w-xl items-stretch justify-around px-2">
                {TABS.map(({ label, href, icon: Icon, match }) => {
                    const active = match(pathname);
                    return (
                        <Link
                            key={label}
                            href={href}
                            aria-current={active ? "page" : undefined}
                            className={`flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${active ? "text-teal" : "text-grey/55 active:text-teal/70"}`}
                        >
                            <Icon className={`h-6 w-6 ${active ? "fill-teal/10" : ""}`} strokeWidth={active ? 2.2 : 1.8} />
                            <span className="text-[11px] font-medium">{label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
