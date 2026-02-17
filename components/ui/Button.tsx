"use client";

import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "outline";
    size?: "xs" | "sm" | "md" | "lg";
    fullWidth?: boolean;
    isLoading?: boolean;
}

export function Button({
    className,
    variant = "primary",
    size = "md",
    fullWidth = false,
    isLoading = false,
    children,
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles =
        "inline-flex items-center justify-center rounded-2xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

    const variants = {
        primary:
            "bg-coral text-white hover:bg-[#C25852] shadow-sm hover:shadow-md focus:ring-coral",
        secondary:
            "bg-transparent border border-coral text-coral hover:bg-coral/10 hover:shadow-sm focus:ring-coral",
        outline:
            "bg-transparent border border-grey/20 text-grey-dark hover:bg-grey/5 focus:ring-grey",
        ghost:
            "bg-transparent text-teal hover:bg-teal/5 hover:text-teal-dark focus:ring-teal",
    };

    const sizes = {
        xs: "h-7 px-3 text-xs",
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-base",
        lg: "h-14 px-8 text-lg",
    };

    const widthClass = fullWidth ? "w-full" : "";

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className || ""
                }`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cargando...
                </>
            ) : (
                children
            )}
        </button>
    );
}
