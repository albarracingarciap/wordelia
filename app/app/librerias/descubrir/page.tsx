import type { Metadata } from "next";
import { getOrganizations } from "../actions";
import { getMyLibrariesWithAuth } from "@/app/librerias/my-library-actions";
import { LibrariesSearch } from "@/app/librerias/LibrariesSearch";

export const metadata: Metadata = {
    title: "Descubrir librerías | Wordelia",
};

export const dynamic = "force-dynamic";

export default async function DiscoverLibrariesPage() {
    const [organizations, { isAuthed, libraries }] = await Promise.all([
        getOrganizations(),
        getMyLibrariesWithAuth(),
    ]);

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <header className="mb-8">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-coral">Librerías Wordelia</p>
                <h1 className="mt-3 font-serif text-3xl text-teal md:text-4xl">Descubre tu librería</h1>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-grey/80">
                    Librerías de barrio que organizan clubs de lectura con Wordelia: guías de discusión, genomas
                    literarios y encuentros en tienda. Encuentra la tuya y compra en indie.
                </p>
            </header>

            <LibrariesSearch initialOrganizations={organizations} adopted={libraries} showAdopt={isAuthed} hrefBase="/app/librerias" />
        </div>
    );
}
