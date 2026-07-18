import Link from "next/link";
import Image from "next/image";
import { Award, BookOpen, EyeOff, Gauge, Gift, HeartHandshake, Leaf, Library, MessageSquareHeart, Sparkles, StickyNote } from "lucide-react";
import { Section } from "../ui/Section";

const dnaMetrics = [
    { label: "Tensión narrativa", value: "88%" },
    { label: "Densidad conceptual", value: "84%" },
    { label: "Carga emocional", value: "92%" },
    { label: "Accesibilidad", value: "46%" },
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

const readerFeatures = [
    {
        title: "Sigue tu lectura",
        description: "Sesiones, páginas y tu racha. Continúa donde lo dejaste, a tu ritmo y sin presión.",
        icon: BookOpen,
    },
    {
        title: "Guarda tus momentos",
        description: "Citas, fragmentos y pensamientos que se convierten en tu colección personal.",
        icon: StickyNote,
    },
    {
        title: "Marca lo que sentiste",
        description: "Registra la emoción de cada libro y vuelve a sentirla cuando quieras revivirlo.",
        icon: HeartHandshake,
    },
    {
        title: "Tu progreso, en calma",
        description: "Estadísticas pensadas solo para ti. Sin rankings ni comparaciones. Solo tú.",
        icon: Leaf,
    },
];

export function HomeReaderSection() {
    return (
        <Section id="para-ti" className="bg-cream py-12 md:py-18">
            <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
                <div className="space-y-5">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-coral">Tu lectura, contigo</p>
                    <h2 className="text-3xl leading-tight text-teal md:text-5xl">
                        No solo dónde lo dejaste. También cómo te hizo sentir.
                    </h2>
                    <p className="text-base leading-relaxed text-grey md:text-lg">
                        Wordelia no es solo para clubs. Es tu rincón privado para acompañar cada lectura: tu ritmo,
                        tus subrayados y tus emociones, guardados como tú los vives.
                    </p>
                    <Link
                        href="/register?source=reader"
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-teal px-6 font-semibold text-white transition-colors hover:bg-teal-dark"
                    >
                        Empieza tu rincón de lectura
                    </Link>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    {readerFeatures.map((feature) => (
                        <article
                            key={feature.title}
                            className="flex h-full flex-col gap-3 rounded-2xl border border-teal/10 bg-white p-5 shadow-sm"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-coral/10 text-coral">
                                <feature.icon className="h-5 w-5" aria-hidden="true" />
                            </div>
                            <h3 className="font-semibold text-teal-dark">{feature.title}</h3>
                            <p className="text-sm leading-relaxed text-grey">{feature.description}</p>
                        </article>
                    ))}
                </div>
            </div>
        </Section>
    );
}

export function HomeAdnSection() {
    return (
        <Section id="adn-literario" className="bg-cream pb-16 pt-8 md:pb-24 md:pt-10">
            <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
                <div className="space-y-5">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-coral">Genoma literario</p>
                    <h2 className="text-3xl leading-tight text-teal md:text-5xl">
                        ¿Amor a primera vista?
                    </h2>
                    <p className="text-base leading-relaxed text-grey md:text-lg">
                        Cada ficha puede ayudarte a comprender mejor la obra: ritmo, temas, estilo, dificultad
                        y carga emocional.
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Link
                            href="/demo-adn"
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-coral px-6 font-semibold text-white transition-colors hover:bg-[#C25852]"
                        >
                            Muestra gratuita
                        </Link>
                        <Link
                            href="/genomas"
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-teal/20 px-6 font-semibold text-teal transition-colors hover:bg-teal hover:text-white"
                        >
                            Ver todos los genomas
                        </Link>
                    </div>
                </div>

                <div className="rounded-3xl border border-teal/10 bg-white p-5 shadow-sm md:p-7">
                    <div className="mb-6 flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-coral">Vista previa</p>
                            <h3 className="mt-1 text-2xl font-semibold text-teal">El túnel</h3>
                            <p className="text-sm text-grey">Ernesto Sábato</p>
                        </div>
                        <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md shadow-sm">
                            <Image
                                src="/assets/images/el_tunel_sabato.jpg"
                                alt="Portada de El túnel"
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
                            <p className="mt-1 text-sm text-grey">Una inmersión psicológica intensa en la obsesión y la soledad.</p>
                        </div>
                        <div className="rounded-2xl bg-cream p-4">
                            <Library className="mb-3 h-5 w-5 text-teal" aria-hidden="true" />
                            <p className="text-sm font-semibold text-teal-dark">Quizá no si buscas</p>
                            <p className="mt-1 text-sm text-grey">Una lectura luminosa, ligera o de ritmo trepidante.</p>
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
                <div className="grid gap-8 md:grid-cols-[1fr_320px] md:items-stretch">
                    <div className="flex h-full max-w-3xl flex-col">
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cream">Wordelia Fundadores</p>
                        <h2 className="mt-3 text-3xl leading-tight !text-white md:text-5xl">
                            Sé de los primeros en vivir Wordelia
                        </h2>
                        <p className="mt-4 text-base leading-relaxed text-white/85 md:text-lg">
                            Estamos abriendo Wordelia a lectores fundadores. Explora nuestras búsquedas, clubs,
                            análisis literario y listas de deseos, y consigue tu insignia de Miembro Fundador antes
                            del 1 de septiembre. Lanzamiento público el 2 de agosto.
                        </p>
                        <div className="mt-6 md:mt-auto md:pt-8">
                            <div className="flex max-w-xl items-start gap-3 rounded-2xl border border-white/15 bg-white/10 p-4">
                                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-cream" aria-hidden="true" />
                                <p className="text-sm leading-relaxed text-white/90">
                                    Los lectores fundadores ganarán la insignia <strong>Miembro Fundador</strong>,
                                    con la que podrán acceder a ventajas futuras en el mundo de Wordelia.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-5 rounded-3xl border border-white/15 bg-white/10 p-6 text-center">
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
                            Empezar
                        </Link>
                    </div>
                </div>
            </div>
        </Section>
    );
}
