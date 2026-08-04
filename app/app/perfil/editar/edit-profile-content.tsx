"use client";

import { confirmDialog } from "@/components/ui/confirm";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Bell,
    BookOpen,
    Calendar as CalendarIcon,
    Camera,
    Check,
    ChevronLeft,
    CreditCard,
    Eye,
    FileDown,
    Lock,
    Mail,
    MapPin,
    Save,
    Settings,
    ShieldAlert,
    Smartphone,
    Target,
    Trash2,
    User
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/utils/supabase/client";
import {
    exportMyProfileData,
    requestAccountDeactivation,
    requestEmailChange,
    requestPasswordReset,
    updateGoals,
    updatePreferences,
    updateProfile,
    updateSettings
} from "../actions";
import { ClubHeaderUpload } from "@/components/clubs/create/ClubHeaderUpload";
import { SECONDARY_GOALS, normalizeSecondaryKeys } from "@/lib/secondary-goals";
import { PushToggle } from "@/components/pwa/PushToggle";

type NotificationSettings = Record<string, boolean>;
type PrivacySettings = {
    profile_visibility: string;
    [key: string]: boolean | string;
};

type ProfileData = {
    id: string;
    username: string;
    email: string;
    full_name: string;
    bio: string | null;
    location: string | null;
    pronouns: string | null;
    birth_date: string | null;
    website: string | null;
    avatar_url: string | null;
    header_image_url: string | null;
    reading_format_preference: string | null;
    story_complexity_preference: number | null;
    engagement_elements: string[] | null;
    spoiler_preference?: boolean;
    goals: {
        yearly_target: number;
        pages_target?: number;
        streak_target?: number;
        secondary: string[];
    } | null;
    favorite_genres: string[] | null;
    notification_settings: NotificationSettings | null;
    privacy_settings: PrivacySettings | null;
};

const TABS = [
    { id: "personal", label: "Personal", icon: User },
    { id: "preferences", label: "Preferencias", icon: BookOpen },
    { id: "goals", label: "Metas", icon: Target },
    { id: "notifications", label: "Avisos", icon: Bell },
    { id: "privacy", label: "Privacidad", icon: Lock },
    { id: "account", label: "Cuenta", icon: Settings }
] as const;

const GENRE_OPTIONS = [
    "Misterio/Thriller",
    "Clásicos",
    "Ensayo",
    "Terror",
    "Romance",
    "Fantasía",
    "Ciencia ficción",
    "Histórica",
    "Biografía",
    "Poesía",
    "Novela gráfica",
    "No ficción"
];

const ENGAGEMENT_OPTIONS = [
    "Personajes profundos",
    "Trama intrigante",
    "Estilo literario",
    "Giros inesperados",
    "Mundo detallado",
    "Ritmo ágil"
];

