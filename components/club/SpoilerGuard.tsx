"use client";

import * as React from "react";
import { Button } from "../ui/Button";

interface SpoilerGuardProps {
    children: React.ReactNode;
    level: "none" | "mild" | "strict";
    userPreference?: "hide_all" | "show_mild" | "show_all";
    className?: string;
}

export function SpoilerGuard({ children, level, userPreference = "hide_all", className = "" }: SpoilerGuardProps) {
    const [isRevealed, setIsRevealed] = React.useState(false);

    // Logic: Do we hide?
    // If level is none, show.
    // If level is strict, hide unless userPreference is show_all.
    // If level is mild, hide if userPreference is hide_all.

    const shouldHide = React.useMemo(() => {
        if (level === "none") return false;
        if (userPreference === "show_all") return false;
        if (level === "strict") return true; // user is hide_all or show_mild
        if (level === "mild" && userPreference === "hide_all") return true;
        return false;
    }, [level, userPreference]);

    if (!shouldHide || isRevealed) {
        return <div className={className}>{children}</div>;
    }

    return (
        <div className={`relative rounded-lg overflow-hidden bg-grey/5 border border-grey/10 p-4 min-h-[120px] ${className}`}>
            <div className="absolute inset-0 backdrop-blur-sm bg-white/60 z-10 flex flex-col items-center justify-center text-center p-4">
                <div className="mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${level === 'strict' ? 'bg-coral text-white' : 'bg-orange-100 text-orange-800'}`}>
                        {level === 'strict' ? 'Spoiler Importante' : 'Spoiler Suave'}
                    </span>
                </div>
                <p className="text-xs text-grey/60 mb-3">Este contenido podría desvelar partes de la trama.</p>
                <Button variant="outline" size="sm" onClick={() => setIsRevealed(true)} className="h-8 text-xs bg-white">
                    Ver de todas formas
                </Button>
            </div>
            {/* Blurred content preview (optional, just keeping DOM structure but obscured) */}
            <div className="opacity-20 blur-sm select-none pointer-events-none" aria-hidden="true">
                {children}
            </div>
        </div>
    );
}
