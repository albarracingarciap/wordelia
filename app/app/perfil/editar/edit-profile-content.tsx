"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
    User, BookOpen, Target, Bell, Lock, Settings, ChevronLeft,
    Camera, MapPin, Calendar as CalendarIcon, Save, Heart,
    Moon, Sun, Coffee, Headphones, Smartphone,
    CheckCircle2, AlertCircle, Eye, EyeOff, FileUp, FileSpreadsheet
} from "lucide-react";
import { updateProfile, updatePreferences, updateGoals, updateSettings } from "../actions";
import { createClient } from "@/utils/supabase/client";

// --- Types ---
type ProfileData = {
    id: string;
    username: string;
    email: string;
    full_name: string;
    bio: string | null;
    location: string | null;
    pronouns: string | null;
    birth_date: string | null;
    avatar_url: string | null;
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
    notification_settings: any | null;
    privacy_settings: any | null;
};

const TABS = [
    { id: "personal", label: "Personal", icon: User },
    { id: "preferences", label: "Preferencias", icon: BookOpen },
    { id: "goals", label: "Metas", icon: Target },
    { id: "notifications", label: "Notificaciones", icon: Bell },
    { id: "privacy", label: "Privacidad", icon: Lock },
    { id: "account", label: "Cuenta", icon: Settings },
];

