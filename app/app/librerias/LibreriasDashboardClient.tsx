"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, BarChart3, BookOpen, Building2, CalendarClock, CalendarPlus, Check, Clock, ExternalLink, Gift, Globe, ImagePlus, MapPin, MessageSquare, Palette, Pencil, Plus, Sparkles, Store, Trash2, UserPlus, Users } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { BuyLinkTemplateField } from "@/components/librerias/BuyLinkTemplateField";
import { RecommendationsSection } from "@/components/librerias/RecommendationsSection";
import { createClient } from "@/utils/supabase/client";
import { createOrganization, updateOrganization, deleteOrganization, createOrganizationEvent, updateOrganizationEvent, deleteOrganizationEvent, createLocation, updateLocation, deleteLocation, type OrganizationAnalytics, type OrganizationMember } from "./actions";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { FREE_LOCATION_LIMIT, FREE_UPCOMING_EVENT_LIMIT } from "@/lib/org-limits";
import { inviteMemberByUsername } from "@/app/app/clubs/[id]/actions";
import { PayPalSubscriptionProvider, PayPalSubscribeButton } from "@/components/payments/PayPalSubscribe";
import OrgSubscriptionManage from "@/components/payments/OrgSubscriptionManage";
import { getPrice, formatAmount } from "@/lib/pricing";
import { isOrgProActive } from "@/lib/subscription-access";
import type { Organization, OrganizationEvent, OrganizationEventFormat, OrganizationEventType, OrganizationLocation } from "@/types/organizations";

function orgPriceLabel(period: "monthly" | "annual") {
    const price = getPrice({ productType: "org_subscription", referenceId: "", period });
    return price ? formatAmount(price.amount_cents) : "";
}

// Equivalente mensual del plan anual (para mostrar "X €/mes" en la opción anual).
function orgAnnualPerMonthLabel() {
    const price = getPrice({ productType: "org_subscription", referenceId: "", period: "annual" });
    return price ? formatAmount(Math.round(price.amount_cents / 12)) : "";
}

