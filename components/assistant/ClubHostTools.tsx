"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, RefreshCw, HeartPulse, CalendarClock, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { peekClubEmotionalMap, getClubEmotionalMap, type ClubEmotionResult } from "@/app/app/asistente/club-actions";
import { peekClubSessionPlan, getClubSessionPlan, type ClubSessionResult } from "@/app/app/asistente/club-actions";

type EmotionState = ClubEmotionResult | { status: "empty" } | { status: "loading" };
type SessionState = ClubSessionResult | { status: "empty" } | { status: "loading" };

function ToolHeader({ icon, title, onRefresh, refreshing, showRefresh }: { icon: React.ReactNode; title: string; onRefresh: () => void; refreshing: boolean; showRefresh: boolean }) {
    return (
        <div className="mb-2 flex items-center justify-between gap-2">
            <p className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-dark">{icon} {title}</p>
            {showRefresh && (
                <button onClick={onRefresh} disabled={refreshing} className="inline-flex items-center gap-1 text-xs font-medium text-grey/50 transition-colors hover:text-teal disabled:opacity-50">
                    <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} /> Actualizar
                </button>
            )}
        </div>
    );
}

function GenerateCTA({ label, busyLabel, onClick, busy }: { label: string; busyLabel: string; onClick: () => void; busy: boolean }) {
    return (
        <button onClick={onClick} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-dark disabled:opacity-60">
            {busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {busy ? busyLabel : label}
        </button>
    );
}

export function ClubHostTools({ clubId }: { clubId: string }) {
    const [emotion, setEmotion] = React.useState<EmotionState>({ status: "loading" });
    const [session, setSession] = React.useState<SessionState>({ status: "loading" });
    const [emoBusy, setEmoBusy] = React.useState(false);
    const [sesBusy, setSesBusy] = React.useState(false);

    React.useEffect(() => {
        let active = true;
        peekClubEmotionalMap(clubId).then((r) => active && setEmotion(r)).catch(() => active && setEmotion({ status: "empty" }));
        peekClubSessionPlan(clubId).then((r) => active && setSession(r)).catch(() => active && setSession({ status: "empty" }));
        return () => { active = false; };
    }, [clubId]);

    const genEmotion = async (force: boolean) => {
        setEmoBusy(true);
        try { setEmotion(await getClubEmotionalMap(clubId, force)); }
        catch { setEmotion({ status: "error", message: "No hemos podido generar el resumen." }); }
        finally { setEmoBusy(false); }
    };
    const genSession = async (force: boolean) => {
        setSesBusy(true);
        try { setSession(await getClubSessionPlan(clubId, force)); }
        catch { setSession({ status: "error", message: "No hemos podido preparar la sesión." }); }
        finally { setSesBusy(false); }
    };

    if (emotion.status === "loading") return null;
    // Host sin plan/librería → upsell único. No-host/no-auth → nada.
    if (emotion.status === "locked") {
        if (emotion.reason !== "requires_plan") return null;
        return (
            <section className="mb-6">
                <ToolsHeading />
                <Card className="bg-white">
                    <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-coral/10 text-coral"><Sparkles className="h-4 w-4" /></span>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-teal-dark">Herramientas de anfitrión con IA</p>
                            <p className="mt-1 text-xs text-grey/60">Resumen del mapa emocional del grupo y preparación de sesiones de análisis. Incluido en el plan Bibliófilo y para librerías.</p>
                            <Link href="/planes" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-coral hover:underline">Ver Bibliófilo <ArrowRight className="h-3 w-3" /></Link>
                        </div>
                    </div>
                </Card>
            </section>
        );
    }

    return (
        <section className="mb-6 space-y-4">
            <ToolsHeading />

            {/* Mapa emocional */}
            <Card className="bg-white">
                <ToolHeader
                    icon={<HeartPulse className="h-4 w-4 text-coral" />}
                    title="Mapa emocional del club"
                    onRefresh={() => genEmotion(true)}
                    refreshing={emoBusy}
                    showRefresh={emotion.status === "ok"}
                />
                {emotion.status === "ok" ? (
                    <>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-grey-dark">{emotion.text}</p>
                        <p className="mt-3 border-t border-teal/5 pt-2 text-[11px] text-grey/40">Basado en {emotion.participants} lectores · agregado y anónimo · {emotion.bookTitle}</p>
                    </>
                ) : emotion.status === "no_book" ? (
                    <p className="py-2 text-sm text-grey/60">Este club no tiene una lectura activa todavía.</p>
                ) : emotion.status === "not_enough" ? (
                    <p className="py-2 text-sm text-grey/60">Necesitas al menos 3 lectores con emociones registradas para un resumen anónimo{emotion.participants > 0 ? ` (ahora hay ${emotion.participants}).` : "."}</p>
                ) : emotion.status === "limit" ? (
                    <p className="py-2 text-sm text-grey/60">Has alcanzado tu límite de generaciones de este mes.</p>
                ) : emotion.status === "error" ? (
                    <div className="flex items-center gap-3 py-1"><p className="text-sm text-grey/60">{emotion.message}</p><button onClick={() => genEmotion(false)} disabled={emoBusy} className="text-sm font-bold text-teal hover:underline disabled:opacity-50">Reintentar</button></div>
                ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3 py-1">
                        <p className="text-sm text-grey/70">Sintetiza cómo ha vivido el grupo la lectura, de forma anónima.</p>
                        <GenerateCTA label="Generar resumen" busyLabel="Analizando..." onClick={() => genEmotion(false)} busy={emoBusy} />
                    </div>
                )}
            </Card>

            {/* Preparar sesión */}
            <Card className="bg-white">
                <ToolHeader
                    icon={<CalendarClock className="h-4 w-4 text-teal" />}
                    title="Preparar sesión de análisis"
                    onRefresh={() => genSession(true)}
                    refreshing={sesBusy}
                    showRefresh={session.status === "ok"}
                />
                {session.status === "ok" ? (
                    <>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed text-grey-dark">{session.text}</div>
                        <p className="mt-3 border-t border-teal/5 pt-2 text-[11px] text-grey/40">A partir de la guía y el genoma de {session.bookTitle}</p>
                    </>
                ) : session.status === "no_book" ? (
                    <p className="py-2 text-sm text-grey/60">Este club no tiene una lectura activa todavía.</p>
                ) : session.status === "no_resources" ? (
                    <p className="py-2 text-sm text-grey/60">Aún no hay guía ni genoma disponibles para este libro.</p>
                ) : session.status === "limit" ? (
                    <p className="py-2 text-sm text-grey/60">Has alcanzado tu límite de generaciones de este mes.</p>
                ) : session.status === "error" ? (
                    <div className="flex items-center gap-3 py-1"><p className="text-sm text-grey/60">{session.message}</p><button onClick={() => genSession(false)} disabled={sesBusy} className="text-sm font-bold text-teal hover:underline disabled:opacity-50">Reintentar</button></div>
                ) : session.status === "loading" ? (
                    <p className="py-2 text-sm text-grey/40">Cargando…</p>
                ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3 py-1">
                        <p className="text-sm text-grey/70">Agenda y preguntas de análisis a partir de la guía y el genoma del libro.</p>
                        <GenerateCTA label="Preparar sesión" busyLabel="Preparando..." onClick={() => genSession(false)} busy={sesBusy} />
                    </div>
                )}
            </Card>
        </section>
    );
}

function ToolsHeading() {
    return (
        <div className="mb-3 flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-grey/40">Herramientas de anfitrión</h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-coral/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-coral">
                <Sparkles className="h-3 w-3" /> IA
            </span>
        </div>
    );
}