export default function EditProfileContent({ profile }: { profile: ProfileData }) {
    const [activeTab, setActiveTab] = React.useState("personal");
    const [progress, setProgress] = React.useState(30); // Simple mock progress
    const [loading, setLoading] = React.useState(false);

    return (
        <div className="min-h-screen bg-cream/20 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-grey/10 pt-20 pb-4 px-6 sticky top-0 z-50 shadow-sm">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/app/perfil" className="p-2 -ml-2 hover:bg-grey/5 rounded-full transition-colors text-grey/60 hover:text-teal-dark">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-xl font-bold text-teal-dark font-serif">Editar Perfil</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Navigation Sidebar (Tabs) */}
                    <nav className="md:col-span-1 space-y-2 sticky top-32 self-start">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                                    ? "bg-white text-teal-dark shadow-md border border-grey/5 translate-x-1"
                                    : "text-grey/60 hover:text-teal hover:bg-white/50"
                                    }`}
                            >
                                <tab.icon className={`w-4 h-4 transition-colors ${activeTab === tab.id ? "text-coral" : "text-grey/40"}`} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    {/* Content Area */}
                    <div className="md:col-span-3">
                        <div className="bg-white rounded-3xl p-6 md:p-8 border border-grey/10 shadow-sm min-h-[600px] relative overflow-hidden">
                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal/5 to-coral/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                            {activeTab === "personal" && <PersonalTab profile={profile} progress={progress} />}
                            {activeTab === "preferences" && <PreferencesTab profile={profile} />}
                            {activeTab === "goals" && <GoalsTab profile={profile} />}
                            {activeTab === "notifications" && <NotificationsTab profile={profile} />}
                            {activeTab === "privacy" && <PrivacyTab profile={profile} />}
                            {activeTab === "account" && <AccountTab email={profile.email} />}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

// --- TAB 1: Personal ---

function PersonalTab({ profile, progress }: { profile: ProfileData; progress: number }) {
    const [loading, setLoading] = React.useState(false);
    const [avatarUrl, setAvatarUrl] = React.useState(profile.avatar_url);
    const [isUploading, setIsUploading] = React.useState(false);
    const supabase = createClient();

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setIsUploading(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setAvatarUrl(data.publicUrl);
        } catch (error: any) {
            alert('Error uploading image: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        if (avatarUrl) {
            formData.set("avatarUrl", avatarUrl);
        }
        await updateProfile(formData);
        setLoading(false);
        // Could show toast or success message
        alert("Perfil actualizado correctamente");
    };

    return (
        <form action={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-teal-dark font-serif">Información Personal</h2>
                        <p className="text-sm text-grey/60">Completa tu perfil para que otros lectores te conozcan.</p>
                    </div>
                    <Button type="submit" size="sm" isLoading={loading} className="bg-teal hover:bg-teal-dark text-white gap-2 shadow-sm">
                        <Save className="w-4 h-4" /> Guardar
                    </Button>
                </div>
            </div>

            {/* Photo Upload */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-cream/30 rounded-2xl border border-grey/5">
                <div className="relative group cursor-pointer shrink-0" onClick={() => document.getElementById("photo-upload")?.click()}>
                    <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center text-4xl">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            "👤"
                        )}
                    </div>
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                        <Camera className="w-6 h-6 text-white" />
                    </div>
                </div>
                <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                />

                <div className="flex-1 space-y-3 text-center sm:text-left">
                    <p className="text-sm font-medium text-teal-dark">Tu foto de perfil</p>
                    <p className="text-xs text-grey/60">Sube una foto (máx. 5MB).</p>
                    {isUploading && <p className="text-xs text-teal animate-pulse">Subiendo...</p>}
                </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-grey-dark uppercase tracking-wide">Nombre Completo</label>
                    <input name="fullName" type="text" defaultValue={profile.full_name} className="w-full bg-grey/5 border border-grey/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 text-teal-dark font-medium transition-all" required />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-grey-dark uppercase tracking-wide">Fecha de Nacimiento</label>
                    <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-grey/40" />
                        <input name="birthDate" type="date" defaultValue={profile.birth_date || ""} className="w-full bg-grey/5 border border-grey/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 text-grey-dark transition-all" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-grey-dark uppercase tracking-wide">Ubicación</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-grey/40" />
                        <input name="location" type="text" defaultValue={profile.location || ""} className="w-full bg-grey/5 border border-grey/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 text-teal-dark transition-all" placeholder="Ciudad, País" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-grey-dark uppercase tracking-wide">Pronombres</label>
                    <select name="pronouns" defaultValue={profile.pronouns || "Prefiero no decir"} className="w-full bg-grey/5 border border-grey/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 text-grey-dark appearance-none transition-all">
                        <option>Ella (She/Her)</option>
                        <option>Él (He/Him)</option>
                        <option>Elle (They/Them)</option>
                        <option>Prefiero no decir</option>
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-grey-dark uppercase tracking-wide">Biografía Literaria</label>
                <div className="relative">
                    <textarea
                        name="bio"
                        className="w-full bg-grey/5 border border-grey/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 text-grey-dark min-h-[120px] resize-y transition-all"
                        placeholder="Cuéntanos sobre ti como lector..."
                        defaultValue={profile.bio || ""}
                    />
                </div>
            </div>
        </form>
    );
}

// --- TAB 2: Preferences ---

function PreferencesTab({ profile }: { profile: ProfileData }) {
    // We simplify the gamification for the edit page to direct form for now, or keep steps if desired.
    // Direct form is better for editing.
    // However, the original UI had a nice wizard. Let's adapt it to a single page form for editing ease.

    // Actually, let's keep it simple as a form.
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        // Collect engagement elements
        const elements = [];
        // We need to parse checkboxes manually if we don't control them or use hidden inputs.
        // A cleaner way in React form actions with checkboxes is maintaining state or using formData.getAll().
        // Let's rely on standard form behavior but we need correctly named inputs.
        // For chips/buttons that are not checkboxes, we need hidden inputs.

        // Let's use hidden input for complex state
        formData.append("engagementElements", JSON.stringify(engagementElements));

        await updatePreferences(formData);
        setLoading(false);
        alert("Preferencias actualizadas");
    };

    const [complexity, setComplexity] = React.useState(profile.story_complexity_preference || 3);
    const [format, setFormat] = React.useState(profile.reading_format_preference || "physical");
    const [spoilerPreference, setSpoilerPreference] = React.useState(profile.spoiler_preference || false);
    const [engagementElements, setEngagementElements] = React.useState<string[]>(profile.engagement_elements || []);

    const toggleElement = (tag: string) => {
        if (engagementElements.includes(tag)) {
            setEngagementElements(engagementElements.filter(e => e !== tag));
        } else {
            if (engagementElements.length < 3)
                setEngagementElements([...engagementElements, tag]);
        }
    }

    return (
        <form action={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between border-b border-grey/10 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-teal-dark font-serif">Tu Perfil Lector</h2>
                    <p className="text-sm text-grey/60">Personaliza tu experiencia.</p>
                </div>
                <Button type="submit" size="sm" isLoading={loading} className="bg-teal hover:bg-teal-dark text-white gap-2 shadow-sm">
                    <Save className="w-4 h-4" /> Guardar
                </Button>
            </div>

            <div className="space-y-6 max-w-2xl mx-auto pt-4">
                <div className="space-y-3">
                    <label className="text-sm font-medium text-grey-dark block">Formato favorito</label>
                    <div className="grid grid-cols-2 gap-3">
                        <input type="hidden" name="readingFormat" value={format} />
                        <button type="button" onClick={() => setFormat("physical")} className={`flex items-center justify-center gap-3 p-3 rounded-xl border font-bold text-sm transition-all ${format === "physical" ? "bg-teal text-white border-teal" : "bg-white text-grey-dark border-grey/10"}`}>
                            <BookOpen className="w-4 h-4" /> Papel (Físico)
                        </button>
                        <button type="button" onClick={() => setFormat("ebook")} className={`flex items-center justify-center gap-3 p-3 rounded-xl border font-bold text-sm transition-all ${format === "ebook" ? "bg-teal text-white border-teal" : "bg-white text-grey-dark border-grey/10"}`}>
                            <Smartphone className="w-4 h-4" /> E-book
                        </button>
                        {/* Added Audio for completeness with schema */}
                        {/* <button type="button" onClick={() => setFormat("audio")} ... >Audio</button> */}
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-grey-dark block">Complejidad narrativa ({complexity})</label>
                    <div className="px-2">
                        <input name="storyComplexity" type="range" min="1" max="5" value={complexity} onChange={(e) => setComplexity(parseInt(e.target.value))} className="w-full accent-teal h-2 bg-grey/20 rounded-lg appearance-none cursor-pointer" />
                        <div className="flex justify-between text-[10px] text-grey/60 mt-2 font-medium">
                            <span>Ligera</span>
                            <span>Equilibrada</span>
                            <span>Compleja</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white border border-grey/10 rounded-xl shadow-sm">
                    <div className="space-y-0.5">
                        <label className="text-sm font-medium text-grey-dark block">Mostrar Spoilers</label>
                        <p className="text-xs text-grey/60">¿Quieres ver contenido marcado como spoiler por defecto?</p>
                    </div>
                    <div
                        onClick={() => setSpoilerPreference(!spoilerPreference)}
                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${spoilerPreference ? "bg-teal" : "bg-grey/20"}`}
                    >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-300 ${spoilerPreference ? "translate-x-6" : "translate-x-0"}`} />
                        <input type="hidden" name="spoilerPreference" value={spoilerPreference.toString()} />
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-grey-dark block">¿Qué elementos te enganchan más? (Max 3)</label>
                    <div className="flex flex-wrap gap-2">
                        {["Personajes profundos", "Trama intrigante", "Estilo literario", "Giros inesperados", "Mundo detallado"].map(tag => (
                            <button key={tag} type="button" onClick={() => toggleElement(tag)} className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${engagementElements.includes(tag) ? "bg-teal text-white border-teal" : "bg-white text-grey-dark border-grey/20"}`}>
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </form>
    );
}