function FormSectionHeader({
    title,
    description,
    action
}: {
    title: string;
    description: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-4 border-b border-grey/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h2 className="text-xl font-bold text-teal-dark">{title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-grey/60">{description}</p>
            </div>
            {action}
        </div>
    );
}

function SaveStatus({ message }: { message: string | null }) {
    if (!message) return null;
    return (
        <p className="inline-flex items-center gap-1 rounded-full bg-teal/5 px-3 py-1 text-xs font-semibold text-teal">
            <Check className="h-3 w-3" /> {message}
        </p>
    );
}

function Toggle({
    checked,
    onChange,
    label
}: {
    checked: boolean;
    onChange: () => void;
    label: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={onChange}
            className={`relative h-7 w-12 rounded-full transition-colors ${checked ? "bg-teal" : "bg-grey/20"}`}
        >
            <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
        </button>
    );
}

function Chip({
    selected,
    children,
    onClick
}: {
    selected: boolean;
    children: React.ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-full border px-3 py-2 text-sm font-semibold transition-all ${selected ? "border-teal bg-teal text-white shadow-sm" : "border-grey/15 bg-white text-grey-dark hover:border-teal/40 hover:text-teal-dark"}`}
        >
            {children}
        </button>
    );
}

export default function EditProfileContent({ profile }: { profile: ProfileData }) {
    const [activeTab, setActiveTab] = React.useState<(typeof TABS)[number]["id"]>("personal");
    const router = useRouter();

    return (
        <div className="min-h-screen bg-cream/20 pb-24">
            <main className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
                <header className="mb-7">
                    <button
                        type="button"
                        onClick={() => router.push("/app/perfil")}
                        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-grey/60 transition-colors hover:text-teal-dark"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Volver
                    </button>
                    <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-grey/40">
                        PERFIL
                    </span>
                    <h1 className="mb-2 text-[2rem] font-medium leading-tight tracking-tight text-teal">
                        Editar perfil
                    </h1>
                    <p className="max-w-2xl text-base leading-relaxed text-gray-500">
                        Ajusta tu identidad lectora, preferencias, metas y privacidad.
                    </p>
                </header>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-[220px_1fr] md:gap-8">
                    <nav className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:sticky md:top-28 md:block md:self-start md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all md:mb-2 md:w-full ${activeTab === tab.id ? "border border-grey/10 bg-white text-teal-dark shadow-sm" : "text-grey/60 hover:bg-white/60 hover:text-teal-dark"}`}
                            >
                                <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? "text-coral" : "text-grey/40"}`} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    <section className="rounded-2xl border border-grey/10 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 md:p-8">
                        {activeTab === "personal" && <PersonalTab profile={profile} />}
                        {activeTab === "preferences" && <PreferencesTab profile={profile} />}
                        {activeTab === "goals" && <GoalsTab profile={profile} />}
                        {activeTab === "notifications" && <NotificationsTab profile={profile} />}
                        {activeTab === "privacy" && <PrivacyTab profile={profile} />}
                        {activeTab === "account" && <AccountTab email={profile.email} />}
                    </section>
                </div>
            </main>
        </div>
    );
}

function PersonalTab({ profile }: { profile: ProfileData }) {
    const [loading, setLoading] = React.useState(false);
    const [avatarUrl, setAvatarUrl] = React.useState(profile.avatar_url);
    const [headerImageUrl, setHeaderImageUrl] = React.useState<string | null>(profile.header_image_url ?? null);
    const [isUploading, setIsUploading] = React.useState(false);
    const [status, setStatus] = React.useState<string | null>(null);
    const supabase = createClient();

    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setStatus(null);
        const fileExt = file.name.split(".").pop() || "jpg";
        const filePath = `${profile.id}/${Date.now()}.${fileExt}`;

        try {
            const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
            setAvatarUrl(data.publicUrl);
            setStatus("Foto preparada. Guarda para confirmar.");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Error desconocido";
            setStatus(`No se pudo subir la foto: ${message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        setStatus(null);
        if (avatarUrl) formData.set("avatarUrl", avatarUrl);
        // Siempre se envía (vacío = quitar la imagen de cabecera).
        formData.set("headerImageUrl", headerImageUrl ?? "");
        const result = await updateProfile(formData);
        setLoading(false);
        setStatus(result?.error || "Perfil actualizado");
    };

    return (
        <form action={handleSubmit} className="space-y-7">
            <FormSectionHeader
                title="Información personal"
                description="Completa los datos que quieres mostrar en tu perfil lector."
                action={
                    <div className="flex flex-col gap-2 sm:items-end">
                        <Button type="submit" size="sm" isLoading={loading} className="w-full gap-2 bg-teal text-white shadow-sm hover:bg-teal-dark sm:w-auto">
                            <Save className="h-4 w-4" /> Guardar
                        </Button>
                        <SaveStatus message={status} />
                    </div>
                }
            />

            <div className="flex flex-col items-center gap-5 rounded-2xl border border-grey/10 bg-cream/30 p-4 sm:flex-row sm:gap-6 sm:p-6">
                <button
                    type="button"
                    className="group relative shrink-0"
                    onClick={() => document.getElementById("photo-upload")?.click()}
                >
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white text-3xl shadow-md">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                            <User className="h-10 w-10 text-teal/60" />
                        )}
                    </div>
                    <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                        <Camera className="h-6 w-6" />
                    </span>
                </button>
                <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

                <div className="flex-1 text-center sm:text-left">
                    <p className="font-semibold text-teal-dark">Tu foto de perfil</p>
                    <p className="mt-1 text-sm leading-relaxed text-grey/60">Sube una imagen cuadrada o con el rostro centrado. Tamaño recomendado: menos de 5 MB.</p>
                    {isUploading && <p className="mt-2 text-sm font-semibold text-teal">Subiendo foto...</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <label className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-grey-dark">Nombre completo</span>
                    <input name="fullName" type="text" defaultValue={profile.full_name} className="w-full rounded-xl border border-grey/10 bg-grey/5 px-4 py-3 text-sm font-medium text-teal-dark outline-none transition-all focus:ring-2 focus:ring-teal/20" required />
                </label>

                <label className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-grey-dark">Nombre de usuario</span>
                    <span className="relative block">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-grey/40">@</span>
                        <input name="username" type="text" defaultValue={profile.username} minLength={3} maxLength={30} pattern="[a-zA-Z0-9_]{3,30}" title="3-30 caracteres: letras, números o guion bajo" className="w-full rounded-xl border border-grey/10 bg-grey/5 py-3 pl-8 pr-4 text-sm font-medium text-teal-dark outline-none transition-all focus:ring-2 focus:ring-teal/20" placeholder="tu_usuario" />
                    </span>
                    <span className="block text-[11px] text-grey/40">Único. 3-30 caracteres: letras, números o guion bajo.</span>
                </label>

                <label className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-grey-dark">Fecha de nacimiento</span>
                    <span className="relative block">
                        <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grey/40" />
                        <input name="birthDate" type="date" defaultValue={profile.birth_date || ""} className="w-full rounded-xl border border-grey/10 bg-grey/5 py-3 pl-10 pr-4 text-sm text-grey-dark outline-none transition-all focus:ring-2 focus:ring-teal/20" />
                    </span>
                </label>

                <label className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-grey-dark">Ubicación</span>
                    <span className="relative block">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grey/40" />
                        <input name="location" type="text" defaultValue={profile.location || ""} className="w-full rounded-xl border border-grey/10 bg-grey/5 py-3 pl-10 pr-4 text-sm text-teal-dark outline-none transition-all focus:ring-2 focus:ring-teal/20" placeholder="Ciudad, país" />
                    </span>
                </label>

                <label className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-grey-dark">Pronombres</span>
                    <select name="pronouns" defaultValue={profile.pronouns || "Prefiero no decir"} className="w-full rounded-xl border border-grey/10 bg-grey/5 px-4 py-3 text-sm text-grey-dark outline-none transition-all focus:ring-2 focus:ring-teal/20">
                        <option>Ella</option>
                        <option>Él</option>
                        <option>Elle</option>
                        <option>Prefiero no decir</option>
                    </select>
                </label>
            </div>

            <label className="block space-y-2">
                <span className="text-xs font-bold uppercase tracking-wide text-grey-dark">Biografía literaria</span>
                <textarea
                    name="bio"
                    className="min-h-[120px] w-full resize-y rounded-xl border border-grey/10 bg-grey/5 px-4 py-3 text-sm text-grey-dark outline-none transition-all focus:ring-2 focus:ring-teal/20"
                    placeholder="Cuéntanos qué tipo de lector eres, qué buscas o qué te gusta compartir."
                    defaultValue={profile.bio || ""}
                />
            </label>

            <label className="block space-y-2">
                <span className="text-xs font-bold uppercase tracking-wide text-grey-dark">Sitio web</span>
                <input
                    name="website"
                    type="url"
                    defaultValue={profile.website || ""}
                    placeholder="https://tu-web.com"
                    className="w-full rounded-xl border border-grey/10 bg-grey/5 px-4 py-3 text-sm text-teal-dark outline-none transition-all focus:ring-2 focus:ring-teal/20"
                />
            </label>

            <div>
                <ClubHeaderUpload
                    value={headerImageUrl}
                    onChange={setHeaderImageUrl}
                    bucket="profile-headers"
                    label="Imagen de cabecera del perfil"
                    ctaLabel="Añadir imagen de cabecera"
                    hint="Opcional. Sustituye al color de portada. Recomendado ~1200×900 px (apaisada), JPG o PNG, hasta 5 MB."
                />
            </div>
        </form>
    );
}

