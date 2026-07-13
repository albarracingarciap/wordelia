"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, BookOpen, ExternalLink, Plus, Sparkles, Store, Users } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createOrganization } from "./actions";
import type { Organization } from "@/types/organizations";

const sectionTitle = "text-xs font-bold uppercase tracking-widest text-grey/40";

export function LibreriasDashboardClient({
    organization,
    clubs,
}: {
    organization: Organization | null;
    clubs: any[];
}) {
    if (!organization) return <RegisterForm />;
    return <Dashboard organization={organization} clubs={clubs} />;
}

function RegisterForm() {
    const router = useRouter();
    const [form, setForm] = React.useState({ name: "", city: "", website: "", description: "" });
    const [error, setError] = React.useState("");
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!form.name.trim()) {
            setError("El nombre de la librería es obligatorio.");
            return;
        }
        setIsSubmitting(true);
        try {
            const result = await createOrganization(form);
            if (result?.error) {
                setError(result.error);
                return;
            }
            router.refresh();
        } catch {
            setError("No hemos podido registrar la librería. Inténtalo de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-2xl">
            <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal/10 text-teal">
                    <Store className="h-7 w-7" aria-hidden="true" />
                </div>
                <h1 className="font-serif text-3xl text-teal">Registra tu librería</h1>
                <p className="mx-auto mt-3 max-w-md text-grey/80">
                    Crea el espacio de tu librería en Wordelia para organizar clubs de lectura. Empiezas en el plan
                    <span className="font-semibold text-teal-dark"> Gratis</span> (1 club).
                </p>
            </div>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="flex items-start gap-3 rounded-2xl border border-coral/20 bg-coral/10 px-4 py-3 text-sm font-medium text-coral">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}
                    <Input label="Nombre de la librería" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Librería…" autoFocus />
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Input label="Ciudad" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Madrid" />
                        <Input label="Web (opcional)" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://…" />
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-grey/60">Descripción (opcional)</label>
                        <textarea
                            rows={3}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Cuéntale a los lectores qué hace especial a tu librería…"
                            className="w-full resize-none rounded-2xl border border-teal/10 bg-cream/30 px-4 py-3 text-sm text-teal-dark placeholder:text-grey/30 focus:border-teal/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/5"
                        />
                    </div>
                    <div className="flex justify-end pt-1">
                        <Button type="submit" className="h-11 px-8" isLoading={isSubmitting}>Registrar librería</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}

function Dashboard({ organization, clubs }: { organization: Organization; clubs: any[] }) {
    const tier = organization.subscription?.tier ?? "free";
    const isPro = tier === "pro";
    const atFreeLimit = !isPro && clubs.length >= 1;

    return (
        <div className="space-y-8">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral">Tu librería</p>
                    <h1 className="mt-1 font-serif text-3xl text-teal">{organization.name}</h1>
                    <div className="mt-2 flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${isPro ? "bg-teal text-white" : "bg-teal/10 text-teal"}`}>
                            {isPro && <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}
                            Plan {isPro ? "Pro" : "Gratis"}
                        </span>
                        <Link href={`/librerias/${organization.slug}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal hover:text-coral">
                            Ver ficha pública <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                    </div>
                </div>
                {atFreeLimit ? (
                    <span className="text-sm text-grey/60">Límite del plan Gratis alcanzado (1 club).</span>
                ) : (
                    <Link
                        href={`/app/clubs/crear?org=${organization.id}`}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-coral px-6 font-semibold text-white transition-colors hover:bg-[#C25852]"
                    >
                        <Plus className="h-4 w-4" aria-hidden="true" /> Crear club
                    </Link>
                )}
            </header>

            {!isPro && (
                <Card className="border-teal/15 bg-teal/[0.03]">
                    <div className="flex items-start gap-3">
                        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-coral" aria-hidden="true" />
                        <div>
                            <p className="font-bold text-teal-dark">Sube a Librería Pro</p>
                            <p className="mt-1 text-sm text-grey">
                                Clubs ilimitados, y tus socios se llevan la <span className="font-semibold">guía y el genoma</span> de cada
                                libro <span className="font-semibold">para siempre</span>. Escríbenos a hola@wordelia.es para activarlo.
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            <section>
                <h2 className={`${sectionTitle} mb-4`}>Sus clubs</h2>
                {clubs.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {clubs.map((club) => (
                            <Link
                                key={club.id}
                                href={`/app/clubs/${club.id}`}
                                className="group flex gap-4 rounded-2xl border border-teal/10 bg-white p-4 shadow-sm transition-all hover:border-teal/25 hover:shadow-md"
                            >
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-teal/5 text-teal/40">
                                    <BookOpen className="h-6 w-6" aria-hidden="true" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="truncate font-serif text-lg text-teal group-hover:text-coral">{club.name}</h3>
                                    {club.currentBook && <p className="mt-0.5 truncate text-sm text-grey">Leyendo: {club.currentBook.title}</p>}
                                    <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-grey/60">
                                        <Users className="h-3.5 w-3.5" aria-hidden="true" /> {club.memberCount} {club.memberCount === 1 ? "miembro" : "miembros"}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <Card className="border-dashed border-teal/15 bg-white/50">
                        <div className="py-8 text-center">
                            <p className="text-grey/70">Aún no has creado ningún club.</p>
                            <Link href={`/app/clubs/crear?org=${organization.id}`} className="mt-3 inline-flex text-sm font-semibold text-teal hover:text-coral">
                                Crear tu primer club
                            </Link>
                        </div>
                    </Card>
                )}
            </section>
        </div>
    );
}
