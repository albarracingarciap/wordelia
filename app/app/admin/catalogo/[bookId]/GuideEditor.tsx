"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertTriangle, Check } from "lucide-react";
import { GUIDE_FORM_SECTIONS } from "./guide-form-schema";
import { SectionEditor } from "./GuideFields";
import { saveGuideAction } from "../actions";

function hasContent(v: any): boolean {
    if (v == null) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object") return Object.keys(v).length > 0;
    return String(v).trim().length > 0;
}

export function GuideEditor({ bookId, initialGuide }: { bookId: string; initialGuide: any }) {
    const router = useRouter();
    const [guide, setGuide] = useState<any>(
        initialGuide && typeof initialGuide === "object" && !Array.isArray(initialGuide) ? initialGuide : {},
    );
    const [active, setActive] = useState<string>(GUIDE_FORM_SECTIONS[0].key);
    const [pending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

    const spec = GUIDE_FORM_SECTIONS.find((s) => s.key === active) ?? GUIDE_FORM_SECTIONS[0];

    const setSection = (key: string, value: any) => setGuide((g: any) => ({ ...g, [key]: value }));

    const save = () => {
        setFeedback(null);
        startTransition(async () => {
            const res = await saveGuideAction(bookId, guide);
            if ("error" in res) setFeedback({ ok: false, msg: res.error });
            else {
                setFeedback({ ok: true, msg: "Guía guardada." });
                router.refresh();
            }
        });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-[210px_1fr] gap-5">
            <nav className="space-y-0.5 md:sticky md:top-2 md:self-start">
                {GUIDE_FORM_SECTIONS.map((s) => (
                    <button
                        key={s.key}
                        onClick={() => setActive(s.key)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between gap-2 transition-colors ${
                            active === s.key
                                ? "bg-accent text-accent-foreground font-medium"
                                : "text-muted-foreground hover:bg-accent/50"
                        }`}
                    >
                        <span className="truncate">{s.label}</span>
                        {hasContent(guide[s.key]) && <Check className="w-3.5 h-3.5 text-teal shrink-0" />}
                    </button>
                ))}
            </nav>

            <div className="min-w-0 space-y-4">
                <div className="bg-card rounded-xl border border-teal/10 shadow-sm p-5">
                    <h4 className="font-semibold mb-4">{spec.label}</h4>
                    <SectionEditor key={active} spec={spec} value={guide[active]} onChange={(v) => setSection(active, v)} />
                </div>

                <div className="flex items-center gap-3 sticky bottom-0 bg-background/80 backdrop-blur py-3">
                    <button
                        onClick={save}
                        disabled={pending}
                        className="inline-flex items-center gap-2 text-sm font-medium bg-teal text-white py-2 px-5 rounded-md hover:bg-teal-dark transition-colors disabled:opacity-50"
                    >
                        {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                        Guardar guía
                    </button>
                    {feedback && (
                        <span className={`inline-flex items-center gap-1.5 text-sm ${feedback.ok ? "text-teal-dark" : "text-coral"}`}>
                            {feedback.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                            {feedback.msg}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