// --- TAB 3: Goals ---

function GoalsTab({ profile }: { profile: ProfileData }) {
    // Safely handle goals data incase it's null or an array (default DB value)
    const goalsData = (profile.goals && !Array.isArray(profile.goals)) ? profile.goals : { yearly_target: 50, secondary: [] };
    const initialSecondary = Array.isArray(goalsData.secondary) ? goalsData.secondary : [];

    const [loading, setLoading] = React.useState(false);
    const [secondaryGoals, setSecondaryGoals] = React.useState<string[]>(initialSecondary);

    const toggleGoal = (goal: string) => {
        if (secondaryGoals.includes(goal)) {
            setSecondaryGoals(secondaryGoals.filter(g => g !== goal));
        } else {
            setSecondaryGoals([...secondaryGoals, goal]);
        }
    }

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        formData.append("secondaryGoals", JSON.stringify(secondaryGoals));
        await updateGoals(formData);
        setLoading(false);
        alert("Metas actualizadas");
    };

    return (
        <form action={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between border-b border-grey/10 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-teal-dark font-serif">Metas de Lectura</h2>
                    <p className="text-sm text-grey/60">Define tus desafíos para este año.</p>
                </div>
                <Button type="submit" size="sm" isLoading={loading} className="bg-teal hover:bg-teal-dark text-white gap-2 shadow-sm">
                    <Save className="w-4 h-4" /> Guardar
                </Button>
            </div>

            <section className="bg-teal/5 p-6 rounded-2xl space-y-4 border border-teal/10">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-full text-teal shadow-sm">
                        <Target className="w-6 h-6" />
                    </div>
                    <div className="space-y-1 flex-1">
                        <h3 className="font-bold text-teal-dark">Meta Principal {new Date().getFullYear()}</h3>
                        <p className="text-xs text-grey/60">Libros a leer este año.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="p-4 bg-white rounded-xl border border-teal/20 shadow-sm text-center space-y-2 cursor-pointer ring-2 ring-teal ring-offset-2">
                        <span className="text-2xl">📚</span>
                        <div className="font-bold text-teal-dark text-sm">Libros</div>
                        <input name="mainGoal" type="number" defaultValue={goalsData.yearly_target} className="w-16 mx-auto text-center border-b border-grey/20 focus:border-teal outline-none font-bold text-lg" />
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-grey/10 shadow-sm text-center space-y-2 group hover:border-teal/50 transition-colors">
                        <span className="text-2xl">📄</span>
                        <div className="font-bold text-grey-dark group-hover:text-teal-dark text-sm">Páginas</div>
                        <input name="pagesGoal" type="number" defaultValue={goalsData.pages_target || 10000} className="w-20 mx-auto text-center border-b border-grey/20 focus:border-teal outline-none font-bold text-lg bg-transparent" />
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-grey/10 shadow-sm text-center space-y-2 group hover:border-teal/50 transition-colors">
                        <span className="text-2xl">🔥</span>
                        <div className="font-bold text-grey-dark group-hover:text-teal-dark text-sm">Racha (Días)</div>
                        <input name="streakGoal" type="number" defaultValue={goalsData.streak_target || 7} className="w-16 mx-auto text-center border-b border-grey/20 focus:border-teal outline-none font-bold text-lg bg-transparent" />
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="font-bold text-grey-dark text-sm uppercase tracking-wide">Desafíos Secundarios</h3>
                <div className="space-y-3">
                    {[
                        "Leer al menos 3 géneros diferentes",
                        "Explorar autores de 5 países",
                        "Leer 1 clásico universal",
                        "Leer un libro de más de 500 páginas",
                        "Leer un libro publicado este año",
                        "Leer un autor de un continente diferente",
                        "Releer un libro favorito"
                    ].map((habit, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-white border border-grey/10 rounded-xl">
                            <input type="checkbox" checked={secondaryGoals.includes(habit)} onChange={() => toggleGoal(habit)} className="w-4 h-4 accent-teal rounded-md" />
                            <span className="text-sm text-grey-dark">{habit}</span>
                        </div>
                    ))}
                </div>
            </section>
        </form>
    );
}

