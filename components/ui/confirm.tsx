"use client";

import * as React from "react";
import { ConfirmModal } from "./ConfirmModal";

type ConfirmOpts = {
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: "default" | "danger";
};

// Singleton: cualquier componente cliente puede llamar a confirmDialog(...) y
// recibir una promesa que resuelve true/false, en vez de window.confirm(). El
// <ConfirmRoot/> (montado una vez en el layout) renderiza el diálogo real.
let opener: ((opts: ConfirmOpts) => Promise<boolean>) | null = null;

export function confirmDialog(opts: ConfirmOpts): Promise<boolean> {
    if (!opener) {
        // Fallback defensivo si el root no está montado (no debería ocurrir).
        return Promise.resolve(typeof window !== "undefined" ? window.confirm(opts.message || opts.title) : false);
    }
    return opener(opts);
}

export function ConfirmRoot() {
    const [state, setState] = React.useState<{ opts: ConfirmOpts; resolve: (v: boolean) => void } | null>(null);

    React.useEffect(() => {
        opener = (opts) => new Promise<boolean>((resolve) => setState({ opts, resolve }));
        return () => { opener = null; };
    }, []);

    const close = (value: boolean) => {
        state?.resolve(value);
        setState(null);
    };

    return (
        <ConfirmModal
            open={state !== null}
            title={state?.opts.title ?? ""}
            message={state?.opts.message}
            confirmLabel={state?.opts.confirmLabel ?? "Confirmar"}
            cancelLabel={state?.opts.cancelLabel ?? "Cancelar"}
            tone={state?.opts.tone ?? "default"}
            onConfirm={() => close(true)}
            onCancel={() => close(false)}
        />
    );
}
