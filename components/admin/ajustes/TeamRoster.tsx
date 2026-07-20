"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { getStaffAction, updateUserRoleAction } from "@/app/app/admin/ajustes/actions";
import { Shield, ShieldAlert, Loader2, ExternalLink, Info } from "lucide-react";

interface StaffMember {
    id: string;
    email: string | null;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    role: string | null;
}

export function TeamRoster({ currentUserId }: { currentUserId: string }) {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        setIsLoading(true);
        try {
            const { staff, error } = await getStaffAction();
            if (!error && staff) setStaff(staff);
        } catch (e) {
            console.error("Failed to load staff", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = async (member: StaffMember, newRole: string) => {
        if (newRole === (member.role ?? "")) return;

        const label =
            newRole === "user"
                ? `quitar del equipo a ${member.full_name || member.email || "este usuario"}`
                : `cambiar su rol a ${newRole.toUpperCase()}`;
        if (!confirm(`¿Seguro que quieres ${label}?`)) return;

        setUpdatingId(member.id);
        try {
            const result = await updateUserRoleAction(member.id, newRole);
            if (result.error) {
                alert(`Error: ${result.error}`);
            } else if (newRole === "user") {
                // Ya no es staff: sale del roster.
                setStaff((s) => s.filter((m) => m.id !== member.id));
            } else {
                setStaff((s) => s.map((m) => (m.id === member.id ? { ...m, role: newRole } : m)));
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión al cambiar el rol.");
        } finally {
            setUpdatingId(null);
        }
    };

    const roleBadge = (role: string | null) => {
        if (role === "admin")
            return (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-coral bg-coral/10 py-1 px-2 rounded-md">
                    <ShieldAlert className="w-3 h-3" /> Admin
                </span>
            );
        return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-dark bg-teal/20 py-1 px-2 rounded-md">
                <Shield className="w-3 h-3" /> Editor
            </span>
        );
    };

    return (
        <div className="bg-card rounded-xl border border-teal/10 shadow-sm flex flex-col">
            <div className="p-4 md:p-6 border-b border-teal/10">
                <h3 className="text-lg font-semibold">Equipo</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Quién tiene acceso al panel. <b>Admin</b>: acceso total. <b>Editor</b>: gestiona contenido.
                </p>
            </div>

            <div className="flex items-start gap-2 text-sm bg-teal/5 text-muted-foreground px-4 md:px-6 py-3 border-b border-teal/10">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-teal" />
                <span>
                    Para dar acceso a alguien nuevo, búscalo en{" "}
                    <Link href="/app/admin/usuarios" className="text-teal-dark font-medium hover:underline">
                        Usuarios
                    </Link>{" "}
                    y cámbiale el rol desde su ficha.
                </span>
            </div>

            <div className="overflow-x-auto min-h-[200px]">
                {isLoading ? (
                    <div className="flex justify-center items-center py-12 text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin text-teal" />
                    </div>
                ) : staff.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No hay miembros en el equipo.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-6 py-3 font-medium">Miembro</th>
                                <th className="px-6 py-3 font-medium">Email</th>
                                <th className="px-6 py-3 font-medium">Rol</th>
                                <th className="px-6 py-3 border-l border-border/50 text-right font-medium text-xs uppercase tracking-wider">
                                    Gestionar
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-teal/5">
                            {staff.map((member) => {
                                const isSelf = member.id === currentUserId;
                                return (
                                    <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-3.5">
                                            <Link
                                                href={`/app/admin/usuarios/${member.id}`}
                                                className="flex items-center gap-3 group"
                                            >
                                                <Avatar
                                                    src={member.avatar_url ?? undefined}
                                                    fallback={
                                                        member.username
                                                            ? member.username.substring(0, 2).toUpperCase()
                                                            : "US"
                                                    }
                                                    size="sm"
                                                    className="bg-teal/10 text-teal-dark border-teal/20"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-foreground group-hover:text-teal-dark transition-colors flex items-center gap-1.5">
                                                        {member.full_name || "Sin nombre"}
                                                        {isSelf && (
                                                            <span className="text-[10px] font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                                tú
                                                            </span>
                                                        )}
                                                    </span>
                                                    {member.username && (
                                                        <span className="text-xs text-muted-foreground">
                                                            @{member.username}
                                                        </span>
                                                    )}
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-3.5 text-muted-foreground">
                                            {member.email || "—"}
                                        </td>
                                        <td className="px-6 py-3.5">{roleBadge(member.role)}</td>
                                        <td className="px-6 py-3.5 border-l border-border/50 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                {updatingId === member.id && (
                                                    <Loader2 className="w-4 h-4 animate-spin text-teal" />
                                                )}
                                                {isSelf ? (
                                                    <Link
                                                        href={`/app/admin/usuarios/${member.id}`}
                                                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-teal-dark transition-colors"
                                                    >
                                                        Ver ficha <ExternalLink className="w-3 h-3" />
                                                    </Link>
                                                ) : (
                                                    <select
                                                        className="bg-background border border-input rounded-md text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal cursor-pointer"
                                                        value={member.role ?? "editor"}
                                                        onChange={(e) => handleChange(member, e.target.value)}
                                                        disabled={updatingId === member.id}
                                                    >
                                                        <option value="admin">Admin</option>
                                                        <option value="editor">Editor</option>
                                                        <option value="user">Quitar del equipo</option>
                                                    </select>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
