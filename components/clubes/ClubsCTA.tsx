import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { CheckCircle2 } from "lucide-react";

export function ClubsCTA() {
    return (
        <div className="bg-gradient-to-br from-grey/5 to-teal/5 rounded-3xl p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-serif text-grey mb-4">
                ¿Listo para unirte a la conversación?
            </h2>
            <p className="text-lg text-grey/70 mb-8 max-w-2xl mx-auto">
                Todos nuestros clubs oficiales comienzan el 15 de marzo. Regístrate hoy y prepárate para una
                experiencia de lectura transformadora.
            </p>

            {/* Features */}
            <div className="grid sm:grid-cols-3 gap-6 mb-8 max-w-3xl mx-auto">
                <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-teal" />
                    <p className="text-sm text-grey/70">
                        Guías profesionales de discusión
                    </p>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-teal" />
                    <p className="text-sm text-grey/70">
                        Mapas emocionales detallados
                    </p>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-teal" />
                    <p className="text-sm text-grey/70">
                        Comunidad activa de lectores
                    </p>
                </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/register">
                    <Button
                        size="lg"
                        className="bg-teal hover:bg-teal-dark text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                        Crear cuenta gratis
                    </Button>
                </Link>
                <Link href="/app/adn">
                    <Button
                        size="lg"
                        variant="outline"
                        className="border-2 border-teal/30 text-teal hover:bg-teal/5"
                    >
                        Demo ADN literario
                    </Button>
                </Link>
            </div>

            <p className="text-xs text-grey/50 mt-6">
                Sin tarjeta de crédito • Acceso instantáneo • Cancela cuando quieras
            </p>
        </div>
    );
}
