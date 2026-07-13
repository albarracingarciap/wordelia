"use client";

import * as React from "react";

interface TabsProps {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    children: React.ReactNode;
    className?: string;
}

interface TabsListProps {
    children: React.ReactNode;
    className?: string;
}

interface TabsTriggerProps {
    value: string;
    children: React.ReactNode;
    onClick?: () => void;
    isActive?: boolean;
}

interface TabsContentProps {
    value: string;
    children: React.ReactNode;
    activeValue?: string;
    className?: string;
}

export const TabsContext = React.createContext<{
    value: string;
    onChange: (value: string) => void;
} | null>(null);

export function Tabs({ defaultValue = "", value: controlledValue, onValueChange, children, className = "" }: TabsProps) {
    const [internalValue, setInternalValue] = React.useState(controlledValue ?? defaultValue);

    // Sync when controlled value changes (e.g. on initial render after useSearchParams resolves)
    React.useEffect(() => {
        if (controlledValue !== undefined) setInternalValue(controlledValue);
    }, [controlledValue]);

    const value = controlledValue !== undefined ? controlledValue : internalValue;
    const onChange = (v: string) => {
        if (onValueChange) onValueChange(v);
        else setInternalValue(v);
    };

    return (
        <TabsContext.Provider value={{ value, onChange }}>
            <div className={`w-full ${className}`}>
                {children}
            </div>
        </TabsContext.Provider>
    );
}

export function TabsList({ children, className = "" }: TabsListProps) {
    return (
        <div className={`flex items-center gap-6 border-b border-teal/10 mb-6 overflow-x-auto ${className}`}>
            {children}
        </div>
    );
}

export function TabsTrigger({ value, children, className = "" }: Omit<TabsTriggerProps, "isActive" | "onClick"> & { className?: string }) {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error("TabsTrigger must be used within Tabs");

    const isActive = context.value === value;
    const ref = React.useRef<HTMLButtonElement>(null);

    // Keep the active tab visible when the list scrolls horizontally (mobile/tablet).
    React.useEffect(() => {
        if (isActive) ref.current?.scrollIntoView({ inline: "center", block: "nearest" });
    }, [isActive]);

    return (
        <button
            ref={ref}
            onClick={() => context.onChange(value)}
            className={`
                relative px-1 py-3 text-sm font-medium transition-colors whitespace-nowrap
                ${isActive ? "text-teal" : "text-grey/60 hover:text-teal/80"}
                ${className}
            `}
        >
            {children}
            {isActive && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-teal rounded-t-full" />
            )}
        </button>
    );
}

export function TabsContent({ value, children, className = "" }: Omit<TabsContentProps, "activeValue">) {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error("TabsContent must be used within Tabs");

    if (context.value !== value) return null;

    return <div className={`animate-fade-in ${className}`}>{children}</div>;
}