const EVENT_TYPE_LABELS: Record<OrganizationEventType, string> = {
    presentacion: "Presentación",
    firma: "Firma",
    encuentro: "Encuentro",
    taller: "Taller",
    otro: "Otro",
};
const EVENT_FORMAT_LABELS: Record<OrganizationEventFormat, string> = {
    presencial: "Presencial",
    online: "Online",
    mixto: "Mixto",
};
function formatEventDateTime(iso: string) {
    return new Date(iso).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
// A timestamptz ISO string -> value for <input type="datetime-local"> (local time).
function toDatetimeLocal(iso: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const numberFmt = new Intl.NumberFormat("es-ES");
function formatEventDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

const sectionTitle = "text-xs font-bold uppercase tracking-widest text-grey/40";

export function LibreriasDashboardClient({
    organizations,
    organization,
    clubs,
    analytics,
    events,
    members,
    locations,
    currentUserId,
}: {
    organizations: Organization[];
    organization: Organization | null;
    clubs: any[];
    analytics: OrganizationAnalytics | null;
    events: OrganizationEvent[];
    members: OrganizationMember[];
    locations: OrganizationLocation[];
    currentUserId: string | null;
}) {
    if (!organization) return <div className="mx-auto max-w-2xl"><RegisterHeader /><Card><RegisterForm /></Card></div>;
    return (
        <Dashboard
            organizations={organizations}
            organization={organization}
            clubs={clubs}
            analytics={analytics}
            events={events}
            members={members}
            locations={locations}
            currentUserId={currentUserId}
        />
    );
}

function RegisterHeader() {
    return (
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
    );
}

function RegisterForm({ onCreated }: { onCreated?: (orgId: string) => void } = {}) {
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
            if (onCreated && result?.organizationId) onCreated(result.organizationId);
            else router.refresh();
        } catch {
            setError("No hemos podido registrar la librería. Inténtalo de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
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
    );
}

function Dashboard({ organizations, organization, clubs, analytics, events, members, locations, currentUserId }: { organizations: Organization[]; organization: Organization; clubs: any[]; analytics: OrganizationAnalytics | null; events: OrganizationEvent[]; members: OrganizationMember[]; locations: OrganizationLocation[]; currentUserId: string | null }) {
    const router = useRouter();
    // Pro requires an active (or within-grace) paid subscription, not just tier.
    const isPro = isOrgProActive(organization.subscription);
    const atFreeLimit = !isPro && clubs.length >= 1;
    const [isEditOpen, setIsEditOpen] = React.useState(false);
    const [isNewOrgOpen, setIsNewOrgOpen] = React.useState(false);

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-3">
                {organizations.length > 1 && (
                    <Select
                        options={organizations.map((o) => ({ value: o.id, label: o.name }))}
                        value={organization.id}
                        onChange={(e) => router.push(`/app/librerias?org=${e.target.value}`)}
                        className="h-10 w-auto min-w-[12rem] rounded-xl px-4"
                    />
                )}
                <button onClick={() => setIsNewOrgOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal transition-colors hover:text-coral">
                    <Plus className="h-4 w-4" aria-hidden="true" /> Nueva librería
                </button>
            </div>

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
                        <button onClick={() => setIsEditOpen(true)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-grey/60 transition-colors hover:text-teal">
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Editar perfil
                        </button>
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
                        <div className="min-w-0 flex-1">
                            <p className="font-bold text-teal-dark">Sube a Librería Pro</p>
                            <ul className="mt-2 space-y-1.5">
                                <li className="flex items-start gap-2 text-sm text-grey">
                                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden="true" /> Clubs ilimitados
                                </li>
                                <li className="flex items-start gap-2 text-sm text-grey">
                                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
                                    <span>Tus socios se llevan la <span className="font-semibold">guía y el genoma</span> de cada libro <span className="font-semibold">para siempre</span></span>
                                </li>
                                <li className="flex items-start gap-2 text-sm text-grey">
                                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden="true" /> Multisede (varias sedes)
                                </li>
                                <li className="flex items-start gap-2 text-sm text-grey">
                                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden="true" /> Analíticas avanzadas
                                </li>
                                <li className="flex items-start gap-2 text-sm text-grey">
                                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden="true" /> Eventos ilimitados
                                </li>
                            </ul>
                            <p className="mt-2 text-xs text-grey/60">Renovación automática. Cancela cuando quieras.</p>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <PayPalSubscriptionProvider>
                                    <div className="rounded-xl border border-teal/10 bg-white p-3">
                                        <div className="mb-1 flex items-center gap-2">
                                            <p className="text-sm font-bold text-teal-dark">Anual</p>
                                            <span className="rounded-full bg-coral/10 px-2 py-0.5 text-[10px] font-bold text-coral">2 meses gratis</span>
                                        </div>
                                        <p className="mb-2 text-xs text-grey/70">{orgPriceLabel("annual")} · {orgAnnualPerMonthLabel()}/mes</p>
                                        <PayPalSubscribeButton productType="org_subscription" referenceId={organization.id} period="annual" onSuccess={() => router.refresh()} />
                                    </div>
                                    <div className="rounded-xl border border-teal/10 bg-white p-3">
                                        <p className="mb-1 text-sm font-bold text-teal-dark">Mensual</p>
                                        <p className="mb-2 text-xs text-grey/70">{orgPriceLabel("monthly")}/mes</p>
                                        <PayPalSubscribeButton productType="org_subscription" referenceId={organization.id} period="monthly" onSuccess={() => router.refresh()} />
                                    </div>
                                </PayPalSubscriptionProvider>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {isPro && organization.subscription?.provider_subscription_id && (
                <Card className="border-teal/15">
                    <p className="font-bold text-teal-dark">Gestiona tu plan Pro</p>
                    <div className="mt-3">
                        <OrgSubscriptionManage
                            organizationId={organization.id}
                            subscriptionId={organization.subscription.provider_subscription_id}
                            status={organization.subscription.status}
                            billingPeriod={organization.subscription.billing_period}
                            currentPeriodEnd={organization.subscription.current_period_end}
                        />
                    </div>
                </Card>
            )}

            {isPro
                ? (analytics && <AnalyticsSection analytics={analytics} />)
                : <AnalyticsUpsell />}

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

            <MembersSection members={members} clubs={clubs} />

            <RecommendationsSection orgId={organization.id} />

            <LocationsSection orgId={organization.id} locations={locations} isPro={isPro} />

            <EventsSection orgId={organization.id} events={events} locations={locations} isPro={isPro} />

            <EditProfileModal
                organization={organization}
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                isOwner={!!currentUserId && organization.owner_id === currentUserId}
            />

            <Modal isOpen={isNewOrgOpen} onClose={() => setIsNewOrgOpen(false)} title="Nueva librería">
                <RegisterForm onCreated={(id) => { setIsNewOrgOpen(false); router.push(`/app/librerias?org=${id}`); }} />
            </Modal>
        </div>
    );
}

function LocationsSection({ orgId, locations, isPro }: { orgId: string; locations: OrganizationLocation[]; isPro: boolean }) {
    const router = useRouter();
    const [editing, setEditing] = React.useState<OrganizationLocation | null>(null);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [pendingDelete, setPendingDelete] = React.useState<string | null>(null);

    const atLimit = !isPro && locations.length >= FREE_LOCATION_LIMIT;

    const openNew = () => { setEditing(null); setIsModalOpen(true); };
    const openEdit = (loc: OrganizationLocation) => { setEditing(loc); setIsModalOpen(true); };
    const handleDelete = async (id: string) => { await deleteLocation(id); setPendingDelete(null); router.refresh(); };

    return (
        <section>
            <div className="mb-4 flex items-center justify-between">
                <h2 className={`${sectionTitle} flex items-center gap-2`}>
                    <Building2 className="h-4 w-4" aria-hidden="true" /> Sedes
                </h2>
                {atLimit ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-grey/50">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Multisede en Pro
                    </span>
                ) : (
                    <button onClick={openNew} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal hover:text-coral">
                        <Plus className="h-4 w-4" aria-hidden="true" /> Añadir sede
                    </button>
                )}
            </div>

            {locations.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                    {locations.map((loc) => (
                        <Card key={loc.id} className="bg-white">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-semibold text-teal-dark">{loc.name}</h3>
                                        {loc.is_primary && <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-bold text-teal">Principal</span>}
                                    </div>
                                    {(loc.address || loc.city) && (
                                        <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-grey/70">
                                            <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {[loc.address, loc.city, loc.region].filter(Boolean).join(", ")}
                                        </p>
                                    )}
                                    {loc.phone && <p className="mt-1 text-xs text-grey/60">{loc.phone}</p>}
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                    <button onClick={() => openEdit(loc)} className="rounded-lg p-2 text-grey/50 hover:bg-teal/5 hover:text-teal" title="Editar"><Pencil className="h-4 w-4" aria-hidden="true" /></button>
                                    <button onClick={() => setPendingDelete(loc.id)} className="rounded-lg p-2 text-grey/40 hover:bg-red-50 hover:text-red-500" title="Eliminar"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                                </div>
                            </div>
                            {pendingDelete === loc.id && (
                                <div className="mt-3 flex items-center justify-end gap-2 border-t border-teal/5 pt-3 text-sm">
                                    <span className="mr-auto text-grey-dark">¿Eliminar esta sede?</span>
                                    <Button variant="ghost" size="sm" onClick={() => setPendingDelete(null)}>Cancelar</Button>
                                    <Button size="sm" className="bg-coral text-white hover:bg-[#C25852]" onClick={() => handleDelete(loc.id)}>Eliminar</Button>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="border-dashed border-teal/15 bg-white/50">
                    <div className="py-8 text-center">
                        <p className="text-grey/70">Aún no has añadido sedes.</p>
                        <button onClick={openNew} className="mt-3 inline-flex text-sm font-semibold text-teal hover:text-coral">Añadir tu primera sede</button>
                    </div>
                </Card>
            )}

            <LocationModal orgId={orgId} location={editing} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </section>
    );
}

function LocationModal({ orgId, location, isOpen, onClose }: { orgId: string; location: OrganizationLocation | null; isOpen: boolean; onClose: () => void }) {
    const router = useRouter();
    const [form, setForm] = React.useState<Record<string, any>>({});
    const [error, setError] = React.useState("");
    const [isSaving, setIsSaving] = React.useState(false);

    React.useEffect(() => {
        if (!isOpen) return;
        setForm({
            name: location?.name ?? "",
            address: location?.address ?? "",
            city: location?.city ?? "",
            region: location?.region ?? "",
            phone: location?.phone ?? "",
            is_primary: location?.is_primary ?? false,
        });
        setError("");
    }, [isOpen, location]);

    const handleSave = async () => {
        setError("");
        if (!form.name?.trim()) { setError("El nombre de la sede es obligatorio."); return; }
        setIsSaving(true);
        try {
            const result = location ? await updateLocation(location.id, form) : await createLocation(orgId, form);
            if (result?.error) { setError(result.error); return; }
            onClose();
            router.refresh();
        } catch {
            setError("No hemos podido guardar la sede. Inténtalo de nuevo.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={location ? "Editar sede" : "Nueva sede"} size="sm">
            <div className="space-y-4">
                {error && (
                    <div className="flex items-start gap-3 rounded-2xl border border-coral/20 bg-coral/10 px-4 py-3 text-sm font-medium text-coral">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}
                <Input label="Nombre de la sede" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sede centro" />
                <Input label="Dirección" value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Calle…" />
                <div className="grid gap-3 sm:grid-cols-2">
                    <Input label="Ciudad" value={form.city ?? ""} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                    <Input label="Región" value={form.region ?? ""} onChange={(e) => setForm({ ...form, region: e.target.value })} />
                </div>
                <Input label="Teléfono" value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <label className="flex items-center gap-2 text-sm text-grey-dark">
                    <input type="checkbox" checked={!!form.is_primary} onChange={(e) => setForm({ ...form, is_primary: e.target.checked })} className="h-4 w-4 accent-teal" />
                    Sede principal
                </label>
                <div className="flex justify-end gap-3 pt-1">
                    <Button type="button" variant="ghost" onClick={onClose} className="h-11 px-6" disabled={isSaving}>Cancelar</Button>
                    <Button type="button" onClick={handleSave} className="h-11 px-8" isLoading={isSaving}>{location ? "Guardar" : "Crear sede"}</Button>
                </div>
            </div>
        </Modal>
    );
}

function MembersSection({ members, clubs }: { members: OrganizationMember[]; clubs: any[] }) {
    const router = useRouter();
    const [selectedClubId, setSelectedClubId] = React.useState<string>(clubs[0]?.id ?? "");
    const [username, setUsername] = React.useState("");
    const [isInviting, setIsInviting] = React.useState(false);
    const [feedback, setFeedback] = React.useState<{ type: "error" | "success"; text: string } | null>(null);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);
        if (!selectedClubId) { setFeedback({ type: "error", text: "Selecciona un club." }); return; }
        if (!username.trim()) { setFeedback({ type: "error", text: "Escribe el usuario a invitar." }); return; }
        setIsInviting(true);
        try {
            const result = await inviteMemberByUsername(selectedClubId, username.trim());
            if (result?.error) {
                setFeedback({ type: "error", text: result.error });
                return;
            }
            setFeedback({ type: "success", text: "Lector añadido al club." });
            setUsername("");
            router.refresh();
        } catch {
            setFeedback({ type: "error", text: "No se pudo invitar. Inténtalo de nuevo." });
        } finally {
            setIsInviting(false);
        }
    };

    return (
        <section>
            <h2 className={`${sectionTitle} mb-4 flex items-center gap-2`}>
                <Users className="h-4 w-4" aria-hidden="true" /> Socios ({members.length})
            </h2>

            {clubs.length > 0 ? (
                <Card className="mb-4 bg-white">
                    <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="sm:w-48">
                            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-grey/60">Invitar al club</label>
                            <Select
                                options={clubs.map((c) => ({ value: c.id, label: c.name }))}
                                value={selectedClubId}
                                onChange={(e) => setSelectedClubId(e.target.value)}
                                className="h-11 w-full rounded-2xl px-4"
                            />
                        </div>
                        <div className="flex-1">
                            <Input label="Usuario" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="nombre de usuario" fullWidth />
                        </div>
                        <Button type="submit" className="h-11 shrink-0 px-6" isLoading={isInviting}>
                            <UserPlus className="mr-1.5 h-4 w-4" aria-hidden="true" /> Invitar
                        </Button>
                    </form>
                    {feedback && (
                        <p className={`mt-2 text-sm ${feedback.type === "error" ? "text-coral" : "text-teal"}`}>{feedback.text}</p>
                    )}
                </Card>
            ) : (
                <Card className="mb-4 border-dashed border-teal/15 bg-white/50">
                    <p className="py-2 text-center text-sm text-grey/60">Crea un club primero para poder invitar lectores.</p>
                </Card>
            )}

            {members.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                    {members.map((m) => (
                        <div key={m.userId} className="flex items-center gap-3 rounded-2xl border border-teal/10 bg-white p-3 shadow-sm">
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-teal/10">
                                {m.avatarUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={m.avatarUrl} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    <span className="flex h-full w-full items-center justify-center text-sm font-bold text-teal">{m.name.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-teal-dark">{m.name}</p>
                                <div className="mt-0.5 flex flex-wrap gap-1">
                                    {m.clubs.map((c) => (
                                        <span key={c.id} className="rounded-full bg-teal/5 px-2 py-0.5 text-[10px] font-semibold text-teal">{c.name}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <Card className="border-dashed border-teal/15 bg-white/50">
                    <p className="py-6 text-center text-sm text-grey/60">Todavía no hay socios en tus clubs.</p>
                </Card>
            )}
        </section>
    );
}

function EventsSection({ orgId, events, locations, isPro }: { orgId: string; events: OrganizationEvent[]; locations: OrganizationLocation[]; isPro: boolean }) {
    const router = useRouter();
    const [editing, setEditing] = React.useState<OrganizationEvent | null>(null);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [pendingDelete, setPendingDelete] = React.useState<string | null>(null);
    const locationById = React.useMemo(() => new Map(locations.map((l) => [l.id, l])), [locations]);

    const upcomingCount = events.filter((e) => new Date(e.starts_at) >= new Date()).length;
    const atLimit = !isPro && upcomingCount >= FREE_UPCOMING_EVENT_LIMIT;

    const openNew = () => { setEditing(null); setIsModalOpen(true); };
    const openEdit = (event: OrganizationEvent) => { setEditing(event); setIsModalOpen(true); };

    const handleDelete = async (id: string) => {
        await deleteOrganizationEvent(id);
        setPendingDelete(null);
        router.refresh();
    };

    return (
        <section>
            <div className="mb-4 flex items-center justify-between">
                <h2 className={`${sectionTitle} flex items-center gap-2`}>
                    <CalendarClock className="h-4 w-4" aria-hidden="true" /> Agenda de la tienda
                </h2>
                {atLimit ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-grey/50">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Eventos ilimitados en Pro
                    </span>
                ) : (
                    <button onClick={openNew} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal hover:text-coral">
                        <CalendarPlus className="h-4 w-4" aria-hidden="true" /> Añadir evento
                    </button>
                )}
            </div>

            {events.length > 0 ? (
                <div className="space-y-3">
                    {events.map((ev) => (
                        <Card key={ev.id} className="bg-white">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-bold text-teal">{EVENT_TYPE_LABELS[ev.event_type]}</span>
                                        <h3 className="font-serif text-lg text-teal">{ev.title}</h3>
                                    </div>
                                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-grey/70">
                                        <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" aria-hidden="true" /> {formatEventDateTime(ev.starts_at)}</span>
                                        <span className="inline-flex items-center gap-1.5">
                                            {ev.format === "online" ? <Globe className="h-3.5 w-3.5" aria-hidden="true" /> : <MapPin className="h-3.5 w-3.5" aria-hidden="true" />}
                                            {EVENT_FORMAT_LABELS[ev.format]}{(() => { const v = (ev.location_id && locationById.get(ev.location_id)?.name) || ev.location; return v ? ` · ${v}` : ""; })()}
                                        </span>
                                    </div>
                                    {ev.description && <p className="mt-2 line-clamp-2 text-sm text-grey">{ev.description}</p>}
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                    <button onClick={() => openEdit(ev)} className="rounded-lg p-2 text-grey/50 transition-colors hover:bg-teal/5 hover:text-teal" title="Editar">
                                        <Pencil className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                    <button onClick={() => setPendingDelete(ev.id)} className="rounded-lg p-2 text-grey/40 transition-colors hover:bg-red-50 hover:text-red-500" title="Eliminar">
                                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                            {pendingDelete === ev.id && (
                                <div className="mt-3 flex items-center justify-end gap-2 border-t border-teal/5 pt-3 text-sm">
                                    <span className="mr-auto text-grey-dark">¿Eliminar este evento?</span>
                                    <Button variant="ghost" size="sm" onClick={() => setPendingDelete(null)}>Cancelar</Button>
                                    <Button size="sm" className="bg-coral text-white hover:bg-[#C25852]" onClick={() => handleDelete(ev.id)}>Eliminar</Button>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="border-dashed border-teal/15 bg-white/50">
                    <div className="py-8 text-center">
                        <p className="text-grey/70">Aún no has publicado eventos.</p>
                        <button onClick={openNew} className="mt-3 inline-flex text-sm font-semibold text-teal hover:text-coral">Añadir tu primer evento</button>
                    </div>
                </Card>
            )}

            <EventModal orgId={orgId} event={editing} locations={locations} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </section>
    );
}

const EVENT_TYPE_OPTIONS = (Object.keys(EVENT_TYPE_LABELS) as OrganizationEventType[]).map((v) => ({ value: v, label: EVENT_TYPE_LABELS[v] }));
const EVENT_FORMAT_OPTIONS = (Object.keys(EVENT_FORMAT_LABELS) as OrganizationEventFormat[]).map((v) => ({ value: v, label: EVENT_FORMAT_LABELS[v] }));

function EventModal({ orgId, event, locations, isOpen, onClose }: { orgId: string; event: OrganizationEvent | null; locations: OrganizationLocation[]; isOpen: boolean; onClose: () => void }) {
    const router = useRouter();
    const [form, setForm] = React.useState<Record<string, string>>({});
    const [error, setError] = React.useState("");
    const [isSaving, setIsSaving] = React.useState(false);

    React.useEffect(() => {
        if (!isOpen) return;
        setForm({
            title: event?.title ?? "",
            event_type: event?.event_type ?? "presentacion",
            starts_at: toDatetimeLocal(event?.starts_at ?? null),
            format: event?.format ?? "presencial",
            location: event?.location ?? "",
            location_id: event?.location_id ?? "",
            url: event?.url ?? "",
            description: event?.description ?? "",
        });
        setError("");
    }, [isOpen, event]);

    const handleSave = async () => {
        setError("");
        if (!form.title?.trim()) { setError("El título es obligatorio."); return; }
        if (!form.starts_at) { setError("La fecha del evento es obligatoria."); return; }

        const payload = {
            ...form,
            // datetime-local (local) -> ISO timestamptz
            starts_at: new Date(form.starts_at).toISOString(),
            // Keep only the field relevant to the format (avoids saving a stale
            // location on an online event, or a stale link on a presential one).
            location: form.format === "online" ? "" : (form.location ?? ""),
            location_id: form.format === "online" ? "" : (form.location_id ?? ""),
            url: form.format === "online" ? (form.url ?? "") : "",
        };

        setIsSaving(true);
        try {
            const result = event
                ? await updateOrganizationEvent(event.id, payload)
                : await createOrganizationEvent(orgId, payload);
            if (result?.error) { setError(result.error); return; }
            onClose();
            router.refresh();
        } catch {
            setError("No hemos podido guardar el evento. Inténtalo de nuevo.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={event ? "Editar evento" : "Nuevo evento"} size="sm">
            <div className="space-y-4">
                {error && (
                    <div className="flex items-start gap-3 rounded-2xl border border-coral/20 bg-coral/10 px-4 py-3 text-sm font-medium text-coral">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}
                <Input label="Título" value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Presentación de…" />
                <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-grey/60">Tipo</label>
                        <Select options={EVENT_TYPE_OPTIONS} value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} className="h-11 w-full rounded-2xl px-4" />
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-grey/60">Formato</label>
                        <Select options={EVENT_FORMAT_OPTIONS} value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })} className="h-11 w-full rounded-2xl px-4" />
                    </div>
                </div>
                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-grey/60">Fecha y hora</label>
                    <input
                        type="datetime-local"
                        value={form.starts_at ?? ""}
                        onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                        className="w-full rounded-2xl border border-teal/10 bg-cream/30 px-4 py-3 text-sm text-teal-dark focus:border-teal/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/5"
                    />
                </div>
                <Input label={form.format === "online" ? "Enlace (online)" : "Lugar"} value={form.format === "online" ? (form.url ?? "") : (form.location ?? "")} onChange={(e) => setForm({ ...form, [form.format === "online" ? "url" : "location"]: e.target.value })} placeholder={form.format === "online" ? "https://…" : "Dirección o sala"} />
                {locations.length > 0 && form.format !== "online" && (
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-grey/60">Sede (opcional)</label>
                        <Select
                            options={[{ value: "", label: "Sin sede" }, ...locations.map((l) => ({ value: l.id, label: l.name }))]}
                            value={form.location_id ?? ""}
                            onChange={(e) => setForm({ ...form, location_id: e.target.value })}
                            className="h-11 w-full rounded-2xl px-4"
                        />
                    </div>
                )}
                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-grey/60">Descripción</label>
                    <textarea rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full resize-none rounded-2xl border border-teal/10 bg-cream/30 px-4 py-3 text-sm text-teal-dark placeholder:text-grey/30 focus:border-teal/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/5" />
                </div>
                <div className="flex justify-end gap-3 pt-1">
                    <Button type="button" variant="ghost" onClick={onClose} className="h-11 px-6" disabled={isSaving}>Cancelar</Button>
                    <Button type="button" onClick={handleSave} className="h-11 px-8" isLoading={isSaving}>{event ? "Guardar" : "Crear evento"}</Button>
                </div>
            </div>
        </Modal>
    );
}

function Tile({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return (
        <Card className="bg-white">
            <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-coral/10 text-coral">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                    <p className="text-2xl font-bold leading-tight text-teal-dark">{value}</p>
                    <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-grey/50">{label}</p>
                </div>
            </div>
        </Card>
    );
}

// Teaser de analíticas para el plan Gratis (las avanzadas son de Librería Pro).
function AnalyticsUpsell() {
    return (
        <Card className="border-teal/15 bg-teal/[0.03]">
            <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 shrink-0 text-teal/50" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                    <p className="font-bold text-teal-dark">Analíticas avanzadas</p>
                    <p className="mt-0.5 text-sm text-grey">
                        Lectores, participación y eventos de tus clubs, en un panel. Disponible en <span className="font-semibold">Librería Pro</span>.
                    </p>
                </div>
                <Sparkles className="h-4 w-4 shrink-0 text-coral" aria-hidden="true" />
            </div>
        </Card>
    );
}

function AnalyticsSection({ analytics }: { analytics: OrganizationAnalytics }) {
    const { totals, perClub } = analytics;

    return (
        <section>
            <h2 className={`${sectionTitle} mb-4 flex items-center gap-2`}>
                <BarChart3 className="h-4 w-4" aria-hidden="true" /> Analítica
            </h2>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                <Tile icon={Users} label="Lectores alcanzados" value={numberFmt.format(totals.readers)} />
                <Tile icon={BookOpen} label="Clubs activos" value={numberFmt.format(totals.activeClubs)} />
                <Tile icon={MessageSquare} label="Mensajes" value={numberFmt.format(totals.posts)} />
                <Tile icon={CalendarClock} label="Próximos eventos" value={numberFmt.format(totals.upcomingEvents)} />
                {totals.resourcesDelivered !== null && (
                    <Tile icon={Gift} label="Recursos entregados" value={numberFmt.format(totals.resourcesDelivered)} />
                )}
            </div>

            {perClub.length > 0 && (
                <div className="mt-4 overflow-x-auto rounded-2xl border border-teal/10 bg-white">
                    <table className="w-full min-w-[520px] text-sm">
                        <thead>
                            <tr className="border-b border-teal/10 bg-cream/40 text-left text-xs font-bold uppercase tracking-wide text-grey/50">
                                <th className="px-4 py-3">Club</th>
                                <th className="px-4 py-3">Libro actual</th>
                                <th className="px-4 py-3 text-right">Socios</th>
                                <th className="px-4 py-3 text-right">Mensajes</th>
                                <th className="px-4 py-3 text-right">Próximo evento</th>
                            </tr>
                        </thead>
                        <tbody>
                            {perClub.map((c) => (
                                <tr key={c.id} className="border-b border-teal/5 last:border-0">
                                    <td className="px-4 py-3 font-semibold text-teal-dark">{c.name}</td>
                                    <td className="px-4 py-3 text-grey">{c.bookTitle || "—"}</td>
                                    <td className="px-4 py-3 text-right text-grey-dark">{c.members}</td>
                                    <td className="px-4 py-3 text-right text-grey-dark">{c.posts}</td>
                                    <td className="px-4 py-3 text-right text-grey">{c.nextEvent ? formatEventDate(c.nextEvent) : "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

const FIELD_GROUPS: { label: string; key: keyof Organization; placeholder?: string }[] = [
    { label: "Nombre de la librería", key: "name" },
    { label: "Ciudad", key: "city", placeholder: "Madrid" },
    { label: "Región / Provincia", key: "region", placeholder: "Comunidad de Madrid" },
    { label: "Dirección", key: "address", placeholder: "Calle…" },
    { label: "Web", key: "website", placeholder: "https://…" },
    { label: "Email de contacto", key: "contact_email", placeholder: "hola@…" },
    { label: "Teléfono", key: "phone" },
];

function EditProfileModal({
    organization,
    isOpen,
    onClose,
    isOwner,
}: {
    organization: Organization;
    isOpen: boolean;
    onClose: () => void;
    isOwner: boolean;
}) {
    const router = useRouter();
    const [form, setForm] = React.useState<Record<string, string>>({});
    const [error, setError] = React.useState("");
    const [isSaving, setIsSaving] = React.useState(false);
    const [uploading, setUploading] = React.useState<"logo_url" | "cover_url" | null>(null);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
    const [deleting, setDeleting] = React.useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        const res = await deleteOrganization(organization.id);
        setDeleting(false);
        if (res?.error) { setError(res.error); setConfirmDeleteOpen(false); return; }
        router.push("/app/librerias");
        router.refresh();
    };
    const supabase = React.useMemo(() => createClient(), []);

    // Reset the form to the organization's values each time the modal opens.
    React.useEffect(() => {
        if (!isOpen) return;
        const initial: Record<string, string> = {};
        for (const { key } of FIELD_GROUPS) initial[key] = (organization[key] as string) ?? "";
        initial.description = organization.description ?? "";
        initial.logo_url = organization.logo_url ?? "";
        initial.cover_url = organization.cover_url ?? "";
        initial.buy_link_template = organization.buy_link_template ?? "";
        initial.brand_color = organization.brand_color ?? "";
        setForm(initial);
        setError("");
    }, [isOpen, organization]);

    const handleUpload = async (kind: "logo_url" | "cover_url", e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(kind);
        setError("");
        try {
            const ext = file.name.split(".").pop() || "jpg";
            // Path must start with the user's id (== owner) per the bucket policy.
            const path = `${organization.owner_id}/${kind === "logo_url" ? "logo" : "cover"}-${Date.now()}.${ext}`;
            const { error: upErr } = await supabase.storage.from("organization-images").upload(path, file, { upsert: true });
            if (upErr) throw upErr;
            const { data } = supabase.storage.from("organization-images").getPublicUrl(path);
            setForm((f) => ({ ...f, [kind]: data.publicUrl }));
        } catch (err) {
            setError(`No se pudo subir la imagen: ${err instanceof Error ? err.message : "error desconocido"}`);
        } finally {
            setUploading(null);
            e.target.value = "";
        }
    };

    const handleSave = async () => {
        setError("");
        if (!form.name?.trim()) {
            setError("El nombre de la librería es obligatorio.");
            return;
        }
        setIsSaving(true);
        try {
            const result = await updateOrganization(organization.id, form);
            if (result?.error) {
                setError(result.error);
                return;
            }
            onClose();
            router.refresh();
        } catch {
            setError("No hemos podido guardar los cambios. Inténtalo de nuevo.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Editar perfil de la librería">
            <div className="space-y-4">
                {error && (
                    <div className="flex items-start gap-3 rounded-2xl border border-coral/20 bg-coral/10 px-4 py-3 text-sm font-medium text-coral">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <Input
                    label="Nombre de la librería"
                    value={form.name ?? ""}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                />

                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-grey/60">Descripción</label>
                    <textarea
                        rows={3}
                        value={form.description ?? ""}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Cuéntale a los lectores qué hace especial a tu librería…"
                        className="w-full resize-none rounded-2xl border border-teal/10 bg-cream/30 px-4 py-3 text-sm text-teal-dark placeholder:text-grey/30 focus:border-teal/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/5"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-grey/60">Imágenes</label>
                    <div className="flex flex-wrap items-start gap-4">
                        <label className="group relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-teal/25 bg-cream/30 transition-colors hover:border-teal/50">
                            {form.logo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={form.logo_url} alt="Logo" className="h-full w-full object-cover" />
                            ) : (
                                <span className="flex flex-col items-center gap-1 text-teal/40">
                                    <ImagePlus className="h-6 w-6" aria-hidden="true" />
                                    <span className="text-[10px] font-semibold">Logo</span>
                                </span>
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload("logo_url", e)} disabled={uploading !== null} />
                            {uploading === "logo_url" && <span className="absolute inset-0 flex items-center justify-center bg-white/75 text-xs font-semibold text-teal">Subiendo…</span>}
                        </label>

                        <label className="group relative flex h-24 min-w-[180px] flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-teal/25 bg-cream/30 transition-colors hover:border-teal/50">
                            {form.cover_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={form.cover_url} alt="Portada" className="h-full w-full object-cover" />
                            ) : (
                                <span className="flex flex-col items-center gap-1 text-teal/40">
                                    <ImagePlus className="h-6 w-6" aria-hidden="true" />
                                    <span className="text-[10px] font-semibold">Portada</span>
                                </span>
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload("cover_url", e)} disabled={uploading !== null} />
                            {uploading === "cover_url" && <span className="absolute inset-0 flex items-center justify-center bg-white/75 text-xs font-semibold text-teal">Subiendo…</span>}
                        </label>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    {FIELD_GROUPS.filter((f) => f.key !== "name").map((f) => (
                        <Input
                            key={f.key}
                            label={f.label}
                            value={form[f.key] ?? ""}
                            placeholder={f.placeholder}
                            onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        />
                    ))}
                </div>

                <BuyLinkTemplateField
                    value={form.buy_link_template ?? ""}
                    onChange={(v) => setForm({ ...form, buy_link_template: v })}
                />

                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-grey/60">Color de marca</label>
                    <div className="flex items-center gap-3">
                        <input
                            type="color"
                            value={form.brand_color || "#336871"}
                            onChange={(e) => setForm({ ...form, brand_color: e.target.value })}
                            className="h-10 w-14 cursor-pointer rounded-lg border border-teal/10 bg-white p-1"
                            aria-label="Color de marca"
                        />
                        <span className="text-sm text-grey/70">{form.brand_color || "Por defecto"}</span>
                        {form.brand_color && (
                            <button type="button" onClick={() => setForm({ ...form, brand_color: "" })} className="text-xs font-semibold text-grey/50 hover:text-coral">
                                Quitar
                            </button>
                        )}
                    </div>
                    <p className="mt-1.5 ml-1 text-xs text-grey/40">Se usa como color de acento en tu ficha pública.</p>
                </div>

                {isOwner && (
                    <div className="mt-2 rounded-2xl border border-coral/20 bg-coral/5 p-4">
                        <p className="text-sm font-bold text-coral">Eliminar librería</p>
                        <p className="mt-1 text-xs leading-relaxed text-grey/60">
                            Borra la librería de forma permanente (perfil, equipo, eventos y sedes). Los clubs que aloja
                            dejarán de estar alojados aquí, pero <strong>no se borran</strong>. Esta acción no se puede deshacer.
                        </p>
                        <button
                            type="button"
                            onClick={() => setConfirmDeleteOpen(true)}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-coral/40 px-4 py-2 text-sm font-semibold text-coral transition-colors hover:bg-coral/10"
                        >
                            <Trash2 className="h-4 w-4" aria-hidden="true" /> Eliminar librería
                        </button>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-1">
                    <Button type="button" variant="ghost" onClick={onClose} className="h-11 px-6" disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button type="button" onClick={handleSave} className="h-11 px-8" isLoading={isSaving}>
                        Guardar cambios
                    </Button>
                </div>
            </div>

            <ConfirmModal
                open={confirmDeleteOpen}
                title="Eliminar librería"
                message={`Vas a eliminar "${organization.name}" de forma permanente. Esta acción no se puede deshacer.`}
                confirmLabel="Eliminar definitivamente"
                tone="danger"
                busy={deleting}
                onConfirm={handleDelete}
                onCancel={() => setConfirmDeleteOpen(false)}
            />
        </Modal>
    );
}
