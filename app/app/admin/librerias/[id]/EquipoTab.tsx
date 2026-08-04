"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Crown, Shield, User, Loader2, Plus, Trash2, ArrowUpCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { OrgTeamMember } from "../data";
import { addOrgMemberAction, setOrgMemberRoleAction, removeOrgMemberAction, transferOwnershipAction } from "../actions";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

function roleBadge(role: string) {
    if (role === "owner")
        return <span className="inline-flex items-center gap-1 text-xs font-semibold text-coral bg-coral/10 py-1 px-2 rounded-md"><Crown className="w-3 h-3" /> Propietario</span>;
    if (role === "manager")
        return <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-dark bg-teal/20 py-1 px-2 rounded-md"><Shield className="w-3 h-3" /> Manager</span>;
    return <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted py-1 px-2 rounded-md"><User className="w-3 h-3" /> Staff</span>;
}

export function EquipoTab({ orgId, team }: { orgId: string; team: OrgTeamMember[] }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
    const [email, setEmail] = useState("");
    const [addRole, setAddRole] = useState("staff");
    const [confirmAction, setConfirmAction] = useState<
        { title: string; message: string; confirmLabel: string; act: () => void } | null
    >(null);

    const run = (fn: () => Promise<{ success: true } | { error: string }>, okMsg: string) => {
        setFeedback(null);
        startTransition(async () => {
            const res = await fn();
            if ("error" in res) setFeedback({ ok: false, msg: res.error });
            else {
                setFeedback({ ok: true, msg: okMsg });
                router.refresh();
            }
        });
    };

    return (
        <div className="space-y-5 max-w-3xl">
            {/* Añadir miembro */}
            <div className="bg-card rounded-xl border border-teal/10 shadow-sm p-5 space-y-3">
                <p className="text-sm font-medium flex items-center gap-1.5"><Plus className="w-4 h-4 text-teal" /> Añadir al equipo</p>
                <div className="flex flex-wrap items-center gap-2">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email del usuario registrado"
                        className="flex-1 min-w-[220px] bg-background border border-input rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal"
                    />
                    <select
                        value={addRole}
                        onChange={(e) => setAddRole(e.target.value)}
                        disabled={pending}
                        className="bg-background border border-input rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal disabled:opacity-50"
                    >
                        <option value="staff">Staff</option>
                        <option value="manager">Manager</option>
                    </select>
                    <button
                        disabled={pending || !email.trim()}
                        onClick={() => {
                            const value = email;
                            setEmail("");
                            run(() => addOrgMemberAction(orgId, value, addRole), "Miembro añadido.");
                        }}
                        className="inline-flex items-center gap-1.5 text-sm font-medium bg-teal text-white py-2 px-4 rounded-md hover:bg-teal-dark transition-colors disabled:opacity-40"
                    >
                        {pending && <Loader2 className="w-4 h-4 animate-spin" />} Añadir
                    </button>
                </div>
                <p className="text-xs text-muted-foreground">El usuario debe tener cuenta en Wordelia. Owner/manager gestionan la librería; staff, apoyo.</p>
            </div>

            {feedback && (
                <div className={`flex items-center gap-2 text-sm rounded-lg px-4 py-3 ${feedback.ok ? "bg-teal/10 text-teal-dark border border-teal/20" : "bg-coral/10 text-coral border border-coral/20"}`}>
                    {feedback.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {feedback.msg}
                </div>
            )}

            {/* Lista */}
            <div className="bg-card rounded-xl border border-teal/10 shadow-sm divide-y divide-teal/5">
                {team.map((m) => (
                    <div key={m.userId} className="flex items-center gap-3 p-4 flex-wrap">
                        <Link href={`/app/admin/usuarios/${m.userId}`} className="flex items-center gap-3 min-w-0 flex-1 group">
                            <Avatar
                                src={m.avatarUrl ?? undefined}
                                fallback={m.username ? m.username.substring(0, 2).toUpperCase() : "US"}
                                size="sm"
                                className="bg-teal/10 text-teal-dark border-teal/20"
                            />
                            <div className="flex flex-col min-w-0">
                                <span className="font-medium text-sm group-hover:text-teal-dark transition-colors truncate">
                                    {m.name || m.username || "Usuario"}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">{m.email || "—"}</span>
                            </div>
                        </Link>

                        {roleBadge(m.role)}

                        {!m.isOwner && (
                            <div className="flex items-center gap-2">
                                <select
                                    value={m.role === "manager" ? "manager" : "staff"}
                                    onChange={(e) => run(() => setOrgMemberRoleAction(orgId, m.userId, e.target.value), "Rol actualizado.")}
                                    disabled={pending}
                                    className="bg-background border border-input rounded-md text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal cursor-pointer disabled:opacity-50"
                                >
                                    <option value="staff">Staff</option>
                                    <option value="manager">Manager</option>
                                </select>
                                <button
                                    disabled={pending}
                                    onClick={() => setConfirmAction({
                                        title: "Transferir propiedad",
                                        message: `¿Hacer propietario a ${m.name || m.email || "este usuario"}? El propietario actual pasará a manager.`,
                                        confirmLabel: "Transferir",
                                        act: () => run(() => transferOwnershipAction(orgId, m.userId), "Propiedad transferida."),
                                    })}
                                    className="inline-flex items-center gap-1 text-xs text-teal-dark hover:underline disabled:opacity-50"
                                    title="Transferir propiedad"
                                >
                                    <ArrowUpCircle className="w-3.5 h-3.5" /> Propietario
                                </button>
                                <button
                                    disabled={pending}
                                    onClick={() => setConfirmAction({
                                        title: "Quitar del equipo",
                                        message: `¿Quitar a ${m.name || m.email || "este usuario"} del equipo de la librería?`,
                                        confirmLabel: "Quitar",
                                        act: () => run(() => removeOrgMemberAction(orgId, m.userId), "Miembro quitado."),
                                    })}
                                    className="inline-flex items-center gap-1 text-xs text-coral hover:underline disabled:opacity-50"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Quitar
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <ConfirmModal
                open={confirmAction !== null}
                title={confirmAction?.title ?? ""}
                message={confirmAction?.message}
                confirmLabel={confirmAction?.confirmLabel ?? "Confirmar"}
                tone="danger"
                busy={pending}
                onConfirm={() => { const a = confirmAction; setConfirmAction(null); a?.act(); }}
                onCancel={() => setConfirmAction(null)}
            />
        </div>
    );
}
