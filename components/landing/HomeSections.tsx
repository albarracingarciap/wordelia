import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Award, EyeOff, Gauge, Gift, Library, MessageSquareHeart, Search, Sparkles } from "lucide-react";
import { Section } from "../ui/Section";

const experienceCategories = [
    "No apto para leer antes de dormir",
    "Para perderse en otro mundo",
    "Libros que dejan resaca emocional",
    "Para subrayar sin prisa",
    "Cuando quieres una trama adictiva",
    "Historias que abrazan",
    "Universos con mapa mental",
    "Para leer con el corazón encogido",
    "Libros que se leen como un secreto",
    "Para conversaciones largas",
    "Cuando necesitas belleza en cada frase",
    "Más experiencias",
];

const dnaMetrics = [
    { label: "Tensión narrativa", value: "78%" },
    { label: "Densidad conceptual", value: "64%" },
    { label: "Carga emocional", value: "71%" },
    { label: "Accesibilidad", value: "82%" },
];

const giftLists = [
    {
        title: "Libros que quiero en mi lista de deseos",
        description: "Una lista compartible para cumpleaños, Navidad o cualquier ocasión.",
        icon: Gift,
    },
    {
        title: "Ideas secretas para regalar",
        description: "Lista de regalos para tus seres queridos. Sin arruinar la sorpresa.",
        icon: EyeOff,
    },
    {
        title: "Mensajes sorpresa",
        description: "Envía una dedicatoria especial que solo se revelará cuando reciban el regalo. Magia pura y emoción garantizada.",
        icon: MessageSquareHeart,
    },
];

export function HomeExploreSection() {
    return (
        <Section id="explorar" className="bg-cream py-12 md:py-18">
            <div className="mx-auto mb-8 max-w-4xl space-y-4 text-center md:mb-10">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-coral">Explorar</p>
                <h2 className="text-3xl leading-tight text-teal md:text-5xl">
                    Búsquedas basadas en experiencias, no en categorías
                </h2>
                <p className="mx-auto max-w-2xl text-base leading-relaxed text-grey md:text-lg">
                    Busca por título, autor o ISBN, o empieza por una experiencia de lectura.
                </p>
            </div>

            <form
                action="/app/search"
                className="mx-auto mb-10 grid max-w-5xl gap-3 rounded-2xl border border-teal/10 bg-white p-3 shadow-sm md:grid-cols-[1fr_auto_auto] md:p-4"
            >
                <div className="flex min-h-14 items-center gap-3 rounded-xl bg-cream px-4 text-grey">
                    <Search className="h-5 w-5 text-teal" aria-hidden="true" />
                    <input
                        type="search"
                        name="q"
                        required
                        placeholder="Buscar por ISBN, título, autora o autor"
                        className="min-w-0 flex-1 bg-transparent text-sm text-teal-dark outline-none placeholder:text-grey md:text-base"
                    />
                </div>
                <button
                    type="submit"
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-teal/20 px-6 font-semibold text-teal transition-colors hover:bg-teal hover:text-white"
                >
                    Buscar
                    <Search className="h-4 w-4" aria-hidden="true" />
                </button>
                <Link
                    href="/explorar"
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-teal px-6 font-semibold text-white transition-colors hover:bg-teal-dark"
                >
                    Explorar libros
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
            </form>

            <div className="mx-auto max-w-5xl rounded-3xl border border-teal/10 bg-offwhite p-5 shadow-sm md:p-7">
                <div className="grid gap-x-10 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                    {experienceCategories.map((category) => (
                        <Link
                            key={category}
                            href="/explorar"
                            className="group inline-flex items-center justify-between gap-3 border-b border-teal/10 py-2 text-left text-sm font-medium text-teal-dark transition-colors last:border-b-0 hover:text-coral sm:last:border-b sm:[&:nth-last-child(-n+2)]:border-b-0 lg:[&:nth-last-child(-n+3)]:border-b-0"
                        >
                            <span>{category}</span>
                            <ArrowRight
                                className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100"
                                aria-hidden="true"
                            />
                        </Link>
                    ))}
                </div>
            </div>
        </Section>
    );
}

