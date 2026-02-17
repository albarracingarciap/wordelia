"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { completeOnboarding } from "./actions";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronRight,
    Camera,
    BookOpen,
    Book,
    Sparkles,
    Sprout,
    GraduationCap,
    Users,
    Check
} from "lucide-react";

// Types
type ReaderType = "occasional" | "regular" | "avid" | "beginner" | "educator" | "organizer";

const GENRES = [
    "Ficción contemporánea", "Clásicos", "Fantasía", "Ciencia ficción", "Romance",
    "Misterio/Thriller", "No ficción", "Biografías", "Historia", "Desarrollo personal",
    "Poesía", "Teatro", "Ensayo", "Juvenil", "Terror", "Distopía", "Realismo mágico",
    "Literatura LGBTQ+"
];

const GOALS = [
    "Descubrir nuevos libros",
    "Unirme a clubes de lectura",
    "Hacer seguimiento de mis lecturas",
    "Conseguir recomendaciones personalizadas",
    "Participar en discusiones literarias",
    "Mejorar mi comprensión lectora",
    "Organizar mi propio club",
    "Recursos para enseñar literatura"
];

const READER_TYPES: { id: ReaderType; label: string; subLabel: string; icon: React.ReactNode }[] = [
    { id: "occasional", label: "Lector ocasional", subLabel: "1-5 libros/año", icon: <BookOpen className="w-5 h-5" /> },
    { id: "regular", label: "Lector regular", subLabel: "6-20 libros/año", icon: <Book className="w-5 h-5" /> },
    { id: "avid", label: "Lector ávido", subLabel: "20+ libros/año", icon: <Sparkles className="w-5 h-5" /> },
    { id: "beginner", label: "Quiero empezar", subLabel: "A leer más", icon: <Sprout className="w-5 h-5" /> },
    { id: "educator", label: "Educador/Profesor", subLabel: "Enseño literatura", icon: <GraduationCap className="w-5 h-5" /> },
    { id: "organizer", label: "Organizador", subLabel: "De club de lectura", icon: <Users className="w-5 h-5" /> },
];

