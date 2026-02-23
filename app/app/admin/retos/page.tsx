import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Plus, Calendar, Trophy, Edit } from "lucide-react";
import { DeleteChallengeButton } from "@/components/admin/retos/DeleteChallengeButton";

export const revalidate = 0;

export default async function AdminChallengesPage() {
    const supabase = await createClient();

    const { data: challenges, error } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Retos</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona los retos de lectura de la comunidad.
                    </p>
                </div>
                <Link href="/app/admin/retos/nuevo">
                    <Button variant="primary" className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Crear Reto
                    </Button>
                </Link>
            </div>

            {error ? (
                <div className="p-4 rounded-xl bg-coral/10 text-coral">
                    Error cargando retos: {error.message}
                </div>
            ) : !challenges || challenges.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-xl">
                    <Trophy className="w-12 h-12 text-grey/20 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No hay retos todavía</h3>
                    <p className="text-sm text-grey/60 mt-1 mb-4">
                        Crea el primer reto para motivar a la comunidad.
                    </p>
                    <Link href="/app/admin/retos/nuevo">
                        <Button variant="outline">Crear mi primer reto</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {challenges.map((challenge) => (
                        <div key={challenge.id} className="rounded-xl border border-border bg-white p-5 shadow-sm flex flex-col">
                            <h3 className="font-semibold text-lg line-clamp-1">{challenge.title}</h3>
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {challenge.description || "Sin descripción"}
                            </p>

                            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground mt-auto">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>
                                        {challenge.start_date ? new Date(challenge.start_date).toLocaleDateString() : 'Sin inicio'}
                                        {' - '}
                                        {challenge.end_date ? new Date(challenge.end_date).toLocaleDateString() : 'Sin fin'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Link href={`/app/admin/retos/${challenge.id}/editar`} className="p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors" title="Editar reto">
                                        <Edit className="w-4 h-4" />
                                    </Link>
                                    <DeleteChallengeButton id={challenge.id} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
