"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { PayPalProvider, PayPalCheckout } from "@/components/payments/PayPalCheckout";

/**
 * Checkout de compra individual de un recurso (guía/genoma) para un libro.
 * Al capturar el pago, el fulfillment crea la concesión (grant); redirigimos
 * al recurso ya desbloqueado.
 */
export function ResourceCheckout({
    bookId,
    kind,
    priceLabel,
}: {
    bookId: string;
    kind: "guide" | "genome";
    priceLabel: string;
}) {
    const router = useRouter();
    const [done, setDone] = React.useState(false);
    const resourceUrl = `/app/recursos/${kind === "guide" ? "guias" : "genomas"}/${bookId}`;

    if (done) {
        return (
            <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal/10 text-teal">
                    <CheckCircle2 className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-teal-dark">¡Compra completada! Abriendo tu recurso…</p>
            </div>
        );
    }

    return (
        <div>
            <p className="mb-3 text-2xl font-bold text-teal-dark">{priceLabel}</p>
            <PayPalProvider>
                <PayPalCheckout
                    productType="resource"
                    referenceId={bookId}
                    resourceKind={kind}
                    onSuccess={() => {
                        setDone(true);
                        router.refresh();
                        setTimeout(() => router.push(resourceUrl), 900);
                    }}
                />
            </PayPalProvider>
            <p className="mt-2 text-xs text-grey/50">Pago único. La compra queda asociada a tu cuenta y a este libro.</p>
        </div>
    );
}
