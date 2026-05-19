"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Card } from "./Card";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    className?: string;
    size?: "sm" | "md" | "lg" | "xl";
    preserveMobileNav?: boolean;
}

export function Modal({ isOpen, onClose, children, title, className = "", size = "md", preserveMobileNav = false }: ModalProps) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    React.useEffect(() => {
        if (!isOpen) return;

        const previousHtmlOverflow = document.documentElement.style.overflow;
        const previousOverflow = document.body.style.overflow;
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";

        return () => {
            document.documentElement.style.overflow = previousHtmlOverflow;
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    if (!isOpen) return null;
    if (!mounted) return null;

    const sizeClasses = {
        sm: "max-w-md",
        md: "max-w-xl",
        lg: "max-w-3xl",
        xl: "max-w-5xl"
    };

    return createPortal(
        <div
            className={`fixed flex items-end justify-center bg-black/20 p-0 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4 ${preserveMobileNav
                ? "inset-x-0 top-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 sm:inset-0 sm:z-[100]"
                : "inset-0 z-[100]"
                }`}
        >
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            <Card className={`relative z-10 flex max-h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-b-none rounded-t-[1.75rem] shadow-xl animate-scale-up sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl ${sizeClasses[size]} ${className}`} noPadding>
                {title && (
                    <div className="shrink-0 px-5 pb-2 pt-5 sm:px-6 sm:pt-6">
                        <h3 className="text-xl font-bold text-teal">{title}</h3>
                    </div>
                )}
                <div className="min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6">
                    {children}
                </div>
            </Card>
        </div>,
        document.body
    );
}
