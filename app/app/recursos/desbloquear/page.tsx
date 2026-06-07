import Link from "next/link";
import { ArrowLeft, BookOpenText, CreditCard, Dna, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
    searchParams: Promise<{ resource?: string; book?: string }>;
};

export default async function UnlockResourcePage({ searchParams }: PageProps) {
    const { resource, book } = await searchParams;
    const kind = resource === "genome" ? "genome" : "guide";
    const Icon = kind === "guide" ? BookOpenText : Dna;
    const title = kind === "guide" ? "Guia de discusion" : "Genoma literario";

    return (
        <div className="space-y-6">
            <Link href="/app/mi-lectura" className="inline-flex items-center gap-2 text-sm font-semibold text-teal hover:text-coral">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Volver a mi lectura
            </Link>

            <Card className="mx-auto max-w-3xl text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-coral/10 text-coral">
                    <Icon className="h-7 w-7" aria-hidden="true" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral">Recurso bloqueado</p>
                <h1 className="mt-3 text-3xl text-teal md:text-5xl">Desbloquear {title}</h1>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-grey md:text-base">
                    Este recurso esta disponible para usuarios con un plan compatible o mediante compra individual. La compra individual quedara asociada a tu cuenta y a este libro.
                </p>

                <div className="mt-7 grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-teal/10 bg-offwhite p-5 text-left">
                        <div className="mb-3 flex items-center gap-3">
                            <Sparkles className="h-5 w-5 text-coral" aria-hidden="true" />
                            <h2 className="text-lg font-semibold text-teal">Acceder con plan</h2>
                        </div>
                        <p className="text-sm leading-relaxed text-grey">
                            Activa un plan que incluya {kind === "guide" ? "guias de discusion" : "genomas literarios"} y accede a los recursos compatibles.
                        </p>
                        <Link href="/planes" className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-teal px-4 text-sm font-semibold text-white transition-colors hover:bg-teal-dark">
                            Ver planes
                        </Link>
                    </div>

                    <div className="rounded-xl border border-teal/10 bg-offwhite p-5 text-left">
                        <div className="mb-3 flex items-center gap-3">
                            <CreditCard className="h-5 w-5 text-coral" aria-hidden="true" />
                            <h2 className="text-lg font-semibold text-teal">Compra individual</h2>
                        </div>
                        <p className="text-sm leading-relaxed text-grey">
                            Compra solo este recurso para este libro. Cuando conectemos el checkout, se creara una concesion en tu biblioteca.
                        </p>
                        <Link
                            href={`/app/recursos/desbloquear?resource=${kind}${book ? `&book=${book}` : ""}`}
                            className="mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-coral px-4 text-sm font-semibold text-coral transition-colors hover:bg-coral/10"
                        >
                            Proximamente
                        </Link>
                    </div>
                </div>
            </Card>
        </div>
    );
}

