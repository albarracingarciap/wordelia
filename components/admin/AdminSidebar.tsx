"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UsersRound, BookOpen, Trophy, Settings, LogOut, Mail, Layers, Store, MessageSquareQuote } from "lucide-react";

export function AdminSidebar() {
    const pathname = usePathname();

    const links = [
        { href: "/app/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
        { href: "/app/admin/usuarios", label: "Usuarios", icon: UsersRound },
        { href: "/app/admin/clubes", label: "Clubes Originals", icon: Users },
        { href: "/app/admin/retos", label: "Retos", icon: Trophy },
        { href: "/app/admin/catalogo", label: "Catálogo", icon: BookOpen },
        { href: "/app/admin/colecciones", label: "Colecciones", icon: Layers },
        { href: "/app/admin/librerias", label: "Librerías", icon: Store },
        { href: "/app/admin/prompts", label: "Prompts", icon: MessageSquareQuote },
        { href: "/app/admin/mensajes", label: "Mensajes", icon: Mail },
        { href: "/app/admin/ajustes", label: "Ajustes", icon: Settings },
    ];

    return (
        <aside className="w-64 bg-background border-r border-teal/10 h-[calc(100vh-80px)] overflow-y-auto hidden md:flex flex-col">
            <div className="p-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    Panel de Control
                </h2>
                <nav className="space-y-1">
                    {links.map((link) => {
                        const isActive = link.exact
                            ? pathname === link.href
                            : pathname.startsWith(link.href);

                        const Icon = link.icon;

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive
                                    ? "bg-accent text-accent-foreground font-medium"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="mt-auto p-4 border-t border-teal/10">
                <Link
                    href="/app/mi-lectura"
                    className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                >
                    <LogOut className="w-4 h-4 ml-1 rotate-180" />
                    Volver a Wordelia
                </Link>
            </div>
        </aside>
    );
}
