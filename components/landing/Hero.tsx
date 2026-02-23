import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";
import { Section } from "../ui/Section";
import { getRegisteredUsersCount } from "@/app/actions";

export async function Hero() {
    const rawCount = await getRegisteredUsersCount();
    const baseCount = 120;
    const currentUsers = baseCount + rawCount;
    const maxUsers = 500;
    const percentage = Math.min((currentUsers / maxUsers) * 100, 100);

    return (
        <Section className="pt-24 pb-12 md:pt-32 md:pb-20 bg-[#D8E2DC]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                {/* Left Column: Text & Actions */}
                <div className="flex flex-col space-y-8 max-w-[600px]">
                    <div className="inline-flex">
                        <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 select-none bg-[#D56962] text-white shadow-[0_0_15px_rgba(213,105,98,0.4)] animate-pulse-slow">
                            🔥 Acceso Anticipado (Beta)
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl leading-[1.1] md:leading-[1.15] font-[family-name:var(--font-dancing)] text-teal tracking-normal">
                        Donde las palabras importan… <br className="hidden md:block" />
                        y donde cada libro merece su tiempo
                    </h1>

                    <p className="text-sm md:text-base text-grey leading-relaxed max-w-lg">
                        Wordelia es el hogar de quienes buscan profundidad en cada página.
                        Únete a los <b>lectores fundadores</b> y disfruta de seguimiento, clubs exclusivos y análisis literario sin interrupciones.
                    </p>

                    <div className="bg-white/40 border border-teal/10 rounded-2xl p-4 max-w-sm backdrop-blur-sm">
                        <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-teal-dark mb-2">
                            <span>Plazas fundadores</span>
                            <span>{currentUsers} / {maxUsers}</span>
                        </div>
                        <div className="w-full bg-teal/10 rounded-full h-2.5 overflow-hidden">
                            <div className="bg-coral h-2.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${percentage}%` }}></div>
                        </div>
                        <p className="text-[11px] text-grey/60 mt-3 text-center border-t border-teal/5 pt-2">
                            Asegura tu invitación antes de la apertura pública el <b>1 de abril</b>.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        <Link href="/register">
                            <Button size="lg" className="px-8 shadow-coral/20 w-full sm:w-auto">
                                Regístrate
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button variant="secondary" size="lg" className="px-8 hover:bg-white hover:text-teal hover:border-white transition-all w-full sm:w-auto">
                                Entrar
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Right Column: Visual */}
                <div className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square max-w-[600px] mx-auto">
                    {/* Abstract colorful background or illustration */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-teal/10 to-coral/10 blur-3xl opacity-60"></div>
                    <Image
                        src="/assets/images/hero_background.png"
                        alt="Lectores disfrutando de Wordelia"
                        fill
                        className="object-contain animate-fade-in"
                        priority
                    />
                </div>

            </div>
        </Section>
    );
}
