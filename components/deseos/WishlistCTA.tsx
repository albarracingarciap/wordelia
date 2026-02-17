import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function WishlistCTA() {
    return (
        <section className="pt-20 pb-32 bg-white border-t border-grey/5">
            <div className="container mx-auto px-6 md:px-12 text-center">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-[family-name:var(--font-dancing)] text-teal mb-6">
                        Tus deseos, tus reglas, tus regalos
                    </h2>
                    <p className="text-lg text-grey/80 mb-10 leading-relaxed font-light">
                        Únete a Wordelia y descubre la forma más bonita de organizar tu vida lectora.
                        Comparte tu lista con quien quieras (o guárdala solo para ti).
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/register">
                            <Button size="lg" className="px-10 py-6 text-lg bg-coral hover:bg-coral-dark text-white shadow-xl hover:shadow-2xl transition-all w-full sm:w-auto">
                                Crear mi lista gratis
                            </Button>
                        </Link>
                    </div>

                    <p className="mt-8 text-sm text-grey/40">
                        Únete a más de 5,000 lectores que ya no pierden sus libros.
                    </p>
                </div>
            </div>
        </section>
    );
}
