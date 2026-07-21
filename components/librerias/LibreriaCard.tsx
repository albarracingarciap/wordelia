import Link from "next/link";
import Image from "next/image";
import { BookOpen, MapPin } from "lucide-react";
import type { Organization } from "@/types/organizations";

export function LibreriaCard({ organization, hrefBase = "/librerias" }: { organization: Organization; hrefBase?: string }) {
    const location = [organization.city, organization.region].filter(Boolean).join(", ");

    return (
        <Link
            href={`${hrefBase}/${organization.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-teal/10 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal/25 hover:shadow-md"
        >
            <div className="relative h-28 w-full bg-[#D8E2DC]">
                {organization.cover_url && (
                    <Image src={organization.cover_url} alt="" fill className="object-cover" sizes="(min-width:768px) 33vw, 100vw" />
                )}
                {organization.logo_url && (
                    <div className="absolute -bottom-6 left-5 h-14 w-14 overflow-hidden rounded-xl border-2 border-white bg-white shadow-sm">
                        <Image src={organization.logo_url} alt={organization.name} fill className="object-cover" sizes="56px" />
                    </div>
                )}
            </div>
            <div className={`flex flex-1 flex-col p-5 ${organization.logo_url ? "pt-8" : ""}`}>
                <h3 className="font-serif text-xl text-teal transition-colors group-hover:text-coral">{organization.name}</h3>
                {location && (
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-grey/60">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        {location}
                    </p>
                )}
                {organization.description && (
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-grey">{organization.description}</p>
                )}
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal">
                    <BookOpen className="h-4 w-4" aria-hidden="true" />
                    Ver clubs de esta librería
                </span>
            </div>
        </Link>
    );
}
