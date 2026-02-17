import * as React from "react";
import { AvatarStack } from "@/components/ui/AvatarStack";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface Member {
    id: string;
    name: string;
    role: "admin" | "moderator" | "member";
    status: string; // e.g., "Leyendo cap. 4"
    avatarFallback: string;
    avatarSrc?: string;
    joinedAt: string;
}

interface MembersListModalProps {
    isOpen: boolean;
    onClose: () => void;
    members?: Member[]; // Optional, will use mock if not provided
}

const MOCK_MEMBERS: Member[] = [
    { id: "1", name: "Ana García", role: "admin", status: "Cap. 5", avatarFallback: "AG", joinedAt: "Ene 2024" },
    { id: "2", name: "Marcos L.", role: "moderator", status: "Cap. 4", avatarFallback: "ML", joinedAt: "Feb 2024" },
    { id: "3", name: "Julia R.", role: "member", status: "Cap. 3", avatarFallback: "JR", joinedAt: "Mar 2024" },
    { id: "4", name: "Sofía P.", role: "member", status: "Cap. 5", avatarFallback: "SP", joinedAt: "Mar 2024" },
    { id: "5", name: "Carlos M.", role: "member", status: "Cap. 2", avatarFallback: "CM", joinedAt: "Abr 2024" },
    { id: "6", name: "Laura T.", role: "member", status: "Cap. 4", avatarFallback: "LT", joinedAt: "Abr 2024" },
    { id: "7", name: "David B.", role: "member", status: "Cap. 1", avatarFallback: "DB", joinedAt: "May 2024" },
    { id: "8", name: "Elena S.", role: "member", status: "Cap. 3", avatarFallback: "ES", joinedAt: "May 2024" },
    { id: "9", name: "Pablo A.", role: "member", status: "Cap. 5", avatarFallback: "PA", joinedAt: "Jun 2024" },
    { id: "10", name: "Carmen D.", role: "member", status: "Cap. 2", avatarFallback: "CD", joinedAt: "Jun 2024" },
];

export function MembersListModal({ isOpen, onClose, members = MOCK_MEMBERS }: MembersListModalProps) {
    // Prevent background scrolling when modal is open
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up flex flex-col max-h-[70vh] pointer-events-auto">
                {/* Header */}
                <div className="p-6 border-b border-black/5 flex justify-between items-center bg-cream/30 shrink-0">
                    <div>
                        <h2 className="font-serif text-xl text-teal-dark font-bold">Lectores del Club</h2>
                        <p className="text-xs text-grey/60">{members.length} miembros activos</p>
                    </div>
                    <button onClick={onClose} className="text-grey/40 hover:text-coral transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* List */}
                <div
                    className="overflow-y-auto p-4 space-y-2 flex-1 min-h-0"
                    style={{ overscrollBehavior: "contain" }}
                >
                    {members.map(member => (
                        <div key={member.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-grey/5 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-teal/10 text-teal font-bold flex items-center justify-center text-sm border-2 border-white shadow-sm">
                                    {member.avatarFallback}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm text-grey-dark">{member.name}</span>
                                        {member.role === "admin" && <Badge variant="brand" size="sm" className="text-[10px] px-1.5 py-0">Admin</Badge>}
                                        {member.role === "moderator" && <Badge variant="neutral" size="sm" className="text-[10px] px-1.5 py-0">Mod</Badge>}
                                    </div>
                                    <div className="text-xs text-grey/60 flex items-center gap-1">
                                        <span>{member.status}</span>
                                        <span>·</span>
                                        <span>Se unió en {member.joinedAt}</span>
                                    </div>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                Ver perfil
                            </Button>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-black/5 bg-grey/5">
                    <Button variant="outline" className="w-full text-xs" onClick={onClose}>Cerrar</Button>
                </div>
            </div>
        </div>
    );
}