export default function OnboardingPage() {
    // 0: Welcome, 1: Personal Data, 2: Preferences
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);

    // Form State
    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [usernameAvailable, setUsernameAvailable] = useState(false);
    const [usernameError, setUsernameError] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [photoUrl, setPhotoUrl] = useState<string | null>(null); // Display URL
    const [avatarPath, setAvatarPath] = useState<string | null>(null); // DB Path
    const [isUploading, setIsUploading] = useState(false);
    const [readerType, setReaderType] = useState<ReaderType | null>(null);
    const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
    const [goals, setGoals] = useState<string[]>([]);
    const [otherGenre, setOtherGenre] = useState("");

    // Import supabase client for client-side checks/uploads
    const supabase = createClient();

    const handleStart = () => {
        setStep(1);
    };

    const handlePersonalDataSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(2);
    };

    // Debounce username check
    const checkUsername = async (val: string) => {
        if (val.length < 3) {
            setUsernameError("Mínimo 3 caracteres");
            setUsernameAvailable(false);
            return;
        }

        // Remove spaces and special chars
        const cleanVal = val.toLowerCase().replace(/[^a-z0-9_]/g, "");
        if (cleanVal !== val) {
            setUsernameError("Solo letras, números y guiones bajos");
            // We can allow them to type but warn, or auto-clean. Let's warn.
        }

        const { data, error } = await supabase
            .from("profiles")
            .select("username")
            .eq("username", val)
            .single();

        if (data) {
            setUsernameError("Este nombre de usuario ya está en uso");
            setUsernameAvailable(false);
        } else {
            setUsernameError("");
            setUsernameAvailable(true);
        }
    };

    const handleUsernameChange = (val: string) => {
        setUsername(val);
        // Basic debounce manually or just call every time (Supabase is fast, but better debounce in real app)
        // For simple MVP without lodash, just call it.
        if (val.length > 0) checkUsername(val);
        else {
            setUsernameError("");
            setUsernameAvailable(false);
        }
    };

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

            // Get public URL
            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

            setPhotoUrl(data.publicUrl); // To show preview
            setAvatarPath(data.publicUrl); // To save to DB (we save the full URL usually or just path)

        } catch (error: any) {
            alert('Error uploading image: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const toggleGenre = (genre: string) => {
        setFavoriteGenres(prev => {
            if (prev.includes(genre)) {
                return prev.filter(g => g !== genre);
            } else {
                if (prev.length >= 10) return prev;
                return [...prev, genre];
            }
        });
    };

    const toggleGoal = (goal: string) => {
        setGoals(prev => {
            if (prev.includes(goal)) {
                return prev.filter(g => g !== goal);
            } else {
                return [...prev, goal];
            }
        });
    };

    const handleSubmit = async () => {
        if (loading) return;
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("fullName", fullName);
            formData.append("username", username);
            formData.append("birthDate", birthDate);
            if (avatarPath) formData.append("avatarUrl", avatarPath);
            if (readerType) formData.append("readerType", readerType);
            formData.append("favoriteGenres", JSON.stringify(favoriteGenres));
            formData.append("goals", JSON.stringify(goals));

            const result = await completeOnboarding(formData);
            if (result?.error) {
                alert("Error al guardar: " + result.error);
                setLoading(false);
            }
            // Logic stops here if redirect occurs
        } catch (error) {
            console.error("Submission Error:", error);
            alert("Ocurrió un error inesperado. Por favor intenta de nuevo.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6">
            <header className="fixed top-0 left-0 w-full px-6 py-4 flex items-center justify-between z-10 pointer-events-none">
                <div className="pointer-events-auto">
                    {step > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-teal text-white flex items-center justify-center font-bold text-sm transition-all duration-300">
                                {step}
                            </div>
                            <span className="text-sm font-medium text-grey/60 uppercase tracking-widest">
                                Paso {step} de 2
                            </span>
                        </div>
                    )}
                </div>
            </header>

            <AnimatePresence mode="wait">
                {step === 0 && (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="max-w-md w-full text-center space-y-8 flex flex-col items-center"
                    >
                        <h1 className="font-serif text-4xl text-teal-dark">¡Bienvenido!</h1>

                        <div className="relative w-48 h-12">
                            <Image
                                src="/assets/images/logo_wordelia.png"
                                alt="Wordelia Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>

                        <p className="text-grey-dark text-lg">
                            A continuación vamos a configurar un perfil básico, no te llevará más de 2 minutos.
                        </p>

                        <Button
                            onClick={handleStart}
                            fullWidth
                        // size="md" is default, let's remove lg to make it smaller as requested
                        >
                            Completar mi perfil
                        </Button>
                    </motion.div>
                )}

                {step === 1 && (
                    <motion.div
                        key="personal"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-teal/5 space-y-6"
                    >
                        <div className="text-center space-y-2">
                            <h2 className="font-serif text-2xl text-teal-dark">Sobre ti</h2>
                            <p className="text-sm text-grey/70">Para personalizar tu experiencia</p>
                        </div>

                        <form onSubmit={handlePersonalDataSubmit} className="space-y-6">
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    <div
                                        className={`w-24 h-24 rounded-full flex items-center justify-center border-2 border-dashed border-teal/30 hover:border-teal transition-colors overflow-hidden cursor-pointer ${photoUrl ? "bg-white" : "bg-cream/20"}`}
                                        onClick={() => document.getElementById("photo-upload")?.click()}
                                    >
                                        {photoUrl ? (
                                            <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <Camera className="w-8 h-8 text-teal/40" />
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        id="photo-upload"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handlePhotoUpload}
                                    />
                                    {isUploading && (
                                        <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-full">
                                            <div className="w-4 h-4 border-2 border-teal border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                                <span className="text-sm text-grey/60">Foto (opcional)</span>
                            </div>

                            <div className="space-y-4">
                                <Input
                                    label="Nombre Completo"
                                    placeholder="Tu nombre real"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                                <div>
                                    <Input
                                        label="Nombre de Usuario"
                                        placeholder="@usuario"
                                        value={username}
                                        onChange={(e) => handleUsernameChange(e.target.value)}
                                        required
                                        className={usernameError ? "border-red-500" : usernameAvailable ? "border-green-500" : ""}
                                    />
                                    {usernameError && <p className="text-xs text-red-500 mt-1">{usernameError}</p>}
                                    {usernameAvailable && !usernameError && <p className="text-xs text-green-600 mt-1">¡Disponible!</p>}
                                </div>
                                <Input
                                    label="Fecha de Nacimiento"
                                    type="date"
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                fullWidth
                                disabled={!fullName || !birthDate || !username || !usernameAvailable || isUploading}
                            >
                                Continuar <ChevronRight className="ml-2 w-4 h-4" />
                            </Button>
                        </form>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        key="preferences"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-full max-w-4xl space-y-8 pb-10"
                    >
                        <div className="text-center space-y-2">
                            <h2 className="font-serif text-3xl text-teal-dark">Tus preferencias</h2>
                            <p className="text-grey/70">Ayúdanos a recomendarte las mejores historias.</p>
                        </div>

                        {/* 1. Reader Type */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-teal-dark">¿Qué te describe mejor?</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {READER_TYPES.map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => setReaderType(type.id)}
                                        className={`
                                            flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all text-center gap-2 h-32
                                            ${readerType === type.id
                                                ? "border-teal bg-teal/5 text-teal-dark"
                                                : "border-transparent bg-white hover:border-teal/20 text-grey"
                                            }
                                        `}
                                    >
                                        <div className={`
                                            w-10 h-10 rounded-full flex items-center justify-center mb-1
                                            ${readerType === type.id ? "bg-teal text-white" : "bg-cream/30 text-teal/60"}
                                        `}>
                                            {type.icon}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm leading-tight">{type.label}</div>
                                            <div className="text-[10px] opacity-70 mt-1">{type.subLabel}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 2. Genres */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-teal-dark">¿Qué géneros te interesan? (Mín. 3)</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {GENRES.map(genre => (
                                    <button
                                        key={genre}
                                        onClick={() => toggleGenre(genre)}
                                        className={`
                                            relative p-4 rounded-xl text-left transition-all border
                                            ${favoriteGenres.includes(genre)
                                                ? "bg-teal text-white border-teal shadow-md"
                                                : "bg-white text-grey-dark border-transparent hover:border-teal/20"
                                            }
                                        `}
                                    >
                                        <span className="text-sm font-medium block pr-4">{genre}</span>
                                        {favoriteGenres.includes(genre) && (
                                            <Check className="absolute top-3 right-3 w-3 h-3 text-white/70" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 3. Goals */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-teal-dark">¿Qué buscas en Wordelia?</h3>
                            <div className="flex flex-wrap gap-2">
                                {GOALS.map(goal => (
                                    <button
                                        key={goal}
                                        onClick={() => toggleGoal(goal)}
                                        className={`
                                            px-4 py-2 rounded-full text-sm font-medium transition-all border
                                            ${goals.includes(goal)
                                                ? "bg-coral/10 border-coral text-coral"
                                                : "bg-white border-grey/10 text-grey hover:border-coral/30"
                                            }
                                        `}
                                    >
                                        {goal}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button
                                onClick={handleSubmit}
                                isLoading={loading}
                                disabled={!readerType || favoriteGenres.length < 3}
                            >
                                Finalizar y entrar <ChevronRight className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
