import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { legalProseClass } from "@/components/legal/LegalProse";

type LegalPageProps = {
    title: string;
    lastUpdated: string;
    children: React.ReactNode;
};

const proseClass = legalProseClass;

export function LegalPage({ title, lastUpdated, children }: LegalPageProps) {
    return (
        <main className="min-h-screen bg-cream">
            <Navbar mode="public" />

            <section className="px-6 pb-16 pt-28 md:px-8 md:pb-24 md:pt-32">
                <div className="mx-auto max-w-[760px]">
                    <Link
                        href="/"
                        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-grey transition-colors hover:text-teal"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Volver al inicio
                    </Link>

                    <header className="mb-8 border-b border-teal/10 pb-6">
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-coral">Legal</p>
                        <h1 className="mt-3 text-3xl leading-tight text-teal md:text-4xl">{title}</h1>
                        <p className="mt-3 text-sm text-grey/60">Última actualización: {lastUpdated}</p>
                    </header>

                    <div className={proseClass}>{children}</div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