function PreferencesTab({ profile }: { profile: ProfileData }) {
    const [loading, setLoading] = React.useState(false);
    const [status, setStatus] = React.useState<string | null>(null);
    const [complexity, setComplexity] = React.useState(profile.story_complexity_preference || 3);
    const [format, setFormat] = React.useState(profile.reading_format_preference || "physical");
    const [spoilerPreference, setSpoilerPreference] = React.useState(Boolean(profile.spoiler_preference));
    const [engagementElements, setEngagementElements] = React.useState<string[]>(profile.engagement_elements || []);
    const [favoriteGenres, setFavoriteGenres] = React.useState<string[]>(profile.favorite_genres || []);

    const toggleWithLimit = (value: string, list: string[], setter: React.Dispatch<React.SetStateAction<string[]>>, limit: number) => {
        if (list.includes(value)) {
            setter(list.filter((item) => item !== value));
            return;
        }

        if (list.length < limit) setter([...list, value]);
    };

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        setStatus(null);
        formData.append("engagementElements", JSON.stringify(engagementElements));
        formData.append("favoriteGenres", JSON.stringify(favoriteGenres));
        const result = await updatePreferences(formData);
        setLoading(false);
        setStatus(result?.error || "Preferencias actualizadas");
    };

    return (
        <form action={handleSubmit} className="space-y-7">
            <FormSectionHeader
                title="Perfil lector"
                description="Estos datos ayudan a personalizar recomendaciones, retos y señales sociales."
                action={
                    <div className="flex flex-col gap-2 sm:items-end">
                        <Button type="submit" size="sm" isLoading={loading} className="w-full gap-2 bg-teal text-white shadow-sm hover:bg-teal-dark sm:w-auto">
                            <Save className="h-4 w-4" /> Guardar
                        </Button>
                        <SaveStatus message={status} />
                    </div>
                }
            />

            <div className="space-y-3">
                <div>
                    <h3 className="font-semibold text-teal-dark">Géneros favoritos</h3>
                    <p className="mt-1 text-sm text-grey/60">Elige hasta 6. Se mostrarán como intereses lectores en tu perfil.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {GENRE_OPTIONS.map((genre) => (
                        <Chip
                            key={genre}
                            selected={favoriteGenres.includes(genre)}
                            onClick={() => toggleWithLimit(genre, favoriteGenres, setFavoriteGenres, 6)}
                        >
                            {genre}
                        </Chip>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <h3 className="font-semibold text-teal-dark">Formato favorito</h3>
                <input type="hidden" name="readingFormat" value={format} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[
                        { id: "physical", label: "Papel", icon: BookOpen },
                        { id: "ebook", label: "E-book", icon: Smartphone },
                        { id: "audio", label: "Audio", icon: Bell }
                    ].map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => setFormat(option.id)}
                            className={`flex items-center justify-center gap-3 rounded-xl border p-3 text-sm font-bold transition-all ${format === option.id ? "border-teal bg-teal text-white" : "border-grey/10 bg-white text-grey-dark hover:border-teal/30"}`}
                        >
                            <option.icon className="h-4 w-4" /> {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-grey/10 bg-cream/30 p-4">
                <label className="block text-sm font-semibold text-teal-dark">Complejidad narrativa ({complexity})</label>
                <input name="storyComplexity" type="range" min="1" max="5" value={complexity} onChange={(event) => setComplexity(parseInt(event.target.value))} className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-grey/20 accent-teal" />
                <div className="flex justify-between text-[11px] font-medium text-grey/60">
                    <span>Ligera</span>
                    <span>Equilibrada</span>
                    <span>Compleja</span>
                </div>
            </div>

            <div className="flex items-start justify-between gap-4 rounded-2xl border border-grey/10 bg-white p-4 shadow-sm">
                <div>
                    <h3 className="font-semibold text-teal-dark">Mostrar spoilers</h3>
                    <p className="mt-1 text-sm leading-relaxed text-grey/60">Activa esta opción si quieres ver contenido marcado como spoiler por defecto.</p>
                </div>
                <Toggle checked={spoilerPreference} onChange={() => setSpoilerPreference(!spoilerPreference)} label="Mostrar spoilers" />
                <input type="hidden" name="spoilerPreference" value={spoilerPreference.toString()} />
            </div>

            <div className="space-y-3">
                <div>
                    <h3 className="font-semibold text-teal-dark">Qué te engancha</h3>
                    <p className="mt-1 text-sm text-grey/60">Elige hasta 3 elementos que suelen hacer que un libro te atrape.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {ENGAGEMENT_OPTIONS.map((tag) => (
                        <Chip
                            key={tag}
                            selected={engagementElements.includes(tag)}
                            onClick={() => toggleWithLimit(tag, engagementElements, setEngagementElements, 3)}
                        >
                            {tag}
                        </Chip>
                    ))}
                </div>
            </div>
        </form>
    );
}

function GoalsTab({ profile }: { profile: ProfileData }) {
    const goalsData = profile.goals && !Array.isArray(profile.goals) ? profile.goals : { yearly_target: 50, secondary: [] };
    const initialSecondary = normalizeSecondaryKeys(goalsData.secondary);
    const [loading, setLoading] = React.useState(false);
    const [status, setStatus] = React.useState<string | null>(null);
    const [secondaryGoals, setSecondaryGoals] = React.useState<string[]>(initialSecondary);

    const toggleGoal = (goal: string) => {
        setSecondaryGoals((current) => current.includes(goal) ? current.filter((item) => item !== goal) : [...current, goal]);
    };

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        setStatus(null);
        formData.append("secondaryGoals", JSON.stringify(secondaryGoals));
        const result = await updateGoals(formData);
        setLoading(false);
        setStatus(result?.error || "Metas actualizadas");
    };

    return (
        <form action={handleSubmit} className="space-y-7">
            <FormSectionHeader
                title="Metas de lectura"
                description="Define tus objetivos del año y algunos retos secundarios."
                action={
                    <div className="flex flex-col gap-2 sm:items-end">
                        <Button type="submit" size="sm" isLoading={loading} className="w-full gap-2 bg-teal text-white shadow-sm hover:bg-teal-dark sm:w-auto">
                            <Save className="h-4 w-4" /> Guardar
                        </Button>
                        <SaveStatus message={status} />
                    </div>
                }
            />

            <section className="rounded-2xl border border-teal/10 bg-teal/5 p-4 sm:p-6">
                <div className="flex items-start gap-4">
                    <div className="rounded-full bg-white p-3 text-teal shadow-sm">
                        <Target className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-teal-dark">Meta principal {new Date().getFullYear()}</h3>
                        <p className="mt-1 text-sm text-grey/60">Ajusta el objetivo a tu ritmo real.</p>
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <label className="rounded-xl border border-teal/20 bg-white p-4 text-center shadow-sm">
                        <span className="block text-sm font-bold text-teal-dark">Libros</span>
                        <input name="mainGoal" type="number" min="1" defaultValue={goalsData.yearly_target} className="mx-auto mt-2 w-20 border-b border-grey/20 bg-transparent text-center text-lg font-bold outline-none focus:border-teal" />
                    </label>
                    <label className="rounded-xl border border-grey/10 bg-white p-4 text-center shadow-sm">
                        <span className="block text-sm font-bold text-grey-dark">Páginas</span>
                        <input name="pagesGoal" type="number" min="0" defaultValue={goalsData.pages_target || 10000} className="mx-auto mt-2 w-24 border-b border-grey/20 bg-transparent text-center text-lg font-bold outline-none focus:border-teal" />
                    </label>
                    <label className="rounded-xl border border-grey/10 bg-white p-4 text-center shadow-sm">
                        <span className="block text-sm font-bold text-grey-dark">Racha</span>
                        <input name="streakGoal" type="number" min="0" defaultValue={goalsData.streak_target || 7} className="mx-auto mt-2 w-20 border-b border-grey/20 bg-transparent text-center text-lg font-bold outline-none focus:border-teal" />
                    </label>
                </div>
            </section>

            <section className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wide text-grey-dark">Desafíos secundarios</h3>
                <p className="text-xs text-grey/50">Los marcados como automáticos se completan solos según tus lecturas del año; el resto los marcas tú desde tu perfil.</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {SECONDARY_GOALS.map((goal) => (
                        <label key={goal.key} className="flex cursor-pointer items-start gap-3 rounded-xl border border-grey/10 bg-white p-3 text-sm text-grey-dark transition hover:border-teal/30">
                            <input type="checkbox" checked={secondaryGoals.includes(goal.key)} onChange={() => toggleGoal(goal.key)} className="mt-0.5 h-4 w-4 rounded-md accent-teal" />
                            <span className="flex-1">
                                <span className="flex items-center gap-2">
                                    {goal.label}
                                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase ${goal.type === "auto" ? "bg-teal/10 text-teal" : "bg-grey/10 text-grey/50"}`}>
                                        {goal.type === "auto" ? "Auto" : "Manual"}
                                    </span>
                                </span>
                                {goal.hint && <span className="mt-0.5 block text-xs text-grey/45">{goal.hint}</span>}
                            </span>
                        </label>
                    ))}
                </div>
            </section>
        </form>
    );
}

function NotificationsTab({ profile }: { profile: ProfileData }) {
    const settings = profile.notification_settings || {
        email_reading_reminders: true,
        push_reading_reminders: true,
        email_recommendations: true,
        push_recommendations: false,
        email_social: false,
        push_social: true,
        email_achievements: true,
        push_achievements: true,
        email_libraries: true,
        push_libraries: true
    };

    const [currentSettings, setCurrentSettings] = React.useState(settings);
    const [loading, setLoading] = React.useState(false);
    const [status, setStatus] = React.useState<string | null>(null);

    const toggle = (key: string) => {
        setCurrentSettings((current: NotificationSettings) => ({ ...current, [key]: !current[key] }));
    };

    const handleSave = async () => {
        setLoading(true);
        setStatus(null);
        const result = await updateSettings("notifications", currentSettings);
        setLoading(false);
        setStatus(result?.error || "Notificaciones actualizadas");
    };

    const items = [
        { title: "Recordatorios de lectura", desc: "Avisos para mantener tu racha.", keys: ["email_reading_reminders", "push_reading_reminders"] },
        { title: "Nuevas recomendaciones", desc: "Libros seleccionados para ti semanalmente.", keys: ["email_recommendations", "push_recommendations"] },
        { title: "Actividad social", desc: "Comentarios, menciones o reacciones.", keys: ["email_social", "push_social"] },
        { title: "Logros y desafíos", desc: "Actualizaciones sobre insignias y retos.", keys: ["email_achievements", "push_achievements"] },
        { title: "Actividad de librerías", desc: "Nuevos eventos de las librerías que sigues.", keys: ["email_libraries", "push_libraries"] }
    ];

    return (
        <div className="space-y-7">
            <FormSectionHeader
                title="Notificaciones"
                description="Decide cómo y cuándo quieres recibir avisos."
                action={
                    <div className="flex flex-col gap-2 sm:items-end">
                        <Button onClick={handleSave} size="sm" isLoading={loading} className="w-full gap-2 bg-teal text-white shadow-sm hover:bg-teal-dark sm:w-auto">
                            <Save className="h-4 w-4" /> Guardar
                        </Button>
                        <SaveStatus message={status} />
                    </div>
                }
            />

            {/* Interruptor maestro: pide permiso al navegador y suscribe ESTE dispositivo
                a push. Sin esto, los checkboxes "Push" de abajo no reciben nada. */}
            <PushToggle />

            <div className="space-y-3">
                {items.map((item) => (
                    <div key={item.title} className="flex flex-col gap-4 rounded-2xl border border-grey/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h4 className="font-bold text-teal-dark">{item.title}</h4>
                            <p className="mt-1 text-sm text-grey/60">{item.desc}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-sm font-semibold text-grey/60">
                                <input type="checkbox" checked={currentSettings[item.keys[0]]} onChange={() => toggle(item.keys[0])} className="h-4 w-4 accent-teal" />
                                Email
                            </label>
                            <label className="flex items-center gap-2 text-sm font-semibold text-grey/60">
                                <input type="checkbox" checked={currentSettings[item.keys[1]]} onChange={() => toggle(item.keys[1])} className="h-4 w-4 accent-teal" />
                                Push
                            </label>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PrivacyTab({ profile }: { profile: ProfileData }) {
    const settings = profile.privacy_settings || {
        profile_visibility: "public",
        show_name_photo: true,
        show_location: true,
        show_recent_reads: true,
        show_stats: true
    };

    const [currentSettings, setCurrentSettings] = React.useState(settings);
    const [loading, setLoading] = React.useState(false);
    const [status, setStatus] = React.useState<string | null>(null);

    const update = (key: string, value: boolean | string) => {
        setCurrentSettings((current: PrivacySettings) => ({ ...current, [key]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        setStatus(null);
        const result = await updateSettings("privacy", currentSettings);
        setLoading(false);
        setStatus(result?.error || "Privacidad actualizada");
    };

    return (
        <div className="space-y-7">
            <FormSectionHeader
                title="Privacidad"
                description="Controla quién puede ver tu perfil y tu actividad lectora."
                action={
                    <div className="flex flex-col gap-2 sm:items-end">
                        <Button onClick={handleSave} size="sm" isLoading={loading} className="w-full gap-2 bg-teal text-white shadow-sm hover:bg-teal-dark sm:w-auto">
                            <Save className="h-4 w-4" /> Guardar
                        </Button>
                        <SaveStatus message={status} />
                    </div>
                }
            />

            <div className="flex gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
                <Eye className="h-5 w-5 shrink-0" />
                <p>
                    Tu perfil público está configurado como <strong>{currentSettings.profile_visibility === "public" ? "público" : "restringido"}</strong>.
                    Estos ajustes se aplican en la página compartida de perfil.
                </p>
            </div>

            <section className="space-y-3">
                <h3 className="font-bold text-teal-dark">Visibilidad del perfil</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                        { id: "public", label: "Público", desc: "Cualquier lector puede verlo." },
                        { id: "members", label: "Solo miembros", desc: "Visible dentro de Wordelia." },
                        { id: "friends", label: "Solo amigos", desc: "Limita el acceso a tu círculo." },
                        { id: "private", label: "Privado", desc: "Solo tú puedes verlo." }
                    ].map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => update("profile_visibility", option.id)}
                            className={`rounded-2xl border p-4 text-left transition ${currentSettings.profile_visibility === option.id ? "border-teal bg-teal/5 ring-1 ring-teal" : "border-grey/10 bg-white hover:border-teal/30"}`}
                        >
                            <span className="font-bold text-teal-dark">{option.label}</span>
                            <span className="mt-1 block text-sm text-grey/60">{option.desc}</span>
                        </button>
                    ))}
                </div>
            </section>

            <section className="space-y-3">
                <h3 className="font-bold text-teal-dark">Información visible</h3>
                {[
                    { id: "show_name_photo", label: "Nombre y foto" },
                    { id: "show_location", label: "Ubicación" },
                    { id: "show_recent_reads", label: "Lecturas recientes" },
                    { id: "show_stats", label: "Estadísticas de lectura" }
                ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-grey/10 bg-white p-4">
                        <span className="text-sm font-semibold text-grey-dark">{item.label}</span>
                        <Toggle checked={Boolean(currentSettings[item.id])} onChange={() => update(item.id, !currentSettings[item.id])} label={item.label} />
                    </div>
                ))}
            </section>
        </div>
    );
}

function AccountTab({ email }: { email: string }) {
    const [newEmail, setNewEmail] = React.useState(email);
    const [status, setStatus] = React.useState<string | null>(null);
    const [loadingAction, setLoadingAction] = React.useState<string | null>(null);

    const runAction = async (name: string, action: () => Promise<any>, successMessage: string) => {
        setLoadingAction(name);
        setStatus(null);
        const result = await action();
        setLoadingAction(null);
        setStatus(result?.error || successMessage);
    };

    const handleExport = async () => {
        await runAction("export", async () => {
            const result = await exportMyProfileData();
            if (result?.error) return result;

            const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `wordelia-datos-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);

            return { success: true };
        }, "Exportación preparada");
    };

    return (
        <div className="space-y-7">
            <FormSectionHeader
                title="Cuenta"
                description="Gestiona acceso, seguridad y datos personales."
                action={<SaveStatus message={status} />}
            />

            <div className="space-y-5">
                <label className="block space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-grey-dark">Correo electrónico</span>
                    <span className="flex flex-col gap-2 sm:flex-row">
                        <span className="relative flex-1">
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grey/40" />
                            <input
                                type="email"
                                value={newEmail}
                                onChange={(event) => setNewEmail(event.target.value)}
                                className="w-full rounded-xl border border-grey/10 bg-grey/5 py-3 pl-10 pr-4 text-sm text-grey-dark outline-none focus:ring-2 focus:ring-teal/20"
                            />
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="sm:h-auto"
                            isLoading={loadingAction === "email"}
                            onClick={() => runAction("email", () => requestEmailChange(newEmail), "Revisa tu correo para confirmar el cambio")}
                        >
                            Cambiar
                        </Button>
                    </span>
                </label>

                <div className="rounded-2xl border border-grey/10 bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="font-bold text-teal-dark">Contraseña</h3>
                            <p className="mt-1 text-sm text-grey/60">Actualiza tu contraseña desde un enlace seguro.</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            isLoading={loadingAction === "password"}
                            onClick={() => runAction("password", requestPasswordReset, "Te hemos enviado un email para actualizar la contraseña")}
                        >
                            Actualizar
                        </Button>
                    </div>
                </div>

                <div className="rounded-2xl border border-grey/10 bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="font-bold text-teal-dark">Suscripción</h3>
                            <p className="mt-1 text-sm text-grey/60">Consulta tu plan, cámbialo o cancélalo cuando quieras.</p>
                        </div>
                        <Link
                            href="/app/perfil/suscripcion"
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-teal/20 px-3 text-sm font-semibold text-teal transition-colors hover:bg-teal/5"
                        >
                            <CreditCard className="h-4 w-4" /> Gestionar
                        </Link>
                    </div>
                </div>

                <div className="rounded-2xl border border-grey/10 bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="font-bold text-teal-dark">Exportar datos</h3>
                            <p className="mt-1 text-sm text-grey/60">Descarga una copia de tu información.</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-teal hover:bg-teal/5"
                            isLoading={loadingAction === "export"}
                            onClick={handleExport}
                        >
                            <FileDown className="h-4 w-4" /> Descargar JSON
                        </Button>
                    </div>
                </div>

                <div className="rounded-2xl border border-coral/20 bg-coral/5 p-4">
                    <div className="flex gap-3">
                        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-coral" />
                        <div className="flex-1">
                            <h3 className="font-bold text-coral">Zona delicada</h3>
                            <p className="mt-1 text-sm text-grey-dark/70">Eliminar tu cuenta borrará tus datos personales y no se podrá deshacer.</p>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="mt-4 gap-2 border border-coral/20 text-coral hover:bg-coral/5"
                                isLoading={loadingAction === "deactivate"}
                                onClick={async () => {
                                    if (await confirmDialog({ title: "Solicitar baja", message: "¿Quieres solicitar la baja y ocultar tu perfil público?", confirmLabel: "Solicitar baja", tone: "danger" })) {
                                        runAction("deactivate", requestAccountDeactivation, "Solicitud registrada. Tu perfil queda oculto.");
                                    }
                                }}
                            >
                                <Trash2 className="h-4 w-4" /> Solicitar baja
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
