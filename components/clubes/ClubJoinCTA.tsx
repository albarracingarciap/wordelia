"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

// Único punto de la página pública que depende de la sesión: con sesión
// iniciada lleva al club real dentro de la app; sin ella, al registro.
// Así el resto de /clubes/[slug] se renderiza en servidor y es indexable.
export function ClubJoinCTA({ clubId, clubName }: { clubId: string; clubName: string }) {
    const { isLoggedIn } = useAuth();

    if (isLoggedIn) {
        return (
            <Link
                href={`/app/clubs/${clubId}`}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-coral px-8 font-semibold text-white shadow-sm shadow-coral/20 transition-all hover:bg-[#C25852]"
            >
                Ir al club
            </Link>
        );
    }

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
                href={`/register?source=club&club=${encodeURIComponent(clubName)}`}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-coral px-8 font-semibold text-white shadow-sm shadow-coral/20 transition-all hover:bg-[#C25852]"
            >
                Empezar
            </Link>
            <p className="text-sm text-grey/60">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="font-medium text-teal underline-offset-2 hover:underline">
                    Inicia sesión
                </Link>
            </p>
        </div>
    );
}
