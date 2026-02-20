import * as React from "react";
import { GeneralSettings } from "./GeneralSettings";
import { MembersList } from "./MembersList";
import { PlanEditor } from "./PlanEditor";

export function ClubManagement({ club }: { club?: any }) {
    const [activeTab, setActiveTab] = React.useState<"general" | "members" | "plan">("general");

    const tabs = [
        { id: "general", label: "General" },
        { id: "members", label: "Miembros" },
        { id: "plan", label: "Plan de Lectura" },
    ] as const;

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Sidebar Navigation */}
            <div className="md:col-span-3">
                <nav className="space-y-1 sticky top-[100px]">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full text-left px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === tab.id
                                ? "bg-teal text-white shadow-sm"
                                : "text-grey/60 hover:bg-black/5 hover:text-black"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content Area */}
            <div className="md:col-span-9">
                {activeTab === "general" && <GeneralSettings club={club} />}
                {activeTab === "members" && <MembersList club={club} />}
                {activeTab === "plan" && <PlanEditor club={club} />}
            </div>
        </div>
    );
}
