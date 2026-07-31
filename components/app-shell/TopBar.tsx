"use client";

import Link from "next/link";
import Image from "next/image";
import { SearchInput } from "../ui/SearchInput";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Sparkles, LayoutDashboard, UserPlus } from "lucide-react";
import { signout } from "@/app/auth/actions";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useMemo, useState, useRef } from "react";

type Profile = {
    username?: string | null;
    full_name?: string | null;
    avatar_url?: string | null;
    role?: string | null;
};

export function TopBar() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const supabase = useMemo(() => createClient(), []);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function getProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single();
                setProfile(data);
            }
        }
        getProfile();
    }, [supabase]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }

        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropdownOpen]);

    const displayName = profile?.username ? `@${profile.username}` : (profile?.full_name?.split(" ")[0] || "Lector");
    const initials = profile?.username
        ? profile.username.substring(0, 2).toUpperCase()
        : (profile?.full_name
            ? profile.full_name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
            : "YO");

    // Solo admin. El layout de /app/admin también admite editores, pero el
    // atajo del menú se reserva de momento a administradores.
    const canAccessAdmin = profile?.role === "admin";

    const handleSignOut = async () => {
        await signout();
    };

    return (
        <header className="sticky top-0 z-40 flex h-14 w-full items-center overflow-visible border-x-0 border-b border-t-0 border-teal/5 bg-cream/90 px-3 shadow-none outline-none backdrop-blur-md transition-all md:h-[72px] md:px-8">
            <div className="mx-auto flex w-full max-w-[1400px] min-w-0 items-center justify-between gap-2 min-[560px]:gap-3 md:gap-4">

                {/* Left: Logo (Mobile only mostly, or global home link) */}
                <div className="flex min-w-0 items-center">
                    <Link href="/app/mi-lectura" className="group flex min-w-0 items-center">
                        <div className="relative flex h-10 w-36 max-w-[38vw] items-center justify-start min-[560px]:w-44 md:h-16 md:w-56 lg:w-72">
                            <Image
                                src="/assets/images/logo_wordelia.png"
                                alt="Wordelia Logo"
                                width={300}
                                height={80}
                                className="h-auto w-full object-contain"
                                priority
                            />
                        </div>
                    </Link>
                </div>

                {/* Center: Global Search (Hidden on small mobile, expanded on desktop) */}
                <div className="mx-auto hidden min-w-0 max-w-xl flex-1 min-[560px]:block">
                    <SearchInput
                        placeholder="Busca libros, clubs, autores..."
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                const val = e.currentTarget.value;
                                if (val.trim()) {
                                    window.location.href = `/app/search?q=${encodeURIComponent(val)}`;
                                }
                            }
                        }}
                    />
                </div>

                {/* Right: Actions */}
                <div className="flex shrink-0 items-center gap-1.5 md:gap-5">
                    {/* Search Icon Mobile Trigger (Optional) */}
                    <Link href="/app/search" className="rounded-full p-2 text-teal/70 hover:bg-teal/5 min-[560px]:hidden" aria-label="Buscar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    </Link>

                    {/* Notifications */}
                    <button className="relative rounded-full p-2 text-teal/70 transition-colors hover:bg-teal/5 group" aria-label="Notificaciones">
                        <Badge dot className="bg-coral">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-teal-dark transition-colors"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                        </Badge>
                    </button>

                    {/* User Menu */}
                    <div className="relative pl-1.5 md:border-l md:border-teal/10 md:pl-2" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 transition-opacity hover:opacity-80"
                            aria-label="Abrir menú de usuario"
                        >
                            <span className="hidden md:block text-sm font-medium text-teal text-right leading-tight">
                                Hola, <br /> <span className="font-bold">{displayName}</span>
                            </span>
                            <Avatar
                                size="sm"
                                src={profile?.avatar_url || undefined}
                                fallback={initials}
                                className="bg-coral/10 text-coral border-coral/20 md:h-10 md:w-10"
                            />
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="fixed right-3 top-14 z-[80] w-48 rounded-xl border border-teal/10 bg-white py-1 shadow-lg animate-fade-in md:right-8 md:top-[68px]">
                                <Link
                                    href="/app/perfil"
                                    onClick={() => setIsDropdownOpen(false)}
                                    className="w-full text-left px-4 py-2 text-sm text-grey hover:bg-teal/5 transition-colors flex items-center gap-2"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    Mi perfil
                                </Link>
                                <Link
                                    href="/app/monedas"
                                    onClick={() => setIsDropdownOpen(false)}
                                    className="w-full text-left px-4 py-2 text-sm text-grey hover:bg-teal/5 transition-colors flex items-center gap-2"
                                >
                                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                                    Invitar amigo
                                </Link>
                                <Link
                                    href="/planes"
                                    onClick={() => setIsDropdownOpen(false)}
                                    className="w-full text-left px-4 py-2 text-sm text-grey hover:bg-teal/5 transition-colors flex items-center gap-2"
                                >
                                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                                    Mi plan
                                </Link>
                                {canAccessAdmin && (
                                    <>
                                        <div className="my-1 border-t border-teal/5" />
                                        <Link
                                            href="/app/admin"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="w-full text-left px-4 py-2 text-sm text-teal hover:bg-teal/5 transition-colors flex items-center gap-2"
                                        >
                                            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                                            Administración
                                        </Link>
                                    </>
                                )}
                                <div className="my-1 border-t border-teal/5" />
                                <button
                                    onClick={handleSignOut}
                                    className="w-full text-left px-4 py-2 text-sm text-grey hover:bg-teal/5 transition-colors flex items-center gap-2"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                    Cerrar sesión
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
