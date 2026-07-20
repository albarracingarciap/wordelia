"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import {
    ShieldAlert,
    Clock,
    CheckCircle2,
    XCircle,
    Eye,
    Loader2,
    ExternalLink,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import type { GlobalReport } from "@/app/app/admin/ajustes/data";
import { updateReportStatusAction } from "@/app/app/admin/ajustes/actions";

type Filter = "all" | "open" | "reviewing" | "resolved" | "dismissed";

const STATUS_META: Record<string, { label: string; classes: string; icon: React.ReactNode }> = {
    open: { label: "Abierto", classes: "text-amber-700 bg-amber-100", icon: <Clock className="w-3 h-3" /> },
    reviewing: { label: "En revisión", classes: "text-blue-700 bg-blue-100", icon: <Eye className="w-3 h-3" /> },
    resolved: { label: "Resuelto", classes: "text-teal-dark bg-teal/15", icon: <CheckCircle2 className="w-3 h-3" /> },
    dismissed: { label: "Descartado", classes: "text-muted-foreground bg-muted", icon: <XCircle className="w-3 h-3" /> },
};

const FILTERS: { id: Filter; label: string }[] = [
    { id: "all", label: "Todos" },
    { id: "open", label: "Abiertos" },
    { id: "reviewing", label: "En revisión" },
    { id: "resolved", label: "Resueltos" },
    { id: "dismissed", label: "Descartados" },
];

function personName(p: { full_name: string | null; username: string | null } | null) {
    if (!p) return "Usuario";
    return p.full_name || (p.username ? `@${p.username}` : "Usuario");
}

