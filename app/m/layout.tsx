import type { Metadata } from "next";
import { ConfirmRoot } from "@/components/ui/confirm";
import { Toaster } from "@/components/ui/toast";
import { MobileTabBar } from "@/components/mobile/MobileTabBar";
import { TimerBar } from "@/components/mobile/TimerBar";
import { ReadingTimerProvider } from "@/components/mobile/ReadingTimerProvider";

// Shell móvil /m: experiencia simplificada para el lector en el móvil (PWA y,
// más adelante, app de tiendas vía Capacitor). /app sigue siendo la versión
// completa. El login lo exige el middleware (utils/supabase/middleware.ts).
export const metadata: Metadata = {
    title: "Wordelia",
    robots: { index: false, follow: false },
};

export default function MobileLayout({ children }: { children: React.ReactNode }) {
    return (
        <ReadingTimerProvider>
            <div className="min-h-screen bg-cream font-sans text-grey">
                <main className="mx-auto max-w-xl px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-40">
                    {children}
                </main>
                <TimerBar />
                <MobileTabBar />
            </div>
            <ConfirmRoot />
            <Toaster />
        </ReadingTimerProvider>
    );
}
