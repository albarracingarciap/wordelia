import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Section } from "@/components/ui/Section";

export default function DemoPage() {
    return (
        <main className="min-h-screen bg-cream">
            <Navbar />
            
            <div className="pt-24 pb-20">
                <Section>
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <div className="space-y-4">
                            <h1 className="text-4xl md:text-5xl font-serif text-teal">
                                Descubre Wordelia
                            </h1>
                            <p className="text-lg text-grey/80 max-w-2xl mx-auto leading-relaxed">
                                Explora cómo transformamos la lectura solitaria en una experiencia compartida.
                            </p>
                        </div>

                        {/* Video Placeholder */}
                        <div className="relative aspect-video w-full bg-black/5 rounded-2xl border border-teal/10 overflow-hidden flex items-center justify-center">
                            <div className="text-center text-grey/40">
                                <span className="block text-4xl mb-2">▶</span>
                                <span className="text-sm uppercase tracking-widest font-bold">Video Demo Próximamente</span>
                            </div>
                        </div>

                        <div className="p-8 bg-white rounded-2xl border border-teal/10 shadow-sm text-left">
                            <h3 className="text-xl font-bold text-teal mb-4">Lo que verás en la demo:</h3>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    "Creación de clubes de lectura personalizados",
                                    "Seguimiento por checkpoints sin spoilers",
                                    "Análisis de ADN literario con IA",
                                    "Mapas emocionales de tus historias favoritas"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-grey/80">
                                        <span className="text-coral mt-1">✓</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </Section>
            </div>

            <Footer />
        </main>
    );
}
