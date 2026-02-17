"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/app-shell/AppShell";
import { Navbar } from "@/components/landing/Navbar";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isAdnPage = pathname === "/app/adn" || pathname?.startsWith("/app/adn/");
    const isOnboarding = pathname === "/app/onboarding";

    if (isOnboarding) {
        return (
            <div className="min-h-screen bg-cream">
                {/* No Navbar, no AppShell */}
                {children}
            </div>
        );
    }

    if (isAdnPage) {
        return (
            <div className="min-h-screen bg-cream">
                <Navbar />
                <main className="pt-[72px]">
                    {children}
                </main>
            </div>
        );
    }

    return <AppShell>{children}</AppShell>;
}
