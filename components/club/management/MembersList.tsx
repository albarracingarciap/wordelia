import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";

// Mock Data
const MEMBERS = [
    { id: "1", name: "Ana López", role: "owner", joinedAt: "Hace 2 meses", avatar: "A" },
    { id: "2", name: "Carlos Ruiz", role: "member", joinedAt: "Hace 1 mes", avatar: "C" },
    { id: "3", name: "María Garcia", role: "member", joinedAt: "Hace 3 semanas", avatar: "M" },
    { id: "4", name: "Javier Sanz", role: "member", joinedAt: "Hace 1 semana", avatar: "J" },
];

const REQUESTS = [
    { id: "5", name: "Laura V.", requestedAt: "Hace 2 horas", avatar: "L" },
];

export function MembersList() {
    return (
        <div className="space-y-6">
            {/* Join Requests */}
            {REQUESTS.length > 0 && (
                <Card className="border-teal/20 bg-teal/5">
                    <h3 className="text-sm font-bold text-teal-dark uppercase tracking-wider mb-4">Solicitudes pendientes ({REQUESTS.length})</h3>
                    <div className="space-y-3">
                        {REQUESTS.map(req => (
                            <div key={req.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-teal/10 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <Avatar fallback={req.avatar} />
                                    <div>
                                        <p className="font-bold text-sm text-grey-dark">{req.name}</p>
                                        <p className="text-xs text-grey/60">Solicitó {req.requestedAt}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" className="text-grey/60">Rechazar</Button>
                                    <Button size="sm" variant="primary">Aprobar</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Members List */}
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-serif text-teal">Miembros del club</h3>
                    <Button variant="outline" size="sm">Invitar</Button>
                </div>

                <div className="space-y-1">
                    {MEMBERS.map(member => (
                        <div key={member.id} className="flex items-center justify-between p-3 hover:bg-grey/5 rounded-lg transition-colors group">
                            <div className="flex items-center gap-3">
                                <Avatar fallback={member.avatar} />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-sm text-grey-dark">{member.name}</p>
                                        {member.role === 'owner' && <Badge variant="neutral" size="sm">Admin</Badge>}
                                    </div>
                                    <p className="text-xs text-grey/60">Se unió {member.joinedAt}</p>
                                </div>
                            </div>

                            {member.role !== 'owner' && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50">Expulsar</Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
