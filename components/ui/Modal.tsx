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
}

export function Modal({ isOpen, onClose, children, title, className = "", size = "md" }: ModalProps) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen) return null;
    if (!mounted) return null;

    const sizeClasses = {
        sm: "max-w-md",
        md: "max-w-xl",
        lg: "max-w-3xl",
        xl: "max-w-5xl"
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/20 p-0 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            <Card className={`relative z-10 w-full rounded-b-none rounded-t-[1.75rem] shadow-xl animate-scale-up sm:rounded-2xl ${sizeClasses[size]} ${className}`} noPadding>
                {title && (
                    <div className="px-5 pb-2 pt-5 sm:px-6 sm:pt-6">
                        <h3 className="text-xl font-bold text-teal">{title}</h3>
                    </div>
                )}
                <div className="p-5 sm:p-6">
                    {children}
                </div>
            </Card>
        </div>,
        document.body
    );
}
