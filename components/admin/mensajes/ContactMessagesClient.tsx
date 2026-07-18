"use client";

import { useState, useTransition } from "react";
import { Mail, ChevronDown } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { updateContactMessageStatus } from "@/app/app/admin/mensajes/actions";

export type ContactMessage = {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    source: string | null;
    status: string;
    created_at: string;
};

const SUBJECT_LABELS: Record<string, string> = {
    general: "Consulta general",
    clubs: "Clubs y organizaciones",
    librerias: "Librerías",
    educacion: "Educación",
    otro: "Otro",
};

const STATUS_LABELS: Record<string, string> = {
    new: "Nuevo",
    read: "Leído",
    replied: "Respondido",
    archived: "Archivado",
};

const STATUS_STYLES: Record<string, string> = {
    new: "bg-coral/10 text-coral border-coral/20",
    read: "bg-teal/10 text-teal border-teal/20",
    replied: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    archived: "bg-muted text-muted-foreground border-transparent",
};

const FILTERS = [
    { value: "all", label: "Todos" },
    { value: "new", label: "Nuevos" },
    { value: "read", label: "Leídos" },
    { value: "replied", label: "Respondidos" },
    { value: "archived", label: "Archivados" },
];

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function ContactMessagesClient({ messages }: { messages: ContactMessage[] }) {
    const [filter, setFilter] = useState("all");
    const [expanded, setExpanded] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    const visible = filter === "all" ? messages : messages.filter((m) => m.status === filter);

    const changeStatus = (id: string, status: string) => {
        startTransition(async () => {
            await updateContactMessageStatus(id, status);
        });
    };

    // Al desplegar un mensaje nuevo se marca como leído.
    const toggle = (msg: ContactMessage) => {
        const opening = expanded !== msg.id;
        setExpanded(opening ? msg.id : null);
        if (opening && msg.status === "new") changeStatus(msg.id, "read");
    };

    return (
        <div className="space-y-4">
            <nav className="flex flex-wrap gap-2">
                {FILTERS.map((f) => {
                    const count = f.value === "all"
                        ? messages.length
                        : messages.filter((m) => m.status === f.value).length;
                    return (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === f.value
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground hover:bg-accent/50"
                                }`}
                        >
                            {f.label} <span className="opacity-60">({count})</span>
                        </button>
                    );
                })}
            </nav>

            {visible.length === 0 ? (
                <EmptyState
                    title="Sin mensajes"
                    description={
                        filter === "all"
                            ? "Todavía no habéis recibido ningún mensaje desde el formulario de contacto."
                            : "No hay mensajes con este estado."
                    }
                    icon={<Mail className="w-10 h-10" />}
                />
            ) : (
                <ul className="space-y-3">
                    {visible.map((msg) => {
                        const isOpen = expanded === msg.id;
                        return (
                            <li
                                key={msg.id}
                                className="rounded-xl border border-teal/10 bg-background overflow-hidden"
                            >
                                <button
                                    onClick={() => toggle(msg)}
                                    aria-expanded={isOpen}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/40 transition-colors"
                                >
                                    <span
                                        className={`shrink-0 px-2 py-0.5 rounded-full border text-xs font-medium ${STATUS_STYLES[msg.status] ?? STATUS_STYLES.archived}`}
                                    >
                                        {STATUS_LABELS[msg.status] ?? msg.status}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block font-medium truncate">
                                            {msg.name}
                                            <span className="text-muted-foreground font-normal"> · {SUBJECT_LABELS[msg.subject] ?? msg.subject}</span>
                                        </span>
                                        <span className="block text-sm text-muted-foreground truncate">
                                            {msg.message}
                                        </span>
                                    </span>
                                    <span className="shrink-0 hidden sm:block text-xs text-muted-foreground">
                                        {formatDate(msg.created_at)}
                                    </span>
                                    <ChevronDown
                                        className={`shrink-0 w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                                    />
                                </button>

                                {isOpen && (
                                    <div className="border-t border-teal/10 px-4 py-4 space-y-4">
                                        <dl className="grid gap-1 text-sm sm:grid-cols-2">
                                            <div>
                                                <dt className="inline text-muted-foreground">Email: </dt>
                                                <dd className="inline">
                                                    <a
                                                        href={`mailto:${msg.email}`}
                                                        className="text-teal underline-offset-2 hover:underline"
                                                    >
                                                        {msg.email}
                                                    </a>
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="inline text-muted-foreground">Recibido: </dt>
                                                <dd className="inline">{formatDate(msg.created_at)}</dd>
                                            </div>
                                            {msg.source && (
                                                <div>
                                                    <dt className="inline text-muted-foreground">Origen: </dt>
                                                    <dd className="inline">{msg.source}</dd>
                                                </div>
                                            )}
                                        </dl>

                                        <p className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/40 rounded-lg p-4">
                                            {msg.message}
                                        </p>

                                        <div className="flex flex-wrap gap-2">
                                            <a
                                                href={`mailto:${msg.email}?subject=${encodeURIComponent(`Re: tu mensaje a Wordelia`)}`}
                                                className="px-3 py-1.5 rounded-md text-sm font-medium bg-teal text-white hover:bg-teal-dark transition-colors"
                                            >
                                                Responder
                                            </a>
                                            {msg.status !== "replied" && (
                                                <button
                                                    disabled={pending}
                                                    onClick={() => changeStatus(msg.id, "replied")}
                                                    className="px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-50 transition-colors"
                                                >
                                                    Marcar como respondido
                                                </button>
                                            )}
                                            {msg.status !== "archived" && (
                                                <button
                                                    disabled={pending}
                                                    onClick={() => changeStatus(msg.id, "archived")}
                                                    className="px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-50 transition-colors"
                                                >
                                                    Archivar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
