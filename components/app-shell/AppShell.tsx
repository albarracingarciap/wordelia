"use client";

import { TopBar } from "./TopBar";
import { SideNav } from "./SideNav";
import { MobileNav } from "./MobileNav";

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    return (
        <div className="min-h-screen overflow-x-hidden border-t-0 bg-cream font-sans text-grey outline-none">
            {/* TopBar (Sticky) */}
            <TopBar />

            <div className="mx-auto flex min-h-[calc(100vh-72px)] max-w-[1400px]">
                {/* SideNav (Desktop) */}
                <SideNav />

                {/* Main Content Area */}
                <main className="relative z-0 min-w-0 flex-1 animate-fade-in px-4 py-4 pb-24 sm:px-6 md:p-6 lg:pb-8">
                    <div className="mx-auto max-w-5xl min-w-0">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Nav (Fixed Bottom) */}
            <MobileNav />
        </div>
    );
}
