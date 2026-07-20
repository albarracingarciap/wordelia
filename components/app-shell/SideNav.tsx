"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFeatureFlags } from "@/lib/useFeatureFlags";

// Icons (Simple SVGs for now)
const Icons = {
    Home: (props: any) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
    Compass: (props: any) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>,
    Users: (props: any) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    Sparkles: (props: any) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>,
    Bookmark: (props: any) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></svg>,
    User: (props: any) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    Heart: (props: any) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
    Store: (props: any) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" /><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" /><path d="M2 7h20" /><path d="M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7" /></svg>,
}

const NAV_ITEMS = [
    { label: "Mi lectura", href: "/app/mi-lectura", icon: Icons.Home },
    { label: "Explorar", href: "/app/explorar", icon: Icons.Compass },
    { label: "Clubs", href: "/app/clubs", icon: Icons.Users },
    { label: "Lista de deseos", href: "/app/wishes", icon: Icons.Heart },
    { label: "Guardados", href: "/app/guardados", icon: Icons.Bookmark },
    { label: "Mi librería", href: "/app/librerias", icon: Icons.Store },
    { label: "Perfil", href: "/app/perfil", icon: Icons.User },
];

export function SideNav() {
    const pathname = usePathname();
    const flags = useFeatureFlags();

    // El espacio de librerías se oculta del menú cuando el flag está desactivado.
    const navItems = NAV_ITEMS.filter(
        (item) => item.href !== "/app/librerias" || flags.librerias,
    );

    return (
        <aside className="hidden lg:flex flex-col w-[260px] xl:w-[280px] h-[calc(100vh-72px)] sticky top-[72px] border-r border-teal/5 bg-cream/30 p-6 overflow-y-auto">

            <div className="space-y-1">
                <p className="px-4 text-xs font-bold text-grey/40 uppercase tracking-widest mb-4 mt-2">Menú</p>
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
                                ${isActive
                                    ? "bg-teal/5 text-teal font-medium shadow-sm"
                                    : "text-grey hover:bg-white/60 hover:text-teal-dark"
                                }
                            `}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-teal rounded-r-full" />
                            )}
                            <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : "stroke-2"}`} />
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </div>

            <div className="mt-auto pt-8 border-t border-teal/5">
                <div className="space-y-1">
                    <Link href="/recursos" className="block px-4 py-2 text-sm text-grey/60 hover:text-teal transition-colors">Recursos</Link>
                    <Link href="/normas" className="block px-4 py-2 text-sm text-grey/60 hover:text-teal transition-colors">Normas de la comunidad</Link>
                </div>
                <p className="px-4 mt-6 text-[10px] text-grey/40">© 2026 Wordelia</p>
            </div>
        </aside>
    );
}
