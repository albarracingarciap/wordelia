import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Plus, Calendar, Trophy, Edit, Users, Award } from "lucide-react";
import { DeleteChallengeButton } from "@/components/admin/retos/DeleteChallengeButton";
import { adminListChallenges } from "./nuevo/actions";
import { challengeGoalLabel } from "@/lib/challenges";

export const dynamic = "force-dynamic";

export default async function AdminChallengesPage() {
    const challenges = await adminListChallenges();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Retos</h1>
                    <p className="mt-1 text-muted-foreground">Retos de lectura de la comunidad. El progreso se mide solo desde las lecturas.</p>
                </div>
                <Link href="/app/admin/retos/nuevo">
                    <Button variant="primary" className="flex items-center gap-2"><Plus className="h-4 w-4" /> Crear reto</Button>
                </Link>
            </div>

            {challenges.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-12 text-center">
                    <Trophy className="mx-auto mb-4 h-12 w-12 text-grey/20" />
                    <h3 className="text-lg font-medium">No hay retos todavía</h3>
                    <p className="mb-4 mt-1 text-sm text-grey/60">Crea el primer reto para motivar a la comunidad.</p>
                    <Link href="/app/admin/retos/nuevo"><Button variant="outline">Crear mi primer reto</Button></Link>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {challenges.map((c) => (
                        <div key={c.id} className="flex flex-col rounded-xl border border-border bg-white p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="line-clamp-1 text-lg font-semibold">{c.title}</h3>
                                {c.isPublished
                                    ? <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-teal">Publicado</span>
                                    : <span className="rounded-full bg-grey/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-grey/50">Borrador</span>}
                            </div>
                            <p className="mt-1 text-sm font-medium text-teal-dark">{challengeGoalLabel(c.goalType, c.goalTarget, c.goalGenre)}</p>
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description || "Sin descripción"}</p>

                            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />
                                    {c.startDate ? new Date(c.startDate).toLocaleDateString() : "—"}{" – "}{c.endDate ? new Date(c.endDate).toLocaleDateString() : "—"}
                                </span>
                                <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {c.participants}</span>
                                {c.rewardBadgeId && <span className="inline-flex items-center gap-1 text-coral"><Award className="h-3.5 w-3.5" /> insignia</span>}
                            </div>

                            <div className="mt-4 flex items-center justify-end gap-1 border-t border-border pt-3">
                                <Link href={`/app/admin/retos/${c.id}/editar`} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground" title="Editar reto">
                                    <Edit className="h-4 w-4" />
                                </Link>
                                <DeleteChallengeButton id={c.id} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
