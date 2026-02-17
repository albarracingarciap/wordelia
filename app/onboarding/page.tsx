"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
    Camera,
    BookOpen,
    Book,
    Sparkles,
    Sprout,
    GraduationCap,
    Users,
    ChevronRight,
    Check,
    Search
} from "lucide-react";

// Types
type OnboardingStep = 1 | 2;

type ReaderType = "occasional" | "regular" | "avid" | "beginner" | "educator" | "organizer";

interface UserProfile {
    fullName: string;
    birthDate: string;
    photoUrl: string | null;
    readerType: ReaderType | null;
    favoriteGenres: string[];
    goals: string[];
}

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
    const router = useRouter();
    const [step, setStep] = React.useState<OnboardingStep>(1);
    const [profile, setProfile] = React.useState<UserProfile>({
        fullName: "",
        birthDate: "",
        photoUrl: null,
        readerType: null,
        favoriteGenres: [],
        goals: [],
    });
    const [otherGenre, setOtherGenre] = React.useState("");

    // Simplified for demo - in real app, fetch user data if social login
    // React.useEffect(() => { ... }, []);

    const handleNext = () => {
        if (step === 1) {
            if (!profile.fullName || !profile.birthDate) return; // Simple validation
            setStep(2);
        } else {
            // Submit
            console.log("Submitting profile:", profile);
            router.push("/app/mi-lectura");
        }
    };

    const toggleGenre = (genre: string) => {
        setProfile(prev => {
            if (prev.favoriteGenres.includes(genre)) {
                return { ...prev, favoriteGenres: prev.favoriteGenres.filter(g => g !== genre) };
            } else {
                if (prev.favoriteGenres.length >= 10) return prev;
                return { ...prev, favoriteGenres: [...prev.favoriteGenres, genre] };
            }
        });
    };

    const toggleGoal = (goal: string) => {
        setProfile(prev => {
            if (prev.goals.includes(goal)) {
                return { ...prev, goals: prev.goals.filter(g => g !== goal) };
            } else {
                return { ...prev, goals: [...prev.goals, goal] };
            }
        });
    };

    const handlePhotoUpload = () => {
        // Mock upload
        setProfile(prev => ({ ...prev, photoUrl: "/assets/images/user-placeholder.png" })); // Should be a real asset or blob
    };

    return (
        <div className="min-h-screen bg-cream/10 flex flex-col">
            {/* Header / Progress */}
            <header className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-teal text-white flex items-center justify-center font-bold text-sm">
                        {step}
                    </div>
                    <span className="text-sm font-medium text-grey/60 uppercase tracking-widest">
                        Paso {step} de 2
                    </span>
                </div>
                <Link href="/" className="opacity-50 hover:opacity-100 transition-opacity">
                    <Image
                        src="/assets/images/logo_wordelia.png"
                        alt="Wordelia"
                        width={150}
                        height={40}
                        className="object-contain"
                    />
                </Link>
            </header>

            <main className="flex-1 flex flex-col items-center justify-start pt-4 pb-12 px-6 md:px-12 max-w-4xl mx-auto w-full">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="w-full max-w-md space-y-6"
                        >
                            <div className="text-center space-y-2">
                                <h1 className="font-serif text-3xl md:text-4xl text-teal-dark">
                                    ¡Hola! Vamos a conocerte
                                </h1>
                                <p className="text-grey/70">Cuéntanos un poco sobre ti para personalizar tu experiencia.</p>
                            </div>

                            <div className="space-y-6 bg-white p-8 rounded-3xl shadow-sm border border-teal/5">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative group cursor-pointer" onClick={handlePhotoUpload}>
                                        <div className={`w-24 h-24 rounded-full flex items-center justify-center border-2 border-dashed border-teal/30 hover:border-teal transition-colors overflow-hidden ${profile.photoUrl ? "bg-white" : "bg-cream/20"}`}>
                                            {profile.photoUrl ? (
                                                <img src={profile.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <Camera className="w-8 h-8 text-teal/40" />
                                            )}
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xs font-medium opacity-0 group-hover:opacity-100 rounded-full transition-opacity">
                                            Cambiar
                                        </div>
                                    </div>
                                    <span className="text-sm text-grey/60">Foto de perfil (opcional)</span>
                                </div>

                                <div className="space-y-4">
                                    <Input
                                        id="fullName"
                                        label="Nombre Completo"
                                        placeholder="Tu nombre"
                                        value={profile.fullName}
                                        onChange={e => setProfile({ ...profile, fullName: e.target.value })}
                                        required
                                    />
                                    <Input
                                        id="birthDate"
                                        label="Fecha de Nacimiento"
                                        type="date"
                                        value={profile.birthDate}
                                        onChange={e => setProfile({ ...profile, birthDate: e.target.value })}
                                        required
                                    />
                                </div>

                                <Button
                                    fullWidth
                                    onClick={handleNext}
                                    disabled={!profile.fullName || !profile.birthDate}
                                >
                                    Continuar <ChevronRight className="ml-2 w-4 h-4" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full space-y-10"
                        >
                            <div className="text-center space-y-2">
                                <h1 className="font-serif text-3xl md:text-4xl text-teal-dark">
                                    Tus preferencias lectoras
                                </h1>
                                <p className="text-grey/70">Ayúdanos a recomendarte las mejores historias.</p>
                            </div>

                            {/* Section A: Reader Type */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold text-teal-dark flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-coral text-white text-xs flex items-center justify-center">1</span>
                                    ¿Qué te describe mejor?
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {READER_TYPES.map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => setProfile({ ...profile, readerType: type.id })}
                                            className={`
                                                flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all text-center gap-2 h-32
                                                ${profile.readerType === type.id
                                                    ? "border-teal bg-teal/5 text-teal-dark"
                                                    : "border-transparent bg-white hover:border-teal/20 text-grey"
                                                }
                                            `}
                                        >
                                            <div className={`
                                                w-10 h-10 rounded-full flex items-center justify-center mb-1
                                                ${profile.readerType === type.id ? "bg-teal text-white" : "bg-cream/30 text-teal/60"}
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

                            {/* Section B: Genres */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-teal-dark flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-coral text-white text-xs flex items-center justify-center">2</span>
                                        ¿Qué géneros te interesan?
                                    </h2>
                                    <span className={`text-xs font-medium ${profile.favoriteGenres.length >= 3 ? "text-teal" : "text-coral"}`}>
                                        Seleccionados: {profile.favoriteGenres.length} (Mín. 3)
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {GENRES.map(genre => (
                                        <button
                                            key={genre}
                                            onClick={() => toggleGenre(genre)}
                                            className={`
                                                relative p-4 rounded-xl text-left transition-all border
                                                ${profile.favoriteGenres.includes(genre)
                                                    ? "bg-teal text-white border-teal shadow-md transform scale-[1.02]"
                                                    : "bg-white text-grey-dark border-transparent hover:border-teal/20"
                                                }
                                            `}
                                        >
                                            <span className="text-sm font-medium block pr-4">{genre}</span>
                                            {profile.favoriteGenres.includes(genre) && (
                                                <Check className="absolute top-3 right-3 w-3 h-3 text-white/70" />
                                            )}
                                        </button>
                                    ))}
                                    <div className="col-span-2 sm:col-span-1 md:col-span-1 relative">
                                        <input
                                            type="text"
                                            placeholder="Otros..."
                                            value={otherGenre}
                                            onChange={(e) => setOtherGenre(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && otherGenre) {
                                                    toggleGenre(otherGenre);
                                                    setOtherGenre("");
                                                }
                                            }}
                                            className="w-full h-full min-h-[56px] px-4 rounded-xl border border-dashed border-grey/30 bg-transparent text-sm focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section C: Goals */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold text-teal-dark flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-coral text-white text-xs flex items-center justify-center">3</span>
                                    ¿Qué buscas en Wordelia?
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {GOALS.map(goal => (
                                        <button
                                            key={goal}
                                            onClick={() => toggleGoal(goal)}
                                            className={`
                                                px-4 py-2 rounded-full text-sm font-medium transition-all border
                                                ${profile.goals.includes(goal)
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

                            <div className="pt-8 flex justify-end">
                                <Button
                                    size="lg"
                                    onClick={handleNext}
                                    disabled={
                                        !profile.readerType ||
                                        profile.favoriteGenres.length < 3
                                    }
                                    className="animate-fade-in"
                                >
                                    ¡Comenzamos!
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
