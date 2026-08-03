import Link from "next/link";
import Image from "next/image";
import { AlertTriangle } from "lucide-react";

export default function AuthCodeErrorPage() {
    return (
        <div className="flex min-h-[100svh] flex-col items-center justify-center bg-cream px-5 py-10">
            <Link href="/" className="mb-8 flex items-center justify-center">
                <Image
                    src="/assets/images/logo_wordelia.png"
                    alt="Wordelia"
                    width={220}
                    height={60}
                    className="h-auto w-44 object-contain"
                    priority
                />
            </Link>

            <div className="w-full max-w-md rounded-2xl border border-teal/10 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-coral/10 text-coral">
                    <AlertTriangle className="h-8 w-8" />
                </div>

                <h1 className="font-serif text-2xl font-bold text-teal-dark">El enlace no es válido</h1>
                <p className="mt-3 text-sm leading-relaxed text-grey/70">
                    Este enlace de confirmación ha caducado o ya se ha usado. Vuelve a iniciar sesión; si aún no has
                    confirmado tu cuenta, podrás pedir un nuevo correo.
                </p>

                <div className="mt-6 space-y-3">
                    <Link
                        href="/login"
                        className="inline-flex h-11 w-full items-center justify-center rounded-full bg-teal text-sm font-bold text-white transition-colors hover:bg-teal-dark"
                    >
                        Ir a iniciar sesión
                    </Link>
                    <Link href="/register" className="inline-block text-sm font-semibold text-teal hover:underline">
                        Crear una cuenta nueva
                    </Link>
                </div>
            </div>

            <p className="mt-6 max-w-md px-4 text-center text-xs leading-tight text-grey/45">
                ¿Sigues con problemas? Escríbenos a{" "}
                <a href="mailto:hola@wordelia.es" className="underline hover:text-teal">hola@wordelia.es</a>.
            </p>
        </div>
    );
}
