"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock, ShieldAlert, XCircle } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { getClubReports, updateClubReportStatus } from "@/app/app/clubs/[id]/actions";

type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

interface ClubReport {
    id: string;
    reason: string;
    details: string;
    status: ReportStatus;
    created_at: string;
    resolved_at?: string | null;
    reporter?: {
        full_name?: string | null;
        username?: string | null;
        avatar_url?: string | null;
    } | null;
    events?: ClubReportEvent[];
}

interface ClubReportEvent {
    id: string;
    status: ReportStatus;
    note?: string | null;
    created_at: string;
    actor?: {
        full_name?: string | null;
        username?: string | null;
        avatar_url?: string | null;
    } | null;
}

interface StatusChangeDraft {
    reportId: string;
    status: ReportStatus;
    reason: string;
}

function StatusChangeModal({
    draft,
    onClose,
    onConfirm,
    isSubmitting,
}: {
    draft: StatusChangeDraft | null;
    onClose: () => void;
    onConfirm: (note: string) => void;
    isSubmitting: boolean;
}) {
    const [note, setNote] = React.useState("");

    React.useEffect(() => {
        setNote("");
    }, [draft]);

    if (!draft) return null;

    const isRequired = draft.status === "resolved" || draft.status === "dismissed";
    const meta = STATUS_META[draft.status];

    return (
        <Modal isOpen={!!draft} onClose={onClose} title="Añadir seguimiento" size="sm" className="-translate-y-6 sm:translate-y-0">
            <div className="space-y-5">
                <div className="rounded-2xl bg-cream/70 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-grey/45">Nuevo estado</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="font-bold text-teal-dark">{draft.reason}</p>
                        <StatusBadge status={draft.status} />
                    </div>
                </div>

                <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-grey/45">
                        Motivo {isRequired ? "*" : "(opcional)"}
                    </span>
                    <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        rows={4}
                        placeholder={
                            draft.status === "reviewing"
                                ? "Ej. Revisamos el hilo y contactamos con el moderador..."
                                : `Explica por qué queda como ${meta.label.toLowerCase()}...`
                        }
                        className="min-h-32 w-full resize-none rounded-2xl border border-grey/10 bg-white px-4 py-3 text-sm leading-6 text-grey-dark outline-none transition placeholder:text-grey/30 focus:border-teal focus:ring-2 focus:ring-teal/10"
                    />
                </label>

                <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={() => onConfirm(note)}
                        disabled={isSubmitting || (isRequired && !note.trim())}
                    >
                        {isSubmitting ? "Guardando..." : "Guardar seguimiento"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

const STATUS_META: Record<ReportStatus, { label: string; icon: React.ReactNode; className: string }> = {
    open: {
        label: "Abierto",
        icon: <ShieldAlert size={13} />,
        className: "bg-coral/10 text-coral border-coral/20",
    },
    reviewing: {
        label: "En revisión",
        icon: <Clock size={13} />,
        className: "bg-amber-100 text-amber-700 border-amber-200",
    },
    resolved: {
        label: "Resuelto",
        icon: <CheckCircle2 size={13} />,
        className: "bg-teal/10 text-teal border-teal/20",
    },
    dismissed: {
        label: "Descartado",
        icon: <XCircle size={13} />,
        className: "bg-grey/10 text-grey/60 border-grey/10",
    },
};

function formatReportDate(date: string) {
    return new Date(date).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function StatusBadge({ status }: { status: ReportStatus }) {
    const meta = STATUS_META[status];
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${meta.className}`}>
            {meta.icon}
            {meta.label}
        </span>
    );
}

export function ReportsPanel() {
    const params = useParams();
    const clubId = params.id as string;

    const [reports, setReports] = React.useState<ClubReport[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [updatingId, setUpdatingId] = React.useState<string | null>(null);
    const [filter, setFilter] = React.useState<"active" | "all">("active");
    const [error, setError] = React.useState<string | null>(null);
    const [statusDraft, setStatusDraft] = React.useState<StatusChangeDraft | null>(null);

    const loadReports = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        const data = await getClubReports(clubId);
        setReports(data as ClubReport[]);
        setLoading(false);
    }, [clubId]);

    React.useEffect(() => {
        loadReports();
    }, [loadReports]);

    const handleStatusChange = async (reportId: string, status: ReportStatus, note: string) => {
        setUpdatingId(reportId);
        setError(null);
        const result = await updateClubReportStatus(clubId, reportId, status, note);
        setUpdatingId(null);

        if (result?.error) {
            setError(result.error);
            return;
        }

        setStatusDraft(null);
        await loadReports();
    };

    const openStatusDraft = (report: ClubReport, status: ReportStatus) => {
        setStatusDraft({ reportId: report.id, status, reason: report.reason });
    };

    const activeCount = reports.filter((report) => report.status === "open" || report.status === "reviewing").length;
    const visibleReports = filter === "active"
        ? reports.filter((report) => report.status === "open" || report.status === "reviewing")
        : reports;

    return (
        <div className="space-y-5">
            <Card className="rounded-3xl">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-teal">Reportes del club</h3>
                        <p className="mt-1 text-sm leading-6 text-grey/60">
                            Revisa avisos enviados por miembros y marca cada caso según su estado.
                        </p>
                    </div>
                    <Badge variant={activeCount > 0 ? "brand" : "neutral"}>
                        {activeCount} activos
                    </Badge>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-cream/70 p-1">
                    <button
                        type="button"
                        onClick={() => setFilter("active")}
                        className={`min-h-10 rounded-xl text-sm font-bold transition ${filter === "active" ? "bg-teal text-white shadow-sm" : "text-grey/55"}`}
                    >
                        Activos
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter("all")}
                        className={`min-h-10 rounded-xl text-sm font-bold transition ${filter === "all" ? "bg-teal text-white shadow-sm" : "text-grey/55"}`}
                    >
                        Todos
                    </button>
                </div>

                {error && (
                    <p className="mt-4 rounded-2xl bg-coral/10 px-3 py-3 text-sm font-bold text-coral">
                        {error}
                    </p>
                )}
            </Card>

            {loading ? (
                <Card className="rounded-3xl py-10 text-center text-sm text-grey/45">
                    Cargando reportes...
                </Card>
            ) : visibleReports.length === 0 ? (
                <Card className="rounded-3xl py-10 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal/5 text-teal/50">
                        <AlertCircle size={26} />
                    </div>
                    <h4 className="mt-4 text-lg font-bold text-teal-dark">Sin reportes pendientes</h4>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-grey/60">
                        Cuando alguien reporte un problema del club, aparecerá aquí para que podáis revisarlo.
                    </p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {visibleReports.map((report) => {
                        const reporterName = report.reporter?.full_name || "Miembro del club";
                        const isBusy = updatingId === report.id;

                        return (
                            <Card key={report.id} className="rounded-3xl">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 gap-3">
                                            <Avatar
                                                src={report.reporter?.avatar_url || undefined}
                                                fallback={reporterName[0] || "?"}
                                            />
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h4 className="font-bold text-teal-dark">{report.reason}</h4>
                                                    <StatusBadge status={report.status} />
                                                </div>
                                                <p className="mt-1 text-xs text-grey/50">
                                                    {reporterName}
                                                    {report.reporter?.username ? ` · @${report.reporter.username}` : ""}
                                                    {" · "}
                                                    {formatReportDate(report.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="rounded-2xl bg-cream/60 px-4 py-3 text-sm leading-6 text-grey/75">
                                        {report.details}
                                    </p>

                                    {report.events && report.events.length > 0 && (
                                        <div className="rounded-2xl border border-teal/10 bg-white px-4 py-3">
                                            <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-grey/45">
                                                Seguimiento
                                            </p>
                                            <div className="space-y-3">
                                                {report.events.map((event) => {
                                                    const actorName = event.actor?.full_name || "Moderación";

                                                    return (
                                                        <div key={event.id} className="border-l-2 border-teal/15 pl-3">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <StatusBadge status={event.status} />
                                                                <span className="text-xs text-grey/50">
                                                                    {actorName} · {formatReportDate(event.created_at)}
                                                                </span>
                                                            </div>
                                                            {event.note && (
                                                                <p className="mt-2 text-sm leading-6 text-grey/70">{event.note}</p>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid gap-2 sm:grid-cols-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={isBusy || report.status === "reviewing"}
                                            onClick={() => openStatusDraft(report, "reviewing")}
                                        >
                                            En revisión
                                        </Button>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            disabled={isBusy || report.status === "resolved"}
                                            onClick={() => openStatusDraft(report, "resolved")}
                                        >
                                            Resolver
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={isBusy || report.status === "dismissed"}
                                            onClick={() => openStatusDraft(report, "dismissed")}
                                        >
                                            Descartar
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            <StatusChangeModal
                draft={statusDraft}
                onClose={() => setStatusDraft(null)}
                onConfirm={(note) => {
                    if (!statusDraft) return;
                    handleStatusChange(statusDraft.reportId, statusDraft.status, note);
                }}
                isSubmitting={!!statusDraft && updatingId === statusDraft.reportId}
            />
        </div>
    );
}
