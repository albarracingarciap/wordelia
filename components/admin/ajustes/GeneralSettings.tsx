"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Crown, ToggleLeft, Loader2, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import type { AppSettings } from "@/lib/app-settings";
import { updateAppSettingsAction } from "@/app/app/admin/ajustes/actions";

function Toggle({
    checked,
    onChange,
    label,
    hint,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
    hint?: string;
}) {
    return (
        <label className="flex items-start justify-between gap-4 cursor-pointer py-2">
            <span className="min-w-0">
                <span className="text-sm font-medium">{label}</span>
                {hint && <span className="block text-xs text-muted-foreground mt-0.5">{hint}</span>}
            </span>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
                    checked ? "bg-teal" : "bg-muted-foreground/30"
                }`}
            >
                <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        checked ? "translate-x-5" : ""
                    }`}
                />
            </button>
        </label>
    );
}

function Card({
    title,
    icon,
    children,
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-card rounded-xl border border-teal/10 shadow-sm">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-teal/10">
                {icon}
                <h3 className="font-semibold">{title}</h3>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

export function GeneralSettings({ initialSettings }: { initialSettings: AppSettings }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

    const [announcement, setAnnouncement] = useState(initialSettings.announcement);
    const [founder, setFounder] = useState(initialSettings.founder_window);
    const [flags, setFlags] = useState(initialSettings.flags);

    const save = () => {
        setFeedback(null);
        startTransition(async () => {
            const res = await updateAppSettingsAction({
                announcement,
                founder_window: founder,
                flags,
            });
            if ("error" in res) {
                setFeedback({ ok: false, msg: res.error });
            } else {
                setFeedback({ ok: true, msg: "Configuración guardada." });
                router.refresh();
            }
        });
    };

    return (
        <div className="space-y-5">
            <div className="flex items-start gap-2 text-sm bg-teal/5 text-muted-foreground px-4 py-3 rounded-lg border border-teal/10">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-teal" />
                <span>
                    Estos valores se guardan al instante. El <b>aviso global</b>, la <b>ventana de fundador</b> y los{" "}
                    <b>flags</b> requieren estar cableados en cada punto de la app para surtir efecto.
                </span>
            </div>

            {/* Aviso global */}
            <Card title="Aviso global" icon={<Megaphone className="w-4 h-4 text-teal" />}>
                <Toggle
                    checked={announcement.enabled}
                    onChange={(v) => setAnnouncement({ ...announcement, enabled: v })}
                    label="Mostrar aviso en la app"
                    hint="Banner visible para todos los usuarios (incidencias, novedades…)."
                />
                <div className="mt-3 space-y-3">
                    <textarea
                        value={announcement.message}
                        onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
                        rows={2}
                        placeholder="Texto del aviso…"
                        className="w-full bg-background border border-input rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal"
                    />
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Tipo:</span>
                            <select
                                value={announcement.variant}
                                onChange={(e) =>
                                    setAnnouncement({ ...announcement, variant: e.target.value as "info" | "warning" })
                                }
                                className="bg-background border border-input rounded-md text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal"
                            >
                                <option value="info">Informativo</option>
                                <option value="warning">Aviso importante</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Caduca el:</span>
                            <input
                                type="date"
                                value={announcement.expires_at ?? ""}
                                onChange={(e) =>
                                    setAnnouncement({ ...announcement, expires_at: e.target.value || null })
                                }
                                className="bg-background border border-input rounded-md text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal"
                            />
                            {announcement.expires_at && (
                                <button
                                    type="button"
                                    onClick={() => setAnnouncement({ ...announcement, expires_at: null })}
                                    className="text-xs text-muted-foreground hover:text-coral"
                                >
                                    Sin caducidad
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Ventana de fundador */}
            <Card title="Ventana de fundador" icon={<Crown className="w-4 h-4 text-teal" />}>
                <Toggle
                    checked={founder.enabled}
                    onChange={(v) => setFounder({ ...founder, enabled: v })}
                    label="Beneficio fundador activo"
                    hint="Mientras esté activa y dentro de la fecha, aplica el beneficio de clubs gratis por plan."
                />
                <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Termina el:</span>
                    <input
                        type="date"
                        value={founder.ends_at ?? ""}
                        onChange={(e) => setFounder({ ...founder, ends_at: e.target.value || null })}
                        className="bg-background border border-input rounded-md text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal"
                    />
                </div>
            </Card>

            {/* Flags */}
            <Card title="Funcionalidades" icon={<ToggleLeft className="w-4 h-4 text-teal" />}>
                <div className="divide-y divide-teal/5">
                    <Toggle
                        checked={flags.registro_abierto}
                        onChange={(v) => setFlags({ ...flags, registro_abierto: v })}
                        label="Registro abierto"
                        hint="Si se desactiva, no se admiten nuevas altas (modo lista de espera)."
                    />
                    <Toggle
                        checked={flags.librerias}
                        onChange={(v) => setFlags({ ...flags, librerias: v })}
                        label="Espacio para librerías"
                        hint="Activa la sección de librerías/clubs alojados."
                    />
                    <Toggle
                        checked={flags.asistente_ia}
                        onChange={(v) => setFlags({ ...flags, asistente_ia: v })}
                        label="Asistente literario IA"
                        hint="Activa el asistente con IA del plan Bibliófilo (aún en construcción)."
                    />
                </div>
            </Card>

            <div className="flex items-center gap-3 sticky bottom-0 bg-background/80 backdrop-blur py-3">
                <button
                    onClick={save}
                    disabled={pending}
                    className="inline-flex items-center gap-2 text-sm font-medium bg-teal text-white py-2 px-5 rounded-md hover:bg-teal-dark transition-colors disabled:opacity-50"
                >
                    {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Guardar cambios
                </button>
                {feedback && (
                    <span
                        className={`inline-flex items-center gap-1.5 text-sm ${
                            feedback.ok ? "text-teal-dark" : "text-coral"
                        }`}
                    >
                        {feedback.ok ? (
                            <CheckCircle2 className="w-4 h-4" />
                        ) : (
                            <AlertTriangle className="w-4 h-4" />
                        )}
                        {feedback.msg}
                    </span>
                )}
            </div>
        </div>
    );
}
