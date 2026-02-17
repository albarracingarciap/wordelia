"use client";

import * as React from "react";
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
    if (!isOpen) return null;

    const sizeClasses = {
        sm: "max-w-md",
        md: "max-w-xl",
        lg: "max-w-3xl",
        xl: "max-w-5xl"
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            <Card className={`relative w-full ${sizeClasses[size]} shadow-xl animate-scale-up z-10 ${className}`} noPadding>
                {title && (
                    <div className="px-6 pt-6 pb-2">
                        <h3 className="text-xl font-serif text-teal">{title}</h3>
                    </div>
                )}
                <div className="p-6">
                    {children}
                </div>
            </Card>
        </div>
    );
}
