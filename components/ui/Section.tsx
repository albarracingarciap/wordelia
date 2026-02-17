import * as React from "react";

interface SectionProps {
    id?: string;
    className?: string;
    children: React.ReactNode;
    containerClassName?: string;
}

export function Section({
    id,
    className = "",
    containerClassName = "",
    children,
}: SectionProps) {
    return (
        <section
            id={id}
            className={`relative w-full py-10 md:py-16 ${className}`}
        >
            <div
                className={`mx-auto w-full max-w-[1200px] px-6 md:px-8 ${containerClassName}`}
            >
                {children}
            </div>
        </section>
    );
}
