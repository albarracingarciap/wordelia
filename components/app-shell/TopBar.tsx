"use client";

import Link from "next/link";
import Image from "next/image";
import { SearchInput } from "../ui/SearchInput";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { signout } from "@/app/auth/actions";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState, useRef } from "react";

export function TopBar() {
    const [profile, setProfile] = useState<any>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const supabase = createClient();
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
    }, []);

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

    const handleSignOut = async () => {
        await signout();
    };

    return (
        <header className="sticky top-0 z-40 w-full h-16 md:h-[72px] bg-cream/80 backdrop-blur-md border-b border-teal/5 flex items-center px-4 md:px-8 transition-all">
            <div className="flex items-center justify-between w-full max-w-[1400px] mx-auto gap-4">

                {/* Left: Logo (Mobile only mostly, or global home link) */}
                <div className="flex items-center gap-3">
                    <Link href="/app/mi-lectura" className="flex items-center gap-2 group h-full">
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
                </div>

                {/* Center: Global Search (Hidden on small mobile, expanded on desktop) */}
                <div className="flex-1 max-w-xl mx-auto hidden md:block">
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
                <div className="flex items-center gap-3 md:gap-5">
                    {/* Search Icon Mobile Trigger (Optional) */}
                    <button className="md:hidden p-2 text-teal/70 hover:bg-teal/5 rounded-full">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    </button>

                    {/* Notifications */}
                    <button className="relative p-2 text-teal/70 hover:bg-teal/5 rounded-full transition-colors group">
                        <Badge dot className="bg-coral">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-teal-dark transition-colors"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                        </Badge>
                    </button>

                    {/* User Menu */}
                    <div className="relative pl-2 border-l border-teal/10" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                        >
                            <span className="hidden md:block text-sm font-medium text-teal text-right leading-tight">
                                Hola, <br /> <span className="font-bold">{displayName}</span>
                            </span>
                            <Avatar
                                size="md"
                                src={profile?.avatar_url}
                                fallback={initials}
                                className="bg-coral/10 text-coral border-coral/20"
                            />
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-teal/10 py-1 animate-fade-in z-50">
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
