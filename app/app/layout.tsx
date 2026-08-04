"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/app-shell/AppShell";
import { Navbar } from "@/components/landing/Navbar";
import { ConfirmRoot } from "@/components/ui/confirm";
import { Toaster } from "@/components/ui/toast";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isAdnPage = pathname === "/app/adn" || pathname?.startsWith("/app/adn/");
    const isOnboarding = pathname === "/app/onboarding";
    const isAdminArea = pathname === "/app/admin" || pathname?.startsWith("/app/admin/");

    let content: React.ReactNode;
    if (isAdminArea) {
        content = <div className="min-h-screen bg-background">{children}</div>;
    } else if (isOnboarding) {
        content = <div className="min-h-screen bg-cream">{children}</div>;
    } else if (isAdnPage) {
        content = (
            <div className="min-h-screen bg-cream">
                <Navbar />
                <main className="pt-[72px]">{children}</main>
            </div>
        );
    } else {
        content = <AppShell>{children}</AppShell>;
    }

    // Diálogos de confirmación y toasts disponibles en toda la zona /app.
    return (
        <>
            {content}
            <ConfirmRoot />
            <Toaster />
        </>
    );
}