export function HomeAdnSection() {
    return (
        <Section id="adn-literario" className="bg-cream py-16 md:py-24">
            <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
                <div className="space-y-5">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-coral">ADN literario</p>
                    <h2 className="text-3xl leading-tight text-teal md:text-5xl">
                        ¿Amor a primera vista?
                    </h2>
                    <p className="text-base leading-relaxed text-grey md:text-lg">
                        Cada ficha puede ayudarte a comprender mejor la obra: ritmo, temas, estilo, dificultad
                        y carga emocional.
                    </p>
                    <Link
                        href="/register?source=beta&intent=adn"
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-coral px-6 font-semibold text-coral transition-colors hover:bg-coral hover:text-white"
                    >
                        Probar en beta
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                </div>

                <div className="rounded-3xl border border-teal/10 bg-white p-5 shadow-sm md:p-7">
                    <div className="mb-6 flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-coral">Vista previa</p>
                            <h3 className="mt-1 text-2xl font-semibold text-teal">El mundo de Sofía</h3>
                            <p className="text-sm text-grey">Jostein Gaarder</p>
                        </div>
                        <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md shadow-sm">
                            <Image
                                src="/assets/images/portada_sofia.png"
                                alt="Portada de El mundo de Sofía"
                                fill
                                className="object-cover"
                                sizes="44px"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {dnaMetrics.map((metric) => (
                            <div key={metric.label}>
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span className="font-semibold text-teal-dark">{metric.label}</span>
                                    <span className="text-grey">{metric.value}</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-teal/10">
                                    <div className="h-full rounded-full bg-coral" style={{ width: metric.value }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-cream p-4">
                            <Gauge className="mb-3 h-5 w-5 text-teal" aria-hidden="true" />
                            <p className="text-sm font-semibold text-teal-dark">Ideal si buscas</p>
                            <p className="mt-1 text-sm text-grey">Ideas grandes contadas con claridad narrativa.</p>
                        </div>
                        <div className="rounded-2xl bg-cream p-4">
                            <Library className="mb-3 h-5 w-5 text-teal" aria-hidden="true" />
                            <p className="text-sm font-semibold text-teal-dark">Quizá no si buscas</p>
                            <p className="mt-1 text-sm text-grey">Acción constante o una trama puramente rápida.</p>
                        </div>
                    </div>
                </div>
            </div>
        </Section>
    );
}

export function HomeWishlistSection() {
    return (
        <Section id="lista-deseos" className="bg-[#D8E2DC] py-16 md:py-24">
            <div className="grid gap-8 md:grid-cols-[1fr_0.9fr] md:items-center">
                <div className="space-y-5">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-coral">Lista de deseos</p>
                    <h2 className="text-3xl leading-tight text-teal md:text-5xl">
                        Libros. El arte de obsequiar y el placer de recibir
                    </h2>
                    <p className="text-base leading-relaxed text-grey md:text-lg">
                        Wordelia transforma cómo gestionas los regalos. Sin hojas de cálculo, sin notas dispersas
                        y sin perder la magia de la sorpresa.
                    </p>
                    <Link
                        href="/register?source=wishlist"
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-teal px-6 font-semibold text-white transition-colors hover:bg-teal-dark"
                    >
                        Probar lista de deseos
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                </div>

                <div className="grid gap-3">
                    {giftLists.map((item) => (
                        <article key={item.title} className="flex items-center gap-4 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-coral/10 text-coral">
                                <item.icon className="h-5 w-5" aria-hidden="true" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-teal-dark">{item.title}</h3>
                                <p className="text-sm text-grey">{item.description}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </Section>
    );
}

export function HomeBetaSection() {
    return (
        <Section id="beta" className="bg-cream py-16 md:py-24">
            <div className="overflow-hidden rounded-3xl bg-teal p-7 text-white shadow-xl md:p-10">
                <div className="grid gap-8 md:grid-cols-[1fr_320px] md:items-center">
                    <div className="max-w-3xl">
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cream">Beta privada</p>
                        <h2 className="mt-3 text-3xl leading-tight text-white md:text-5xl">
                            Ayúdanos a construir una forma más precisa de elegir lecturas
                        </h2>
                        <p className="mt-4 text-base leading-relaxed text-white/85 md:text-lg">
                            Estamos abriendo Wordelia a lectores fundadores para pulir detallitos. Prueba nuestras
                            búsquedas, clubs, análisis literario y listas de deseos antes del lanzamiento público el
                            15 de julio.
                        </p>
                        <div className="mt-6 inline-flex max-w-xl items-start gap-3 rounded-2xl border border-white/15 bg-white/10 p-4">
                            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-cream" aria-hidden="true" />
                            <p className="text-sm leading-relaxed text-white/90">
                                Los lectores fundadores ganarán la insignia <strong>Miembro Fundador</strong>,
                                con la que podrán acceder a ventajas futuras en el mundo de Wordelia.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-5 rounded-3xl border border-white/15 bg-white/10 p-6 text-center">
                        <div className="flex h-28 w-28 items-center justify-center rounded-full border border-cream/40 bg-cream/15 text-cream shadow-lg">
                            <Award className="h-14 w-14" aria-hidden="true" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cream">Insignia</p>
                            <h3 className="mt-1 text-2xl font-semibold !text-cream">Miembro Fundador</h3>
                        </div>
                        <Link
                            href="/register?source=beta"
                            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-coral px-8 text-lg font-semibold text-white shadow-sm shadow-coral/20 transition-all hover:bg-[#C25852]"
                        >
                            Solicitar acceso
                            <ArrowRight className="h-5 w-5" aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            </div>
        </Section>
    );
}
