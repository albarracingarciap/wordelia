"use client";

import Link from "next/link";
import Image from "next/image";
import { Avatar } from "@/components/ui/Avatar";
import { signout } from "@/app/auth/actions";
import { useState, useRef, useEffect } from "react";

interface AdminNavbarProps {
    profile: any;
}

export function AdminNavbar({ profile }: AdminNavbarProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    const displayName = profile?.username ? `@${profile.username}` : (profile?.full_name?.split(" ")[0] || "Admin");
    const initials = profile?.username
        ? profile.username.substring(0, 2).toUpperCase()
        : (profile?.full_name
            ? profile.full_name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
            : "AD");

    const handleSignOut = async () => {
        await signout();
    };

    return (
        <header className="sticky top-0 z-40 w-full h-20 bg-card border-b border-teal/10 flex items-center px-4 md:px-6">
            <div className="flex items-center justify-between w-full">

                {/* Left: Logo */}
                <div className="flex items-center gap-3">
                    <Link href="/app/admin" className="flex items-center gap-2 group h-full">
                        <div className="relative h-16 w-64 flex flex-col justify-center">
                            <Image
                                src="/assets/images/logo_wordelia.png"
                                alt="Wordelia Logo"
                                width={240}
                                height={64}
                                className="object-contain"
                                priority
                            />
                        </div>
                        <span className="text-xs font-bold text-teal bg-teal/10 px-2 py-0.5 rounded-full uppercase tracking-widest hidden md:inline-block">
                            Admin
                        </span>
                    </Link>
                </div>

                {/* Right: User */}
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 hover:opacity-80 transition-opacity p-1 rounded-md"
                        >
                            <span className="hidden md:block text-sm font-medium text-right leading-tight text-foreground">
                                {displayName} <br />
                                <span className="text-xs text-muted-foreground font-normal capitalize">{profile?.role || "Admin"}</span>
                            </span>
                            <Avatar
                                size="md"
                                src={profile?.avatar_url}
                                fallback={initials}
                                className="bg-teal/10 text-teal-dark border-teal/20"
                            />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-card rounded-xl shadow-lg border border-teal/10 py-1 animate-fade-in z-50">
                                <Link
                                    href="/app/mi-lectura"
                                    className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2"
                                >
                                    Volver a Wordelia
                                </Link>
                                <div className="h-px bg-teal/10 my-1" />
                                <button
                                    onClick={handleSignOut}
                                    className="w-full text-left px-4 py-2 text-sm text-coral hover:bg-coral/10 transition-colors flex items-center gap-2"
                                >
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
