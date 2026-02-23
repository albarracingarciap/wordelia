"use client";

import { useState, useEffect } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { SearchInput } from "@/components/ui/SearchInput";
import { getUsersAction, updateUserRoleAction } from "@/app/app/admin/ajustes/actions";
import { Shield, ShieldAlert, User, Search, Loader2 } from "lucide-react";

export function UserRoleManager() {
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async (query = "") => {
        setIsLoading(true);
        try {
            const { users, error } = await getUsersAction(query);
            if (!error && users) {
                setUsers(users);
            }
        } catch (error) {
            console.error("Failed to load users", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchQuery(val);
        // Simple debounce
        const debounceId = setTimeout(() => {
            fetchUsers(val);
        }, 500);
        return () => clearTimeout(debounceId);
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        if (!confirm(`¿Estás seguro de cambiar este usuario a ${newRole.toUpperCase()}?`)) {
            return;
        }

        setUpdatingId(userId);
        try {
            const result = await updateUserRoleAction(userId, newRole);
            if (result.error) {
                alert(`Error: ${result.error}`);
            } else {
                setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            }
        } catch (err) {
            console.error(err);
            alert("Error de conexión al cambiar el rol.");
        } finally {
            setUpdatingId(null);
        }
    };

    const getRoleBadge = (role: string) => {
        if (role === 'admin') return <span className="flex items-center gap-1 text-xs font-semibold text-coral bg-coral/10 py-1 px-2 rounded-md"><ShieldAlert className="w-3 h-3" /> Admin</span>;
        if (role === 'editor') return <span className="flex items-center gap-1 text-xs font-semibold text-teal-dark bg-teal/20 py-1 px-2 rounded-md"><Shield className="w-3 h-3" /> Editor</span>;
        return <span className="flex items-center gap-1 text-xs text-muted-foreground py-1 px-2 rounded-md"><User className="w-3 h-3" /> Usuario</span>;
    };

    return (
        <div className="bg-card rounded-xl border border-teal/10 shadow-sm flex flex-col">
            <div className="p-4 md:p-6 border-b border-teal/10 space-y-4">
                <div>
                    <h3 className="text-lg font-semibold">Usuarios y Roles</h3>
                    <p className="text-sm text-muted-foreground mt-1">Busca usuarios registrados y asigna permisos de administración o edición.</p>
                </div>

                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar por email, usuario o nombre..."
                        className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 transition-shadow"
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                </div>
            </div>

            <div className="overflow-x-auto min-h-[300px]">
                {isLoading ? (
                    <div className="flex justify-center items-center py-12 text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin text-teal" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No se encontraron usuarios.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-6 py-3 font-medium">Usuario</th>
                                <th className="px-6 py-3 font-medium">Email</th>
                                <th className="px-6 py-3 font-medium">Rol Actual</th>
                                <th className="px-6 py-3 border-l border-border/50 text-right font-medium text-xs uppercase tracking-wider">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-teal/5">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <Avatar
                                                src={user.avatar_url}
                                                fallback={user.username ? user.username.substring(0, 2).toUpperCase() : "US"}
                                                size="sm"
                                                className="bg-teal/10 text-teal-dark border-teal/20"
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground">{user.full_name || "Sin nombre"}</span>
                                                {user.username && <span className="text-xs text-muted-foreground">@{user.username}</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3.5 text-muted-foreground">
                                        {user.email || "No disponible"}
                                    </td>
                                    <td className="px-6 py-3.5">
                                        {getRoleBadge(user.role || 'user')}
                                    </td>
                                    <td className="px-6 py-3.5 border-l border-border/50 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            {updatingId === user.id && <Loader2 className="w-4 h-4 animate-spin text-teal" />}
                                            <select
                                                className="bg-background border border-input rounded-md text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal cursor-pointer"
                                                value={user.role || 'user'}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                disabled={updatingId === user.id}
                                            >
                                                <option value="user">Hacer Usuario</option>
                                                <option value="editor">Hacer Editor</option>
                                                <option value="admin">Hacer Admin</option>
                                            </select>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            {users.length >= 50 && (
                <div className="p-4 border-t border-teal/10 text-center text-xs text-muted-foreground">
                    Se muestran los primeros 50 resultados. Usa la búsqueda para encontrar a alguien específico.
                </div>
            )}
        </div>
    );
}
