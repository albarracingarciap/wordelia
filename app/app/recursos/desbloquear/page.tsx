import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpenText, CreditCard, Dna, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { getPrice } from "@/lib/pricing";
import { getResourceDetail, type ResourceKind } from "../actions";
import { ResourceCheckout } from "@/components/payments/ResourceCheckout";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
    searchParams: Promise<{ resource?: string; book?: string }>;
};

function formatPrice(cents: number, currency: string) {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(cents / 100);
}

export default async function UnlockResourcePage({ searchParams }: PageProps) {
    const { resource, book } = await searchParams;
    const kind: ResourceKind = resource === "genome" ? "genome" : "guide";
    const Icon = kind === "guide" ? BookOpenText : Dna;
    const title = kind === "guide" ? "Guía de discusión" : "Genoma literario";

    // Si ya tiene acceso (plan, compra o muestra gratis), no hay nada que desbloquear.
    const detail = book ? await getResourceDetail(kind, book) : null;
    if (detail?.canView) {
        redirect(`/app/recursos/${kind === "guide" ? "guias" : "genomas"}/${book}`);
    }

    const bookTitle = detail?.book.title ?? null;
    const price = book ? getPrice({ productType: "resource", referenceId: book, period: null, resourceKind: kind }) : null;
    const priceLabel = price ? formatPrice(price.amount_cents, price.currency) : "6,99 €";

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
                    {bookTitle ? <>Para <strong className="text-teal-dark">{bookTitle}</strong>. </> : null}
                    Accede con un plan compatible o cómpralo suelto para este libro. La compra queda asociada a tu cuenta.
                </p>

                <div className="mt-7 grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-teal/10 bg-offwhite p-5 text-left">
                        <div className="mb-3 flex items-center gap-3">
                            <Sparkles className="h-5 w-5 text-coral" aria-hidden="true" />
                            <h2 className="text-lg font-semibold text-teal">Acceder con plan</h2>
                        </div>
                        <p className="text-sm leading-relaxed text-grey">
                            {kind === "guide"
                                ? "El plan Bibliófilo incluye todas las guías de discusión (y los genomas)."
                                : "El plan Voraz incluye todos los genomas; el Bibliófilo, además, todas las guías."}
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
                        <p className="mb-4 text-sm leading-relaxed text-grey">
                            Compra solo {kind === "guide" ? "esta guía" : "este genoma"} para este libro, para siempre.
                        </p>
                        {book ? (
                            <ResourceCheckout bookId={book} kind={kind} priceLabel={priceLabel} />
                        ) : (
                            <p className="text-sm text-grey/60">Falta la referencia del libro.</p>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}
