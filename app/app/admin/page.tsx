import { createClient } from "@/utils/supabase/server";
import { Users, Club, BookOpen } from "lucide-react";

export const revalidate = 0; // Don't cache admin stats

export default async function AdminDashboardPage() {
    const supabase = await createClient();

    // Fetch basic stats
    const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

    const { count: clubsCount } = await supabase
        .from("clubs")
        .select("*", { count: "exact", head: true });

    const { count: booksCount } = await supabase
        .from("books")
        .select("*", { count: "exact", head: true });

    const stats = [
        {
            name: "Usuarios Totales",
            value: usersCount || 0,
            icon: Users,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
        },
        {
            name: "Clubes Activos",
            value: clubsCount || 0,
            icon: Club,
            color: "text-amber-500",
            bgColor: "bg-amber-500/10",
        },
        {
            name: "Libros en Catálogo",
            value: booksCount || 0,
            icon: BookOpen,
            color: "text-emerald-500",
            bgColor: "bg-emerald-500/10",
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Bienvenido al panel de administración de Wordelia.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.name}
                            className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-2"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                                    <Icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {stat.name}
                                    </p>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions placeholder */}
            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
                <div className="rounded-xl border border-border bg-card p-6 flex flex-col items-center justify-center text-center h-48 border-dashed">
                    <p className="text-muted-foreground text-sm">Próximamente: Atajos a tareas comunes</p>
                </div>
            </div>
        </div>
    );
}