function fmtDateTime(iso: string) {
    return new Date(iso).toLocaleString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function statusPill(status: string) {
    const meta = STATUS_META[status] ?? STATUS_META.open;
    return (
        <span className={`inline-flex items-center gap-1 text-xs font-medium py-1 px-2 rounded-md ${meta.classes}`}>
            {meta.icon} {meta.label}
        </span>
    );
}

export function ModerationQueue({
    initialReports,
    counts,
}: {
    initialReports: GlobalReport[];
    counts: Record<string, number>;
}) {
    const router = useRouter();
    const [filter, setFilter] = useState<Filter>("all");
    const [pending, startTransition] = useTransition();
    const [busyId, setBusyId] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [draft, setDraft] = useState<{ reportId: string; clubId: string; status: string } | null>(null);
    const [note, setNote] = useState("");
    const [error, setError] = useState<string | null>(null);

    const filtered = useMemo(
        () => (filter === "all" ? initialReports : initialReports.filter((r) => r.status === filter)),
        [initialReports, filter],
    );

    const apply = (reportId: string, clubId: string, status: string, noteText?: string) => {
        setBusyId(reportId);
        setError(null);
        startTransition(async () => {
            const res = await updateReportStatusAction(reportId, clubId, status, noteText);
            setBusyId(null);
            if ("error" in res) {
                setError(res.error);
            } else {
                setDraft(null);
                setNote("");
                router.refresh();
            }
        });
    };

    const onSelectStatus = (report: GlobalReport, status: string) => {
        if (status === report.status) return;
        if (status === "resolved" || status === "dismissed") {
            // Cerrar exige motivo: abrimos el campo inline.
            setDraft({ reportId: report.id, clubId: report.club_id, status });
            setNote("");
            setError(null);
        } else {
            apply(report.id, report.club_id, status);
        }
    };

    return (
        <div className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-wrap gap-2">
                {FILTERS.map((f) => {
                    const count = f.id === "all" ? initialReports.length : counts[f.id] ?? 0;
                    return (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`text-sm font-medium py-1.5 px-3 rounded-md transition-colors ${
                                filter === f.id
                                    ? "bg-teal text-white"
                                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                            }`}
                        >
                            {f.label}
                            <span className={`ml-1.5 ${filter === f.id ? "opacity-80" : "opacity-60"}`}>{count}</span>
                        </button>
                    );
                })}
            </div>

            {error && (
                <div className="bg-coral/10 text-coral text-sm rounded-lg px-4 py-3 border border-coral/20">
                    {error}
                </div>
            )}

            {filtered.length === 0 ? (
                <div className="bg-card rounded-xl border border-teal/10 p-10 text-center text-muted-foreground">
                    <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No hay reportes {filter !== "all" ? "en este estado" : "por ahora"}.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((report) => {
                        const isBusy = busyId === report.id;
                        const isExpanded = expanded === report.id;
                        const isDrafting = draft?.reportId === report.id;
                        return (
                            <div key={report.id} className="bg-card rounded-xl border border-teal/10 shadow-sm">
                                <div className="p-4 md:p-5">
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {statusPill(report.status)}
                                                <span className="text-sm font-semibold">{report.reason}</span>
                                                <Link
                                                    href={`/app/clubs/${report.club_id}`}
                                                    className="inline-flex items-center gap-1 text-xs text-teal-dark hover:underline"
                                                >
                                                    {report.club_name} <ExternalLink className="w-3 h-3" />
                                                </Link>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                                                {report.details}
                                            </p>
                                            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                                                <Avatar
                                                    src={report.reporter?.avatar_url ?? undefined}
                                                    fallback={personName(report.reporter).substring(0, 2).toUpperCase()}
                                                    size="sm"
                                                    className="!w-6 !h-6 bg-teal/10 text-teal-dark border-teal/20"
                                                />
                                                <span>Reportado por {personName(report.reporter)}</span>
                                                <span>·</span>
                                                <span>{fmtDateTime(report.created_at)}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {isBusy && <Loader2 className="w-4 h-4 animate-spin text-teal" />}
                                            <select
                                                value={report.status}
                                                onChange={(e) => onSelectStatus(report, e.target.value)}
                                                disabled={pending}
                                                className="bg-background border border-input rounded-md text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal cursor-pointer disabled:opacity-50"
                                            >
                                                <option value="open">Abierto</option>
                                                <option value="reviewing">En revisión</option>
                                                <option value="resolved">Resuelto</option>
                                                <option value="dismissed">Descartado</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Motivo de cierre (inline) */}
                                    {isDrafting && (
                                        <div className="mt-4 rounded-lg border border-teal/15 bg-muted/30 p-3 space-y-2">
                                            <label className="text-xs font-medium text-muted-foreground">
                                                Motivo para marcar como{" "}
                                                <b>{STATUS_META[draft!.status]?.label.toLowerCase()}</b>
                                            </label>
                                            <textarea
                                                value={note}
                                                onChange={(e) => setNote(e.target.value)}
                                                rows={2}
                                                placeholder="Explica brevemente la decisión (queda en el histórico)…"
                                                className="w-full bg-background border border-input rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal"
                                            />
                                            <div className="flex items-center gap-2">
                                                <button
                                                    disabled={pending || !note.trim()}
                                                    onClick={() =>
                                                        apply(report.id, report.club_id, draft!.status, note)
                                                    }
                                                    className="inline-flex items-center gap-1.5 text-sm font-medium bg-teal text-white py-1.5 px-3 rounded-md hover:bg-teal-dark transition-colors disabled:opacity-40"
                                                >
                                                    {isBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                                                    Confirmar
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setDraft(null);
                                                        setNote("");
                                                    }}
                                                    className="text-sm text-muted-foreground hover:text-foreground"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Histórico */}
                                    {report.events.length > 0 && (
                                        <div className="mt-3">
                                            <button
                                                onClick={() => setExpanded(isExpanded ? null : report.id)}
                                                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-teal-dark transition-colors"
                                            >
                                                {isExpanded ? (
                                                    <ChevronUp className="w-3 h-3" />
                                                ) : (
                                                    <ChevronDown className="w-3 h-3" />
                                                )}
                                                Histórico ({report.events.length})
                                            </button>
                                            {isExpanded && (
                                                <ul className="mt-2 space-y-2 border-l-2 border-teal/10 pl-3">
                                                    {report.events.map((ev) => (
                                                        <li key={ev.id} className="text-xs text-muted-foreground">
                                                            <span className="font-medium text-foreground">
                                                                {personName(ev.actor)}
                                                            </span>{" "}
                                                            → {STATUS_META[ev.status]?.label ?? ev.status}
                                                            <span className="mx-1">·</span>
                                                            {fmtDateTime(ev.created_at)}
                                                            {ev.note && (
                                                                <p className="text-muted-foreground/80 mt-0.5">
                                                                    “{ev.note}”
                                                                </p>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
