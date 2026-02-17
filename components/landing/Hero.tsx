import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";
import { Section } from "../ui/Section";

export function Hero() {
    return (
        <Section className="pt-24 pb-12 md:pt-32 md:pb-20 bg-[#D8E2DC]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                {/* Left Column: Text & Actions */}
                <div className="flex flex-col space-y-8 max-w-[600px]">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl leading-[1.1] md:leading-[1.15] font-[family-name:var(--font-dancing)] text-teal tracking-normal">
                        Donde las palabras importan… <br className="hidden md:block" />
                        y donde cada libro merece su tiempo
                    </h1>

                    <p className="text-sm md:text-base text-grey leading-relaxed max-w-lg">
                        Lee a tu ritmo, guarda tus momentos y comparte la historia con gente que también la vive.
                        Seguimiento, clubs y guías sin spoilers para conversar mejor.
                    </p>

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
