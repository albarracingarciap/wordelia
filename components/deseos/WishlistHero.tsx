import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function WishlistHero() {
    return (
        <section className="pt-20 pb-20 bg-[#F7F4F0] overflow-hidden">
            <div className="container mx-auto px-6 md:px-12">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

                    {/* Left Column: Copy */}
                    <div className="flex-1 max-w-2xl text-center lg:text-left">
                        <h1 className="text-5xl md:text-6xl lg:text-7xl leading-[1.1] font-[family-name:var(--font-dancing)] text-teal mb-6">
                            Nunca más <br />
                            "no sé qué regalarle"
                        </h1>

                        <p className="text-lg md:text-xl text-grey/80 mb-8 font-light leading-relaxed">
                            Organiza tus lecturas por "moods" y acierta siempre con los regalos de tus seres queridos.
                            <span className="block mt-2 font-medium text-coral">
                                Alertas de precio, listas secretas y recordatorios inteligentes.
                            </span>
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link href="/register">
                                <Button size="lg" className="px-8 bg-coral hover:bg-coral-dark text-white text-lg h-14 shadow-lg hover:shadow-xl w-full sm:w-auto whitespace-nowrap">
                                    Empieza tu lista gratis
                                </Button>
                            </Link>
                            <Link href="#demo">
                                <Button variant="outline" size="lg" className="px-8 border-teal text-teal hover:bg-teal/5 text-lg h-14 w-full sm:w-auto whitespace-nowrap">
                                    Ver cómo funciona
                                </Button>
                            </Link>
                        </div>

                        <p className="mt-6 text-sm text-grey/50">
                            ✨ No necesitas tarjeta de crédito
                        </p>
                    </div>

                    {/* Right Column: Visual Placeholder (Will be replaced by interactive demo) */}
                    <div className="flex-1 w-full relative">
                        {/* Decorative Background Blob */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-teal/5 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>

                        {/* Static visual for now */}
                        <div className="relative z-10 bg-white rounded-2xl shadow-xl p-6 border border-black/5 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                            <div className="space-y-4">
                                {/* Mockup Header */}
                                <div className="flex items-center justify-between border-b border-grey/10 pb-4">
                                    <div>
                                        <h3 className="text-xl font-serif text-teal">Cumpleaños de Clara 🎂</h3>
                                        <p className="text-xs text-grey/60">Faltan 5 días • 3 ideas guardadas</p>
                                    </div>
                                    <div className="bg-coral/10 text-coral px-3 py-1 rounded-full text-xs font-bold">
                                        SECRETO 🤫
                                    </div>
                                </div>

                                {/* Mockup Book Items */}
                                <div className="space-y-3">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="flex gap-4 p-3 bg-cream/30 rounded-lg group hover:bg-cream/50 transition-colors cursor-default">
                                            <div className="w-12 h-16 bg-grey/20 rounded shadow-sm relative overflow-hidden">
                                                {/* Placeholder for book cover */}
                                                <div className={`absolute inset-0 bg-gradient-to-br ${i === 1 ? 'from-blue-200 to-blue-400' : 'from-yellow-200 to-orange-400'}`}></div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="h-4 w-3/4 bg-grey/10 rounded mb-2"></div>
                                                <div className="h-3 w-1/2 bg-grey/5 rounded"></div>
                                            </div>
                                            <div className="self-center">
                                                <div className="w-8 h-8 rounded-full bg-white border border-grey/10 flex items-center justify-center text-grey/40">
                                                    🎁
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Notification Toast Mockup */}
                                <div className="absolute -bottom-6 -right-6 bg-white shadow-lg rounded-lg p-3 border-l-4 border-green-500 flex items-center gap-3 animate-bounce-subtle">
                                    <span className="text-xl">📉</span>
                                    <div>
                                        <p className="text-xs font-bold text-grey">¡Bajada de precio!</p>
                                        <p className="text-[10px] text-grey/60">Dune ahora cuesta 15.90€</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