// --- TAB 4: Notifications ---

function NotificationsTab({ profile }: { profile: ProfileData }) {
    const settings = profile.notification_settings || {
        email_reading_reminders: true,
        push_reading_reminders: true,
        email_recommendations: true,
        push_recommendations: false,
        email_social: false,
        push_social: true,
        email_achievements: true,
        push_achievements: true
    };

    // State to handle toggles
    const [currentSettings, setCurrentSettings] = React.useState(settings);
    const [loading, setLoading] = React.useState(false);

    const toggle = (key: string) => {
        setCurrentSettings((prev: any) => ({ ...prev, [key]: !prev[key] }));
    }

    const handleSave = async () => {
        setLoading(true);
        await updateSettings('notifications', currentSettings);
        setLoading(false);
        alert("Notificaciones actualizadas");
    }

    const items = [
        { title: "Recordatorios de lectura", desc: "Te avisaremos para mantener tu racha.", keys: ["email_reading_reminders", "push_reading_reminders"] },
        { title: "Nuevas recomendaciones", desc: "Libros seleccionados para ti semanalmente.", keys: ["email_recommendations", "push_recommendations"] },
        { title: "Actividad social", desc: "Cuando alguien comenta o da like a tus reseñas.", keys: ["email_social", "push_social"] },
        { title: "Logros y desafíos", desc: "Actualizaciones sobre tu progreso.", keys: ["email_achievements", "push_achievements"] },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between border-b border-grey/10 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-teal-dark font-serif">Notificaciones</h2>
                    <p className="text-sm text-grey/60">Decide cómo y cuándo quieres que te contactemos.</p>
                </div>
                <Button onClick={handleSave} size="sm" isLoading={loading} className="bg-teal hover:bg-teal-dark text-white gap-2 shadow-sm">
                    <Save className="w-4 h-4" /> Guardar
                </Button>
            </div>

            <div className="space-y-6">
                {items.map((item, i) => (
                    <div key={i} className="flex items-start justify-between py-2">
                        <div className="max-w-md">
                            <h4 className="font-bold text-teal-dark text-sm">{item.title}</h4>
                            <p className="text-xs text-grey/60">{item.desc}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={currentSettings[item.keys[0]]} onChange={() => toggle(item.keys[0])} className="toggle toggle-sm accent-teal" />
                                <span className="text-xs font-medium text-grey/60">Email</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={currentSettings[item.keys[1]]} onChange={() => toggle(item.keys[1])} className="toggle toggle-sm accent-teal" />
                                <span className="text-xs font-medium text-grey/60">Push</span>
                            </label>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- TAB 5: Privacy ---

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

    const update = (key: string, value: any) => {
        setCurrentSettings((prev: any) => ({ ...prev, [key]: value }));
    }

    const handleSave = async () => {
        setLoading(true);
        await updateSettings('privacy', currentSettings);
        setLoading(false);
        alert("Privacidad actualizada");
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between border-b border-grey/10 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-teal-dark font-serif">Privacidad</h2>
                    <p className="text-sm text-grey/60">Controla quién puede ver tu actividad.</p>
                </div>
                <Button onClick={handleSave} size="sm" isLoading={loading} className="bg-teal hover:bg-teal-dark text-white gap-2 shadow-sm">
                    <Save className="w-4 h-4" /> Guardar
                </Button>
            </div>

            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 text-amber-800 text-sm">
                <Eye className="w-5 h-5 shrink-0" />
                <p>Tu perfil es actualmente <strong>{currentSettings.profile_visibility === 'public' ? 'Público' : 'Privado/Restringido'}</strong>.</p>
            </div>

            <div className="space-y-6">
                <div>
                    <h4 className="font-bold text-teal-dark text-sm mb-3">Visibilidad del Perfil</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { id: "public", label: "Público 🌍" },
                            { id: "members", label: "Solo Miembros 👥" },
                            { id: "friends", label: "Solo Amigos 🔒" },
                            { id: "private", label: "Privado 🔐" }
                        ].map((opt) => (
                            <button key={opt.id} onClick={() => update("profile_visibility", opt.id)} className={`p-3 rounded-xl border text-sm font-medium text-left ${currentSettings.profile_visibility === opt.id ? "border-teal bg-teal/5 text-teal-dark ring-1 ring-teal" : "border-grey/10 bg-white text-grey-dark"}`}>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <h4 className="font-bold text-teal-dark text-sm mb-2">¿Qué información es visible?</h4>
                    {[
                        { id: "show_name_photo", label: "Nombre y Foto" },
                        { id: "show_location", label: "Ubicación (Ciudad)" },
                        { id: "show_recent_reads", label: "Libros leídos recientemente" },
                        { id: "show_stats", label: "Estadísticas de lectura" }
                    ].map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-grey/10 rounded-xl">
                            <span className="text-sm text-grey-dark">{item.label}</span>
                            <label className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" checked={currentSettings[item.id]} onChange={(e) => update(item.id, e.target.checked)} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-teal" />
                                <span className="toggle-label block overflow-hidden h-5 rounded-full bg-grey/20 cursor-pointer text-transparent">.</span>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// --- TAB 6: Account ---

function AccountTab({ email }: { email: string }) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-b border-grey/10 pb-4">
                <h2 className="text-xl font-bold text-teal-dark font-serif">Configuración de Cuenta</h2>
                <p className="text-sm text-grey/60">Gestiona tu acceso y seguridad.</p>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-grey-dark uppercase tracking-wide">Correo Electrónico</label>
                    <div className="flex gap-2">
                        <input type="email" defaultValue={email} disabled className="flex-1 bg-grey/5 border border-grey/10 rounded-xl px-4 py-2 text-sm text-grey-dark cursor-not-allowed" />
                        <Button variant="outline" size="sm">Cambiar</Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-grey-dark uppercase tracking-wide">Contraseña</label>
                    <div className="flex gap-2">
                        <input type="password" value="********" disabled className="flex-1 bg-grey/5 border border-grey/10 rounded-xl px-4 py-2 text-sm text-grey-dark cursor-not-allowed" />
                        <Button variant="outline" size="sm">Actualizar</Button>
                    </div>
                </div>

                <div className="pt-6 border-t border-grey/10">
                    <h4 className="font-bold text-teal-dark text-sm mb-4">Exportar datos</h4>
                    <Button variant="ghost" size="sm" className="text-teal hover:bg-teal/5">
                        Descargar archivo .JSON con mis datos
                    </Button>
                </div>

                <div className="pt-6 border-t border-grey/10">
                    <h4 className="font-bold text-coral text-sm mb-2">Zona de Peligro</h4>
                    <p className="text-xs text-grey/60 mb-4">Una vez que elimines tu cuenta, no podrás volver atrás.</p>
                    <Button variant="ghost" size="sm" className="text-coral hover:bg-coral/5 border border-coral/20">
                        Eliminar Cuenta Personal
                    </Button>
                </div>
            </div>
        </div>
    );
}
