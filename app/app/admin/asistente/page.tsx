import { Sparkles, Coins, Activity, AlertTriangle } from "lucide-react";
import { getAiUsageSummary } from "./actions";

export const revalidate = 0;

const FEATURE_LABELS: Record<string, string> = {
    next_read: "Tu próxima lectura",
    stats_narrative: "Estadísticas en palabras",
    club_emotions: "Mapa emocional (club)",
    club_session: "Preparar sesión (club)",
};

function fmtUsd(v: number): string {
    return `$${v.toFixed(4)}`;
}

export default async function AdminAssistantPage() {
    const s = await getAiUsageSummary();
    const maxDayCost = Math.max(0.0001, ...s.byDay.map((d) => d.costUsd));

    const cards = [
        { name: "Acciones este mes", value: String(s.monthActions), icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10" },
        { name: "Coste estimado (mes)", value: fmtUsd(s.monthCostUsd), icon: Coins, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { name: "Tokens (in / out)", value: `${s.monthInputTokens.toLocaleString("es-ES")} / ${s.monthOutputTokens.toLocaleString("es-ES")}`, icon: Sparkles, color: "text-purple-500", bg: "bg-purple-500/10" },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Asistente IA · Consumo</h1>
                <p className="text-muted-foreground">Uso y coste estimado de las funciones de IA (Mistral). Coste = tokens × tarifa de lista.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {cards.map((c) => {
                    const Icon = c.icon;
                    return (
                        <div key={c.name} className="rounded-xl border border-border bg-card p-6">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${c.bg}`}><Icon className={`w-6 h-6 ${c.color}`} /></div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-muted-foreground">{c.name}</p>
                                    <p className="text-2xl font-bold truncate">{c.value}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Por función */}
                <div className="rounded-xl border border-border bg-card p-6">
                    <h2 className="text-lg font-semibold mb-4">Por función (este mes)</h2>
                    {s.byFeature.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Sin uso este mes.</p>
                    ) : (
                        <div className="space-y-3">
                            {s.byFeature.map((f) => (
                                <div key={f.feature} className="flex items-center justify-between gap-3 text-sm">
                                    <span className="font-medium">{FEATURE_LABELS[f.feature] || f.feature}</span>
                                    <span className="text-muted-foreground">{f.actions} acciones · {fmtUsd(f.costUsd)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top usuarios */}
                <div className="rounded-xl border border-border bg-card p-6">
                    <h2 className="text-lg font-semibold mb-4">Usuarios con más uso (este mes)</h2>
                    {s.topUsers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Sin uso este mes.</p>
                    ) : (
                        <div className="space-y-2">
                            {s.topUsers.map((u) => {
                                const near = u.actions >= s.cap * 0.8;
                                return (
                                    <div key={u.userId} className="flex items-center justify-between gap-3 text-sm">
                                        <span className="truncate font-medium">{u.name}</span>
                                        <span className="flex items-center gap-2 text-muted-foreground">
                                            {near && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                                            {u.actions}/{s.cap} · {fmtUsd(u.costUsd)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <p className="mt-3 text-xs text-muted-foreground">Cap mensual por usuario: {s.cap} acciones (admin sin límite). ⚠ = ≥80% del cap.</p>
                </div>
            </div>

            {/* Por día */}
            <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold mb-4">Coste diario (últimos 30 días)</h2>
                {s.byDay.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin datos.</p>
                ) : (
                    <div className="space-y-1.5">
                        {s.byDay.map((d) => (
                            <div key={d.day} className="flex items-center gap-3 text-xs">
                                <span className="w-20 shrink-0 text-muted-foreground">{d.day.slice(5)}</span>
                                <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                                    <div className="h-full bg-emerald-500/70" style={{ width: `${Math.round((d.costUsd / maxDayCost) * 100)}%` }} />
                                </div>
                                <span className="w-28 shrink-0 text-right text-muted-foreground">{d.actions} · {fmtUsd(d.costUsd)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
