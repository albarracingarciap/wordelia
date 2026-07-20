import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CatalogSearchClient } from "../CatalogSearchClient";

export default function CatalogImportSearchPage() {
    return (
        <div className="space-y-4">
            <Link
                href="/app/admin/catalogo"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-teal-dark transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Volver al catálogo
            </Link>
            <CatalogSearchClient />
        </div>
    );
}
