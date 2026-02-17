"use client";

import * as React from "react";

interface ChipProps {
    label: string;
    active?: boolean;
    onClick?: () => void;
    href?: string;
    variant?: "default" | "filter" | "neutral" | "selected";
    size?: "default" | "sm";
    className?: string; // Add className support
}

export function Chip({ label, active = false, onClick, href, variant = "default", size = "default", className = "" }: ChipProps) {
    let baseStyles =
        "inline-flex items-center justify-center rounded-2xl font-medium transition-all duration-200 border cursor-pointer select-none";

    // Size styles
    if (size === "sm") {
        baseStyles += " px-3 py-1 text-xs";
    } else {
        baseStyles += " px-5 py-2.5 text-sm";
    }

    let activeStyles = "";

    if (variant === "default") {
        activeStyles = active
            ? "bg-teal/10 border-teal text-teal-dark"
            : "bg-white border-black/5 text-grey hover:border-teal/30 hover:bg-cream";
    } else if (variant === "filter") {
        // Filter is usually smaller, override base padding/size if needed, but size prop handles it mostly
        if (size === "default") baseStyles = "inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border cursor-pointer select-none";

        activeStyles = active
            ? "bg-teal text-white border-teal"
            : "bg-white border-grey/20 text-grey hover:border-teal hover:text-teal";
    } else if (variant === "neutral") {
        activeStyles = "bg-grey/5 border-transparent text-grey-dark";
    } else if (variant === "selected") {
        activeStyles = "bg-coral/5 border-coral/20 text-coral";
    }

    if (href) {
        return (
            <a href={href} className={`${baseStyles} ${activeStyles} ${className}`}>
                {label}
            </a>
        );
    }

    return (
        <button
            onClick={onClick}
            className={`${baseStyles} ${activeStyles} ${className}`}
        >
            {label}
        </button>
    );
}
