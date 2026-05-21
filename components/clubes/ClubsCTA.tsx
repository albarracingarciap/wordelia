import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { CheckCircle2 } from "lucide-react";

export function ClubsCTA() {
    return (
        <div className="rounded-3xl bg-gradient-to-br from-grey/5 to-teal/5 p-8 text-center md:p-12">
            <h2 className="mb-4 text-3xl text-teal md:text-4xl">
                ¿Listo para unirte a la conversación?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-grey/70">
                Todos nuestros clubs de lectura Wordelia Originals comienzan en las próximas semanas.
                Regístrate hoy y prepárate para una experiencia de lectura transformadora.
            </p>

            <div className="mx-auto mb-8 grid max-w-3xl gap-6 sm:grid-cols-3">
                <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="h-6 w-6 text-teal" />
                    <p className="text-sm text-grey/70">
                        Guías profesionales de discusión
                    </p>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="h-6 w-6 text-teal" />
                    <p className="text-sm text-grey/70">
                        Mapas emocionales detallados
                    </p>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="h-6 w-6 text-teal" />
                    <p className="text-sm text-grey/70">
                        Comunidad activa de lectores
                    </p>
                </div>
            </div>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link href="/register">
                    <Button
                        size="lg"
                        className="bg-teal font-semibold text-white shadow-lg transition-all hover:bg-teal-dark hover:shadow-xl"
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

            <p className="mt-6 text-xs text-grey/50">
                Sin tarjeta de crédito · Acceso instantáneo · Cancela cuando quieras
            </p>
        </div>
    );
}
