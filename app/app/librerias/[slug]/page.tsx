import { LibraryProfile } from "@/components/librerias/LibraryProfile";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

// Vista in-app del perfil de librería: reutiliza el mismo componente que la ruta
// pública `/librerias/[slug]`, pero dentro del AppShell (sin salir del área /app).
export default async function AppLibraryProfilePage({ params }: PageProps) {
    const { slug } = await params;

    return (
        <div className="pb-10">
            <LibraryProfile slug={slug} backHref="/app/librerias/descubrir" returnTo={`/app/librerias/${slug}`} />
        </div>
    );
}
