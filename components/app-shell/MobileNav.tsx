"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Bookmark, Store, Building2, Coins, Trophy, X } from "lucide-react";
import { useFeatureFlags } from "@/lib/useFeatureFlags";

// Simplified icons for mobile
const Icons = {
    Home: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
    Users: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    User: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    More: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>,
    Heart: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
};

const MOBILE_ITEMS = [
    { label: "Inicio", href: "/app/mi-lectura", icon: Icons.Home },
    { label: "Deseos", href: "/app/wishes", icon: Icons.Heart },
    { label: "Clubs", href: "/app/clubs", icon: Icons.Users },
    { label: "Perfil", href: "/app/perfil", icon: Icons.User },
];

export function MobileNav() {
    const pathname = usePathname();
    const flags = useFeatureFlags();
    const [moreOpen, setMoreOpen] = React.useState(false);

    // Opciones del sidebar que no caben en la barra (accesibles vía "Más").
    const moreItems = [
        { label: "Explorar", href: "/app/explorar", icon: Compass },
        { label: "Librerías", href: "/app/librerias/descubrir", icon: Building2 },
        { label: "Guardados", href: "/app/guardados", icon: Bookmark },
        { label: "Retos", href: "/app/retos", icon: Trophy },
        ...(flags.librerias ? [{ label: "Mi librería", href: "/app/librerias", icon: Store }] : []),
        { label: "Monedas", href: "/app/monedas", icon: Coins },
    ];

    // "Más" queda activo cuando estamos en alguna de sus secciones.
    const moreActive = moreItems.some((i) => pathname.startsWith(i.href));

    return (
        <>
            {moreOpen && (
                <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMoreOpen(false)}>
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
                    <div
                        className="absolute bottom-16 left-0 w-full rounded-t-2xl border-t border-teal/10 bg-white p-4 pb-6 shadow-2xl safe-area-bottom"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-widest text-grey/40">Más</span>
                            <button onClick={() => setMoreOpen(false)} className="rounded-full p-1 text-grey/50 hover:text-coral" aria-label="Cerrar">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {moreItems.map((item) => {
                                const isActive = pathname.startsWith(item.href);
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMoreOpen(false)}
                                        className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${isActive ? "border-teal/30 bg-teal/5 text-teal" : "border-teal/10 bg-white text-grey hover:border-teal/20 hover:text-teal"}`}
                                    >
                                        <Icon className="h-5 w-5 shrink-0" />
                                        <span className="text-sm font-medium">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <nav className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-lg border-t border-teal/5 z-50 lg:hidden safe-area-bottom">
                <div className="flex justify-around items-center h-16 px-2">
                    {MOBILE_ITEMS.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMoreOpen(false)}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors w-full h-full ${isActive ? "text-teal" : "text-grey/60 hover:text-teal/70"}`}
                            >
                                <Icon className={`w-6 h-6 mb-0.5 ${isActive ? "fill-teal/10" : ""}`} />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        );
                    })}

                    <button
                        onClick={() => setMoreOpen((v) => !v)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors w-full h-full ${moreActive || moreOpen ? "text-teal" : "text-grey/60 hover:text-teal/70"}`}
                        aria-expanded={moreOpen}
                    >
                        <Icons.More className="w-6 h-6 mb-0.5" />
                        <span className="text-[10px] font-medium">Más</span>
                    </button>
                </div>
            </nav>
        </>
    );
}
