"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { useParams } from "next/navigation";
import {
    getClubMembers,
    approveMember,
    rejectMember,
    removeMember,
    updateMemberRole,
    inviteMemberByUsername,
    regenerateJoinCode,
} from "@/app/app/clubs/[id]/actions";
import { Copy, RefreshCw, UserPlus, Check, ChevronDown, ShieldCheck, Shield, UserX, X } from "lucide-react";

interface Member {
    user_id: string;
    role: string;
    joined_at: string | null;
    profile: { full_name: string; avatar_url: string | null; username: string | null } | null;
}

function RoleBadge({ role }: { role: string }) {
    if (role === 'admin') return <Badge variant="brand" size="sm">Admin</Badge>;
    if (role === 'moderator') return <Badge variant="neutral" size="sm">Mod</Badge>;
    return null;
}

function formatDate(dateStr: string | null) {
    if (!dateStr) return "Recientemente";
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface InviteModalProps {
    clubId: string;
    onClose: () => void;
    onSuccess: () => void;
}

function InviteModal({ clubId, onClose, onSuccess }: InviteModalProps) {
    const [query, setQuery] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);

    const handleInvite = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setError(null);
        const result = await inviteMemberByUsername(clubId, query.trim());
        setLoading(false);
        if (result?.error) {
            setError(result.error);
        } else {
            setSuccess(`¡${(result as any).profile?.full_name || query} añadido al club!`);
            setTimeout(() => { onSuccess(); onClose(); }, 1500);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="w-full rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-sm sm:rounded-2xl">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-teal-dark">Invitar miembro</h3>
                    <button
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-grey/40 transition-colors hover:bg-grey/5 hover:text-coral"
                        aria-label="Cerrar"
                    >
                        <X size={20} />
                    </button>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-grey/60">Busca por nombre de usuario o nombre completo.</p>
                <Input
                    className="mt-4"
                    placeholder="ej. maria_lectora"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleInvite()}
                />
                {error && <p className="mt-3 text-sm text-coral">{error}</p>}
                {success && (
                    <p className="mt-3 flex items-center gap-2 text-sm text-teal">
                        <Check size={14} /> {success}
                    </p>
                )}
                <div className="mt-5 grid gap-3 sm:flex">
                    <Button variant="primary" onClick={handleInvite} disabled={loading || !query.trim()} className="w-full sm:flex-1">
                        {loading ? "Buscando..." : "Invitar"}
                    </Button>
                    <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto">Cancelar</Button>
                </div>
            </div>
        </div>
    );
}

