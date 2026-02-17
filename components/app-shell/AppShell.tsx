"use client";

import { TopBar } from "./TopBar";
import { SideNav } from "./SideNav";
import { MobileNav } from "./MobileNav";

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    return (
        <div className="min-h-screen bg-cream font-sans text-grey">
            {/* TopBar (Sticky) */}
            <TopBar />

            <div className="flex max-w-[1400px] mx-auto min-h-[calc(100vh-72px)]">
                {/* SideNav (Desktop) */}
                <SideNav />

                {/* Main Content Area */}
                <main className="flex-1 min-w-0 p-4 md:p-6 pb-24 lg:pb-8 animate-fade-in relative z-0">
                    <div className="max-w-5xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Nav (Fixed Bottom) */}
            <MobileNav />
        </div>
    );
}
