"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertTriangle, StickyNote } from "lucide-react";
import type { LibraryWorkspace } from "../data";
import { updateLibraryProfileAction, updateLibraryNotesAction } from "../actions";
import { BuyLinkTemplateField } from "@/components/librerias/BuyLinkTemplateField";

const inputCls =
    "w-full bg-background border border-input rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="text-sm font-medium text-foreground">{label}</span>
            <div className="mt-1">{children}</div>
        </label>
    );
}

export function DatosTab({ org }: { org: LibraryWorkspace["org"] }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

    const [f, setF] = useState({
        name: org.name ?? "",
        description: org.description ?? "",
        website: org.website ?? "",
        contact_email: org.contact_email ?? "",
        phone: org.phone ?? "",
        address: org.address ?? "",
        city: org.city ?? "",
        region: org.region ?? "",
        country: org.country ?? "",
        brand_color: org.brand_color ?? "",
        buy_link_template: org.buy_link_template ?? "",
    });
    const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

    const [notes, setNotes] = useState(org.admin_notes ?? "");
    const [notesFeedback, setNotesFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

    const save = () => {
        setFeedback(null);
        startTransition(async () => {
            const res = await updateLibraryProfileAction(org.id, {
                name: f.name,
                description: f.description || null,
                website: f.website || null,
                contact_email: f.contact_email || null,
                phone: f.phone || null,
                address: f.address || null,
                city: f.city || null,
                region: f.region || null,
                country: f.country || null,
                brand_color: f.brand_color || null,
                buy_link_template: f.buy_link_template || null,
            });
            if ("error" in res) setFeedback({ ok: false, msg: res.error });
            else {
                setFeedback({ ok: true, msg: "Datos guardados." });
                router.refresh();
            }
        });
    };

    const saveNotes = () => {
        setNotesFeedback(null);
        startTransition(async () => {
            const res = await updateLibraryNotesAction(org.id, notes);
            if ("error" in res) setNotesFeedback({ ok: false, msg: res.error });
            else setNotesFeedback({ ok: true, msg: "Nota guardada." });
        });
    };

    return (
        <div className="space-y-5 max-w-3xl">
            <div className="bg-card rounded-xl border border-teal/10 shadow-sm p-5 md:p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <Field label="Nombre">
                            <input className={inputCls} value={f.name} onChange={(e) => set("name", e.target.value)} />
                        </Field>
                    </div>
                    <div className="md:col-span-2">
                        <Field label="Descripción">
                            <textarea className={`${inputCls} min-h-[80px] resize-y`} value={f.description} onChange={(e) => set("description", e.target.value)} />
                        </Field>
                    </div>
                    <Field label="Web"><input className={inputCls} value={f.website} onChange={(e) => set("website", e.target.value)} /></Field>
                    <Field label="Email de contacto"><input className={inputCls} value={f.contact_email} onChange={(e) => set("contact_email", e.target.value)} /></Field>
                    <Field label="Teléfono"><input className={inputCls} value={f.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
                    <Field label="Color de marca"><input className={inputCls} value={f.brand_color} onChange={(e) => set("brand_color", e.target.value)} placeholder="#0ea5a4" /></Field>
                    <div className="md:col-span-2">
                        <Field label="Dirección"><input className={inputCls} value={f.address} onChange={(e) => set("address", e.target.value)} /></Field>
                    </div>
                    <Field label="Ciudad"><input className={inputCls} value={f.city} onChange={(e) => set("city", e.target.value)} /></Field>
                    <Field label="Región"><input className={inputCls} value={f.region} onChange={(e) => set("region", e.target.value)} /></Field>
                    <Field label="País"><input className={inputCls} value={f.country} onChange={(e) => set("country", e.target.value)} /></Field>
                    <div className="md:col-span-2">
                        <BuyLinkTemplateField
                            label="Plantilla de enlace de compra"
                            value={f.buy_link_template}
                            onChange={(v) => set("buy_link_template", v)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                    <button
                        onClick={save}
                        disabled={pending}
                        className="inline-flex items-center gap-2 text-sm font-medium bg-teal text-white py-2 px-5 rounded-md hover:bg-teal-dark transition-colors disabled:opacity-50"
                    >
                        {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                        Guardar datos
                    </button>
                    {feedback && (
                        <span className={`inline-flex items-center gap-1.5 text-sm ${feedback.ok ? "text-teal-dark" : "text-coral"}`}>
                            {feedback.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                            {feedback.msg}
                        </span>
                    )}
                </div>
            </div>

            {/* Notas internas */}
            <div className="bg-card rounded-xl border border-teal/10 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-2">
                    <StickyNote className="w-4 h-4 text-teal" />
                    <h3 className="font-semibold text-sm">Notas internas</h3>
                    <span className="text-xs text-muted-foreground">(solo equipo Wordelia)</span>
                </div>
                <textarea
                    className={`${inputCls} min-h-[80px] resize-y`}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contexto, incidencias, acuerdos…"
                />
                <div className="flex items-center gap-3 mt-2">
                    <button
                        onClick={saveNotes}
                        disabled={pending}
                        className="inline-flex items-center gap-1.5 text-sm font-medium border border-input py-1.5 px-3 rounded-md hover:bg-muted transition-colors disabled:opacity-50"
                    >
                        Guardar nota
                    </button>
                    {notesFeedback && (
                        <span className={`inline-flex items-center gap-1.5 text-sm ${notesFeedback.ok ? "text-teal-dark" : "text-coral"}`}>
                            {notesFeedback.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                            {notesFeedback.msg}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
