import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Plus, Users, Search, Book } from "lucide-react";
import Image from "next/image";

export const revalidate = 0; // Don't cache admin lists

export default async function AdminClubsPage() {
    const supabase = await createClient();

    const { data: clubs, error } = await supabase
        .from('clubs')
        .select(`
            *,
            current_book: club_books(
                *,
                book: books(title, author: authors(name), preferred_edition:editions!books_preferred_edition_fk(cover_url))
            )
        `)
        .eq('is_official', true)
        .order('created_at', { ascending: false });

    // Ensure member count is fetched correctly for each club
    let enrichedClubs = [];
    if (clubs) {
        enrichedClubs = await Promise.all(clubs.map(async (club) => {
            const { count } = await supabase
                .from('club_members')
                .select('*', { count: 'exact', head: true })
                .eq('club_id', club.id);

            const activeBook = Array.isArray(club.current_book)
                ? club.current_book.find((b: any) => b.status === 'current')
                : null;

            return {
                ...club,
                memberCount: count || 0,
                activeBook: activeBook?.book || null
            };
        }));
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Clubes de Lectura</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona los clubes de la plataforma y crea nuevos Wordelia Originals.
                    </p>
                </div>
                <Link href="/app/admin/clubes/nuevo">
                    <Button variant="primary" className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Crear Club
                    </Button>
                </Link>
            </div>

            {error ? (
                <div className="p-4 rounded-xl bg-coral/10 text-coral">
                    Error cargando clubes: {error.message}
                </div>
            ) : !enrichedClubs || enrichedClubs.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-xl">
                    <Users className="w-12 h-12 text-grey/20 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No hay clubes todavía</h3>
                    <p className="text-sm text-grey/60 mt-1 mb-4">
                        Crea el primer club Wordelia Original para la comunidad.
                    </p>
                    <Link href="/app/admin/clubes/nuevo">
                        <Button variant="outline">Crear primer club</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {enrichedClubs.map((club) => (
                        <div key={club.id} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col relative group hover:border-teal/50 transition-colors">
                            {club.is_official && (
                                <div className="absolute top-2 right-2 z-10 bg-teal text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm">
                                    Original
                                </div>
                            )}

                            <div className="h-24 bg-accent relative flex items-center justify-center">
                                {club.cover_url ? (
                                    <Image src={club.cover_url} alt={club.name} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                    <Book className="w-8 h-8 opacity-20" />
                                )}
                            </div>

                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="font-semibold text-lg line-clamp-1">{club.name}</h3>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {club.description || "Sin descripción"}
                                </p>

                                <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2 mt-auto">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1.5 font-medium">
                                            <Users className="w-3.5 h-3.5" />
                                            <span>{club.memberCount} miembros</span>
                                        </div>
                                        <span className="capitalize">{club.visibility}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                                        <span>Última act.</span>
                                        <span>{new Date(club.updated_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
