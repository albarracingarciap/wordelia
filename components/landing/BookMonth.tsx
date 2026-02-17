"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { Section } from "../ui/Section";
import { Button } from "../ui/Button";

export function BookMonth() {
    const { isLoggedIn } = useAuth();
    const router = useRouter();

    const handleJoinClick = () => {
        if (isLoggedIn) {
            router.push("/club/el-cuento-de-la-criada");
        } else {
            router.push("/login");
        }
    };

    return (
        <Section id="libro-del-mes">
            <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="text-3xl md:text-4xl font-serif text-teal mb-3">
                    Libro del mes
                </h2>
                <p className="text-sm md:text-base text-grey leading-relaxed">
                    Lecturas compartidas. Un club abierto para discusiones amenas, profundas y sin spoilers
                </p>
            </div>

            {/* Main Feature Panel */}
            <div className="bg-offwhite rounded-[20px] border border-teal/10 shadow-sm p-6 md:p-10 lg:p-12 mb-12">
                <div className="flex flex-col md:flex-row gap-12 items-start">

                    {/* Left: Book Cover */}
                    <div className="relative w-40 md:w-48 aspect-[2/3] shrink-0 rounded-lg shadow-md overflow-hidden self-center md:self-start">
                        <Image
                            src="/assets/images/cuento_criada.gif"
                            alt="El Cuento de la Criada"
                            fill
                            className="object-cover"
                        />
                    </div>

                    {/* Right: Content */}
                    <div className="flex-1 space-y-6">
                        <div>
                            <h3 className="text-2xl md:text-3xl font-serif text-teal leading-tight">
                                El Cuento de la Criada
                            </h3>
                            <p className="text-lg text-coral font-medium mt-1">
                                <Link href="/autores/margaret-atwood" className="hover:underline">
                                    Margaret Atwood
                                </Link>
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {["Distopía", "Debate", "Lectura media"].map(tag => (
                                <span key={tag} className="px-3 py-1 bg-white border border-black/5 rounded-full text-xs font-medium text-grey">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <p className="text-sm text-grey leading-relaxed max-w-3xl">
                            La obra maestra de Margaret Atwood nos sumerge en un futuro distópico aterradoramente plausible, donde la degradación ambiental y un golpe teocrático han transformado Estados Unidos en un régimen totalitario que esclaviza a las mujeres en nombre de la "pureza moral".<br /><br />
                            Con una narrativa íntima y descarnada que explora los límites de la supervivencia humana. "El cuento de la criada" trasciende el tiempo para convertirse en una advertencia urgente sobre los riesgos del extremismo y la supresión de libertades.
                        </p>

                        <div className="flex items-center gap-4 text-sm text-teal font-medium">
                            <span className="flex items-center gap-1">📅 Próxima reunión: 28 de Febrero</span>
                            <span className="flex items-center gap-1">👤 Moderador: Ana R.</span>
                        </div>

                        {/* DNA Card (Moved here) */}
                        <div className="bg-white/80 rounded-xl p-6 border border-teal/10 mt-6 max-w-2xl">
                            <h4 className="text-sm font-bold text-teal uppercase tracking-wide mb-4">
                                ADN del libro (Vista previa)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ul className="space-y-3">
                                    {[
                                        { label: "Temas", val: "Poder, Identidad, Resistencia" },
                                        { label: "Tono", val: "Inquietante, Íntimo" },
                                        { label: "Complejidad", val: "Accesible" }
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm">
                                            <span className="w-1.5 h-1.5 rounded-full bg-coral mt-1.5 shrink-0" />
                                            <span className="text-grey">
                                                <strong className="text-teal-dark">{item.label}:</strong> {item.val}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                {/* Reading Pace Mini Viz */}
                                <div className="bg-cream/50 rounded-lg p-4 border border-teal/5 text-center flex flex-col justify-center">
                                    <div className="flex justify-between text-[10px] text-teal/60 mb-1 font-medium px-1">
                                        <span>Pausado</span>
                                        <span>Frenético</span>
                                    </div>
                                    <div className="h-2 w-full bg-teal/10 rounded-full relative overflow-hidden">
                                        <div className="absolute top-0 left-0 h-full bg-coral w-[70%]" />
                                    </div>
                                    <span className="text-[10px] text-teal font-medium uppercase tracking-wider block mt-2">
                                        Ritmo de lectura
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-grey/20 border-2 border-offwhite" />
                                ))}
                            </div>
                            <span className="text-xs text-grey font-medium pl-1">Ya hay 248 lectores</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-center gap-6">
                <Button
                    size="lg"
                    className="px-10 shadow-coral/20"
                    onClick={handleJoinClick}
                >
                    Unirme al club del mes
                </Button>
                <div className="flex gap-6 text-sm font-medium text-teal">
                    <Link href="/libros/el-cuento-de-la-criada" className="hover:underline">Ver ADN completo</Link>
                    <Link href="/libros/el-cuento-de-la-criada/guia" className="hover:underline">Ver guía de discusión</Link>
                </div>
            </div>
        </Section>
    );
}