export function MembersList({ club }: { club?: any }) {
    const params = useParams();
    const clubId = params.id as string;

    const [members, setMembers] = React.useState<Member[]>([]);
    const [pending, setPending] = React.useState<Member[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [showInviteModal, setShowInviteModal] = React.useState(false);
    const [joinCode, setJoinCode] = React.useState<string>(club?.join_code || "");
    const [copiedCode, setCopiedCode] = React.useState(false);
    const [memberActions, setMemberActions] = React.useState<Record<string, boolean>>({});
    const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);

    const visibility = club?.visibility || "public";
    const isAdmin = club?.userRole === 'admin';
    const isAdminOrMod = isAdmin || club?.userRole === 'moderator';

    const reload = async () => {
        setLoading(true);
        const data = await getClubMembers(clubId);
        setMembers(data.members as unknown as Member[]);
        setPending(data.pending as unknown as Member[]);
        setLoading(false);
    };

    React.useEffect(() => { reload(); }, [clubId]);

    const copyCode = () => {
        const link = `${window.location.origin}/app/clubs?join=${encodeURIComponent(joinCode)}`;
        navigator.clipboard.writeText(link);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const handleRegenerate = async () => {
        if (!confirm("¿Regenerar el código? El anterior dejará de funcionar.")) return;
        const result = await regenerateJoinCode(clubId);
        if (result?.success && (result as any).code) {
            setJoinCode((result as any).code);
        }
    };

    const setActionLoading = (userId: string, val: boolean) =>
        setMemberActions(prev => ({ ...prev, [userId]: val }));

    const handleApprove = async (userId: string) => {
        setActionLoading(userId, true);
        await approveMember(clubId, userId);
        await reload();
    };

    const handleReject = async (userId: string) => {
        setActionLoading(userId, true);
        await rejectMember(clubId, userId);
        await reload();
    };

    const handleRemove = async (userId: string, name: string) => {
        if (!confirm(`¿Expulsar a ${name}?`)) return;
        setOpenMenuId(null);
        setActionLoading(userId, true);
        await removeMember(clubId, userId);
        await reload();
    };

    const handleRoleChange = async (userId: string, currentRole: string) => {
        setOpenMenuId(null);
        const newRole = currentRole === 'moderator' ? 'member' : 'moderator';
        setActionLoading(userId, true);
        await updateMemberRole(clubId, userId, newRole as 'member' | 'moderator');
        await reload();
    };

    return (
        <div className="space-y-6">
            {/* Join code card — only for private clubs */}
            {(visibility === 'private' || visibility === 'secret') && joinCode && (
                <Card className="border-teal/10 bg-teal/5">
                    <h4 className="text-sm font-bold text-teal-dark mb-1">Código de acceso</h4>
                    <p className="text-xs text-grey/60 mb-3">Comparte este enlace para que nuevos miembros soliciten acceso.</p>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white border border-teal/20 rounded-lg px-3 py-2 font-mono text-sm text-grey-dark tracking-widest">
                            {joinCode}
                        </div>
                        <Button variant="outline" size="sm" onClick={copyCode} className="shrink-0">
                            {copiedCode ? <Check size={14} className="text-teal" /> : <Copy size={14} />}
                            <span className="ml-1 text-xs">{copiedCode ? "¡Copiado!" : "Copiar"}</span>
                        </Button>
                        {isAdminOrMod && (
                            <Button variant="ghost" size="sm" onClick={handleRegenerate} title="Regenerar código" className="shrink-0">
                                <RefreshCw size={14} />
                            </Button>
                        )}
                    </div>
                </Card>
            )}

            {/* Pending requests — only for private clubs */}
            {(visibility === 'private' || visibility === 'secret') && pending.length > 0 && (
                <Card className="border-amber-200 bg-amber-50/30">
                    <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-4">
                        Solicitudes pendientes ({pending.length})
                    </h3>
                    <div className="space-y-3">
                        {pending.map(req => (
                            <div key={req.user_id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-amber-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <Avatar fallback={(req.profile?.full_name?.[0] || "?")} src={req.profile?.avatar_url || undefined} />
                                    <div>
                                        <p className="font-bold text-sm text-grey-dark">{req.profile?.full_name || "Usuario"}</p>
                                        <p className="text-xs text-grey/60">
                                            {req.profile?.username ? `@${req.profile.username}` : "Sin username"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm" variant="ghost"
                                        className="text-grey/60"
                                        disabled={memberActions[req.user_id]}
                                        onClick={() => handleReject(req.user_id)}
                                    >
                                        Rechazar
                                    </Button>
                                    <Button
                                        size="sm" variant="primary"
                                        disabled={memberActions[req.user_id]}
                                        onClick={() => handleApprove(req.user_id)}
                                    >
                                        Aprobar
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Members list */}
            <Card className="overflow-visible rounded-3xl">
                <div className="mb-6 flex items-center justify-between gap-3">
                    <h3 className="text-xl font-bold text-teal">
                        Miembros del club
                        {!loading && <span className="text-sm font-sans text-grey/50 ml-2">({members.length})</span>}
                    </h3>
                    {isAdminOrMod && (
                        <Button variant="outline" size="sm" onClick={() => setShowInviteModal(true)} className="shrink-0">
                            <UserPlus size={14} className="mr-1" /> Invitar
                        </Button>
                    )}
                </div>

                {loading ? (
                    <div className="py-8 text-center text-sm text-grey/40">Cargando miembros...</div>
                ) : members.length === 0 ? (
                    <div className="py-8 text-center text-sm text-grey/40 italic">No hay miembros todavía.</div>
                ) : (
                    <div className="space-y-3">
                        {members.map(member => {
                            const name = member.profile?.full_name || "Usuario";
                            const isCurrentAdmin = member.role === 'admin';
                            return (
                                <div
                                    key={member.user_id}
                                    className="relative flex items-start justify-between gap-3 rounded-2xl bg-grey/[0.04] p-3 transition-colors hover:bg-grey/[0.06]"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <Avatar
                                            fallback={name[0]}
                                            src={member.profile?.avatar_url || undefined}
                                        />
                                        <div className="min-w-0">
                                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                                                <p className="truncate text-sm font-bold text-grey-dark">{name}</p>
                                                <RoleBadge role={member.role} />
                                            </div>
                                            <p className="text-xs leading-relaxed text-grey/50">
                                                {member.profile?.username ? `@${member.profile.username} · ` : ""}
                                                Se unió {formatDate(member.joined_at)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions menu — only for non-admins, visible on hover */}
                                    {isAdminOrMod && !isCurrentAdmin && (
                                        <div className="relative">
                                            <button
                                                onClick={() => setOpenMenuId(openMenuId === member.user_id ? null : member.user_id)}
                                                className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-grey/60 transition-colors hover:bg-white hover:text-teal-dark"
                                            >
                                                Gestionar <ChevronDown size={12} />
                                            </button>
                                            {openMenuId === member.user_id && (
                                                <div className="absolute right-0 top-10 z-[80] w-56 overflow-hidden rounded-2xl border border-black/5 bg-white py-1 shadow-xl">
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleRoleChange(member.user_id, member.role)}
                                                            className="flex w-full items-center gap-2 px-3 py-2 text-sm font-bold text-grey-dark hover:bg-grey/5"
                                                        >
                                                            {member.role === 'moderator'
                                                                ? <><Shield size={14} className="text-grey/40" /> Retirar moderador</>
                                                                : <><ShieldCheck size={14} className="text-teal" /> Hacer moderador</>
                                                            }
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleRemove(member.user_id, name)}
                                                        className="flex w-full items-center gap-2 px-3 py-2 text-sm font-bold text-coral hover:bg-coral/5"
                                                    >
                                                        <UserX size={14} /> Expulsar del club
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {showInviteModal && (
                <InviteModal
                    clubId={clubId}
                    onClose={() => setShowInviteModal(false)}
                    onSuccess={reload}
                />
            )}
        </div>
    );
}
