"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ScrollNavProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * Horizontal, scrollable tab bar for mobile/tablet with left/right arrow
 * controls that appear only when there is hidden content on that side.
 * At `lg` it becomes a vertical column (sidebar) and the arrows are hidden.
 */
export function ScrollNav({ children, className = "" }: ScrollNavProps) {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [canLeft, setCanLeft] = React.useState(false);
    const [canRight, setCanRight] = React.useState(false);

    const update = React.useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanLeft(el.scrollLeft > 4);
        setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }, []);

    React.useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        update();
        el.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => {
            el.removeEventListener("scroll", update);
            window.removeEventListener("resize", update);
            observer.disconnect();
        };
    }, [update]);

    const scrollByStep = (direction: number) => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({ left: direction * Math.max(180, el.clientWidth * 0.7), behavior: "smooth" });
    };

    return (
        <div className="relative">
            <button
                type="button"
                aria-label="Desplazar pestañas a la izquierda"
                tabIndex={-1}
                onClick={() => scrollByStep(-1)}
                className={`absolute inset-y-0 left-0 z-10 flex items-center bg-gradient-to-r from-cream via-cream to-transparent pr-8 ${canLeft ? "" : "hidden"}`}
            >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-teal/15 bg-white text-teal shadow-md">
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </span>
            </button>

            <div
                ref={scrollRef}
                className={`flex flex-row gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
            >
                {children}
            </div>

            <button
                type="button"
                aria-label="Desplazar pestañas a la derecha"
                tabIndex={-1}
                onClick={() => scrollByStep(1)}
                className={`absolute inset-y-0 right-0 z-10 flex items-center justify-end bg-gradient-to-l from-cream via-cream to-transparent pl-8 ${canRight ? "" : "hidden"}`}
            >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-teal/15 bg-white text-teal shadow-md">
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </span>
            </button>
        </div>
    );
}
