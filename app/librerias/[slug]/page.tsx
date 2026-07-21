import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { getOrganizationBySlug } from "@/app/app/librerias/actions";
import { LibraryProfile } from "@/components/librerias/LibraryProfile";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const org = await getOrganizationBySlug(slug);
    if (!org) return { title: "Librería | Wordelia" };
    const canonical = `${SITE_URL}/librerias/${slug}`;
    const description = org.description || `Clubs de lectura organizados por ${org.name} en Wordelia.`;
    return {
        title: `${org.name} | Librerías Wordelia`,
        description,
        alternates: { canonical },
        openGraph: {
            type: "profile",
            title: org.name,
            description,
            url: canonical,
            siteName: "Wordelia",
            images: org.cover_url || org.logo_url ? [{ url: (org.cover_url || org.logo_url)! }] : undefined,
        },
    };
}

export default async function LibreriaProfilePage({ params }: PageProps) {
    const { slug } = await params;

    return (
        <div className="flex min-h-screen flex-col bg-cream">
            <Navbar />
            <main className="flex-1 pt-[72px]">
                <LibraryProfile slug={slug} backHref="/librerias" returnTo={`/librerias/${slug}`} />
            </main>
            <Footer />
        </div>
    );
}
