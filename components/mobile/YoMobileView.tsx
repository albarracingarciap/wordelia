"use client";

import * as React from "react";
import Link from "next/link";
import {
    BarChart3,
    Bookmark,
    BookOpen,
    ChevronRight,
    CreditCard,
    Flame,
    Globe,
    LogOut,
    Monitor,
    Pencil,
    Target,
    Trophy,
    Users,
} from "lucide-react";
import type { ReadingChallenge } from "@/app/app/mi-lectura/challenge-actions";
import { signout } from "@/app/auth/actions";
import { PushToggle } from "@/components/pwa/PushToggle";
import { confirmDialog } from "@/components/ui/confirm";
import { setUiMode } from "./ui-mode";

interface YoMobileViewProps {
    name: string;
    username: string | null;
    avatarUrl: string | null;
    streak: number;
    weeklyPages: number;
    challenge: ReadingChallenge | null;
}

type LinkItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

// Lo que en móvil se abre en la versión completa (/app) — biblioteca entera,
// estadísticas, retos, comunidad… La app móvil cubre las tareas cortas.
const MY_READING: LinkItem[] = [
    { href: "/app/mi-lectura", label: "Mi biblioteca", icon: BookOpen },
    { href: "/app/mi-lectura/estadisticas", label: "Estadísticas", icon: BarChart3 },
    { href: "/app/retos", label: "Retos", icon: Trophy },
    { href: "/app/comunidad", label: "Comunidad", icon: Users },
    { href: "/app/guardados", label: "Guardados", icon: Bookmark },
];

export function YoMobileView({ name, username, avatarUrl, streak, weeklyPages, challenge }: YoMobileViewProps) {
    const [leaving, startLeaving] = React.useTransition();
    const target = challenge?.target ?? null;
    const read = challenge?.booksRead ?? 0;
    const pct = target ? Math.min(100, Math.round((read / target) * 100)) : 0;

    async function handleSignOut() {
        const ok = await confirmDialog({
            title: "¿Cerrar sesión?",
            message: "Tendrás que volver a entrar en este dispositivo.",
            confirmLabel: "Cerrar sesión",
        });
        if (!ok) return;
        startLeaving(async () => {
            await signout();
        });
    }

    function goFull() {
        setUiMode("full");
        window.location.href = "/app";
    }

    return (
        <div className="space-y-6">
            <header className="flex items-center gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-teal/10 ring-2 ring-white">
                    {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- avatar de storage, igual que en /app/perfil
                        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-teal">
                            {name.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-2xl font-bold text-teal">{name}</h1>
                    {username && <p className="truncate text-sm text-grey/55">@{username}</p>}
                </div>
                <Link
                    href="/app/perfil/editar"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-grey/55 shadow-sm ring-1 ring-teal/10"
                    aria-label="Editar perfil"
                >
                    <Pencil className="h-4 w-4" />
                </Link>
            </header>

            <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-teal/10">
                <Link href="/app/retos" className="block">
                    <div className="flex items-center justify-between">
                        <p className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-dark">
                            <Target className="h-4 w-4 text-coral" /> Reto {challenge?.year ?? new Date().getFullYear()}
                        </p>
                        <p className="text-sm font-bold text-teal">
                            {read}
                            {target ? <span className="font-medium text-grey/50"> / {target} libros</span> : <span className="font-medium text-grey/50"> libros</span>}
                        </p>
                    </div>
                    {target ? (
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-teal/10">
                            <div className="h-full rounded-full bg-teal" style={{ width: `${pct}%` }} />
                        </div>
                    ) : (
                        <p className="mt-1 text-xs text-grey/55">Aún no te has puesto una meta para este año. Toca para fijarla.</p>
                    )}
                </Link>
                <div className="mt-4 grid grid-cols-2 gap-2">
                    <Stat icon={Flame} value={streak} label={streak === 1 ? "día de racha" : "días de racha"} tone="text-coral" />
                    <Stat icon={BookOpen} value={weeklyPages} label="páginas esta semana" tone="text-teal" />
                </div>
            </section>

            <LinkGroup title="Mi lectura" items={MY_READING} />

            <section className="space-y-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-grey/45">Ajustes</h2>
                <PushToggle />
                <ul className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-teal/10">
                    {username && <LinkRow href={`/lector/${username}`} label="Mi perfil público" icon={Globe} />}
                    <LinkRow href="/app/perfil/editar" label="Editar perfil y privacidad" icon={Pencil} />
                    {/* Pagos solo en web (regla de tiendas): esto abre la web, no se cobra en la app. */}
                    <LinkRow href="/app/perfil/suscripcion" label="Plan y suscripción" icon={CreditCard} />
                </ul>
            </section>

            <section className="space-y-2">
                <button
                    type="button"
                    onClick={goFull}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm font-semibold text-teal shadow-sm ring-1 ring-teal/10"
                >
                    <Monitor className="h-4 w-4" /> Usar la versión completa
                </button>
                <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={leaving}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-coral disabled:opacity-50"
                >
                    <LogOut className="h-4 w-4" /> {leaving ? "Cerrando sesión…" : "Cerrar sesión"}
                </button>
            </section>
        </div>
    );
}

function Stat({
    icon: Icon,
    value,
    label,
    tone,
}: {
    icon: React.ComponentType<{ className?: string }>;
    value: number;
    label: string;
    tone: string;
}) {
    return (
        <div className="rounded-2xl bg-cream/60 p-3">
            <Icon className={`h-4 w-4 ${tone}`} />
            <p className="mt-1 text-xl font-bold text-teal-dark">{value}</p>
            <p className="text-xs text-grey/55">{label}</p>
        </div>
    );
}

function LinkGroup({ title, items }: { title: string; items: LinkItem[] }) {
    return (
        <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-grey/45">{title}</h2>
            <ul className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-teal/10">
                {items.map((it) => (
                    <LinkRow key={it.href} {...it} />
                ))}
            </ul>
        </section>
    );
}

function LinkRow({ href, label, icon: Icon }: LinkItem) {
    return (
        <li className="border-b border-teal/5 last:border-b-0">
            <Link href={href} className="flex items-center gap-3 px-4 py-3.5 active:bg-teal/5">
                <Icon className="h-5 w-5 text-teal/70" />
                <span className="flex-1 text-sm font-medium text-teal-dark">{label}</span>
                <ChevronRight className="h-4 w-4 text-grey/30" />
            </Link>
        </li>
    );
}
