import * as React from "react";
import { GeneralSettings } from "./GeneralSettings";
import { MembersList } from "./MembersList";
import { PlanEditor } from "./PlanEditor";
import { ReportsPanel } from "./ReportsPanel";

export function ClubManagement({ club, mobileGeneralAside }: { club?: unknown; mobileGeneralAside?: React.ReactNode }) {
    const [activeTab, setActiveTab] = React.useState<"general" | "members" | "plan" | "reports">("general");

    const tabs = [
        { id: "general", label: "General" },
        { id: "members", label: "Miembros" },
        { id: "plan", label: "Plan de Lectura" },
        { id: "reports", label: "Reportes" },
    ] as const;

    return (
        <div className="space-y-6">
            <nav className="grid grid-cols-2 gap-1 rounded-2xl border border-teal/10 bg-white p-1 shadow-sm sm:grid-cols-4">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`min-h-11 rounded-xl px-2 text-center text-sm font-bold transition-all ${activeTab === tab.id
                            ? "bg-teal text-white shadow-sm"
                            : "text-grey/55 hover:bg-grey/5 hover:text-teal-dark"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            <div>
                {activeTab === "general" && (
                    <div className="space-y-6">
                        <GeneralSettings club={club} />
                        {mobileGeneralAside && (
                            <div className="lg:hidden">
                                {mobileGeneralAside}
                            </div>
                        )}
                    </div>
                )}
                {activeTab === "members" && <MembersList club={club} />}
                {activeTab === "plan" && <PlanEditor club={club} />}
                {activeTab === "reports" && <ReportsPanel />}
            </div>
        </div>
    );
}
