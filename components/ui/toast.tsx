"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "error" | "success" | "info";
type ToastItem = { id: number; message: string; type: ToastType };

let counter = 0;
let items: ToastItem[] = [];
const listeners = new Set<(t: ToastItem[]) => void>();

function emit() {
    for (const l of listeners) l(items);
}

function push(message: string, type: ToastType) {
    const id = ++counter;
    items = [...items, { id, message, type }];
    emit();
    setTimeout(() => {
        items = items.filter((t) => t.id !== id);
        emit();
    }, 4500);
}

// Reemplaza a window.alert(): toast.error(msg) / toast.success(msg) / toast.info(msg).
export const toast = {
    error: (message: string) => push(message, "error"),
    success: (message: string) => push(message, "success"),
    info: (message: string) => push(message, "info"),
};

const STYLES: Record<ToastType, string> = {
    error: "bg-coral text-white",
    success: "bg-teal text-white",
    info: "bg-teal-dark text-white",
};

function Icon({ type }: { type: ToastType }) {
    if (type === "success") return <CheckCircle2 className="h-4 w-4 shrink-0" />;
    if (type === "error") return <AlertTriangle className="h-4 w-4 shrink-0" />;
    return <Info className="h-4 w-4 shrink-0" />;
}

export function Toaster() {
    const [list, setList] = React.useState<ToastItem[]>([]);

    React.useEffect(() => {
        listeners.add(setList);
        setList(items);
        return () => { listeners.delete(setList); };
    }, []);

    if (list.length === 0) return null;

    return (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 px-4">
            {list.map((t) => (
                <div
                    key={t.id}
                    className={`pointer-events-auto flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium shadow-lg animate-fade-in ${STYLES[t.type]}`}
                    role="status"
                >
                    <Icon type={t.type} />
                    <span className="min-w-0 flex-1">{t.message}</span>
                    <button
                        onClick={() => { items = items.filter((x) => x.id !== t.id); emit(); }}
                        className="shrink-0 rounded-full p-0.5 text-white/70 hover:text-white"
                        aria-label="Cerrar"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
