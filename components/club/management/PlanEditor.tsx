"use client";

import { toast } from "@/components/ui/toast";
import { confirmDialog } from "@/components/ui/confirm";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useParams } from "next/navigation";
import { saveCheckpoints } from "@/app/app/clubs/[id]/actions";
import { Trash2, Pencil, Plus, Check, X } from "lucide-react";

interface Checkpoint {
    id: string;
    title: string;
    start: string;
    end: string;
    date?: string;
    questions?: string[];
}

interface PlanEditorClub {
    currentBook?: {
        pace_unit?: string | null;
        checkpoints?: Checkpoint[] | null;
    } | null;
}

interface CheckpointFormProps {
    initial?: Partial<Checkpoint>;
    unitLabel: string;
    onSave: (chk: Checkpoint) => void;
    onCancel: () => void;
}

function CheckpointForm({ initial, unitLabel, onSave, onCancel }: CheckpointFormProps) {
    const [title, setTitle] = React.useState(initial?.title || "");
    const [start, setStart] = React.useState(initial?.start || "");
    const [end, setEnd] = React.useState(initial?.end || "");
    const [date, setDate] = React.useState(initial?.date || "");
    const [questions, setQuestions] = React.useState<string[]>(initial?.questions || []);
    const [questionDraft, setQuestionDraft] = React.useState("");

    const addQuestion = () => {
        const clean = questionDraft.trim();
        if (!clean) return;
        setQuestions((current) => [...current, clean]);
        setQuestionDraft("");
    };

    const removeQuestion = (index: number) => {
        setQuestions((current) => current.filter((_, currentIndex) => currentIndex !== index));
    };

    const handleSave = () => {
        if (!title.trim() || !start || !end) return;
        const pendingQuestion = questionDraft.trim();
        const nextQuestions = pendingQuestion ? [...questions, pendingQuestion] : questions;
        onSave({
            id: initial?.id || Math.random().toString(36).slice(2),
            title: title.trim(),
            start,
            end,
            date: date || undefined,
            questions: nextQuestions,
        });
    };

    return (
        <div className="bg-teal/5 border border-teal/20 rounded-xl p-4 space-y-3">
            <div>
                <label className="block text-xs font-bold text-grey-dark mb-1">Título</label>
                <Input
                    placeholder="Ej. El comienzo"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    autoFocus
                    className="text-sm"
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-bold text-grey-dark mb-1">Inicio ({unitLabel})</label>
                    <Input
                        type="number"
                        placeholder="1"
                        value={start}
                        onChange={e => setStart(e.target.value)}
                        className="text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-grey-dark mb-1">Fin ({unitLabel})</label>
                    <Input
                        type="number"
                        placeholder="100"
                        value={end}
                        onChange={e => setEnd(e.target.value)}
                        className="text-sm"
                    />
                </div>
            </div>
            <div>
                <label className="block text-xs font-bold text-grey-dark mb-1">Fecha límite (opcional)</label>
                <Input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="text-sm"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-grey-dark mb-1">Preguntas guia</label>
                <div className="flex gap-2">
                    <Input
                        placeholder="Ej. Que cambia en este tramo?"
                        value={questionDraft}
                        onChange={e => setQuestionDraft(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                addQuestion();
                            }
                        }}
                        className="text-sm"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                        <Plus size={14} />
                    </Button>
                </div>
                {questions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {questions.map((question, index) => (
                            <span
                                key={`${question}-${index}`}
                                className="inline-flex items-center gap-2 rounded-full border border-teal/15 bg-white px-3 py-1 text-xs font-medium text-teal-dark"
                            >
                                {question}
                                <button
                                    type="button"
                                    onClick={() => removeQuestion(index)}
                                    className="text-grey/40 hover:text-coral"
                                    aria-label="Eliminar pregunta"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
                <p className="mt-1 text-xs text-grey/45">Pulsa Enter para crear cada pregunta.</p>
            </div>
            <div className="flex gap-2 pt-1">
                <Button variant="primary" size="sm" onClick={handleSave} disabled={!title.trim() || !start || !end}>
                    <Check size={14} className="mr-1" /> Guardar checkpoint
                </Button>
                <Button variant="ghost" size="sm" onClick={onCancel}>
                    <X size={14} className="mr-1" /> Cancelar
                </Button>
            </div>
        </div>
    );
}

export function PlanEditor({ club }: { club?: unknown }) {
    const params = useParams();
    const clubId = params.id as string;
    const planClub = club as PlanEditorClub | undefined;

    const unitLabel = planClub?.currentBook?.pace_unit || "p.";
    const initialCheckpoints: Checkpoint[] = planClub?.currentBook?.checkpoints || [];

    const [checkpoints, setCheckpoints] = React.useState<Checkpoint[]>(initialCheckpoints);
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [showAddForm, setShowAddForm] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);
    const [savedOk, setSavedOk] = React.useState(false);

    // Sync if club data loads after mount
    React.useEffect(() => {
        if (planClub?.currentBook?.checkpoints) {
            setCheckpoints(planClub.currentBook.checkpoints);
        }
    }, [planClub]);

    const handleAdd = (chk: Checkpoint) => {
        setCheckpoints(prev => [...prev, chk]);
        setShowAddForm(false);
    };

    const handleEdit = (chk: Checkpoint) => {
        setCheckpoints(prev => prev.map(c => c.id === chk.id ? chk : c));
        setEditingId(null);
    };

    const handleDelete = async (id: string) => {
        if (!(await confirmDialog({ title: "Eliminar checkpoint", message: "¿Eliminar este checkpoint?", confirmLabel: "Eliminar", tone: "danger" }))) return;
        setCheckpoints(prev => prev.filter(c => c.id !== id));
    };

    const handleSave = async () => {
        setIsSaving(true);
        const result = await saveCheckpoints(clubId, checkpoints);
        setIsSaving(false);
        if (result?.error) {
            toast.error("Error: " + result.error);
        } else {
            setSavedOk(true);
            setTimeout(() => setSavedOk(false), 2500);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-serif text-teal">Plan de lectura</h3>
                        <p className="text-sm text-grey/60">Gestiona los tramos y fechas de discusión.</p>
                    </div>
                    <Button variant="primary" size="sm" className="whitespace-nowrap" onClick={() => { setShowAddForm(true); setEditingId(null); }}>
                        <Plus size={14} className="mr-1" /> Nuevo checkpoint
                    </Button>
                </div>

                <div className="space-y-3">
                    {checkpoints.length === 0 && !showAddForm && (
                        <p className="text-center text-sm text-grey/40 italic py-6">
                            No hay checkpoints. Añade el primero.
                        </p>
                    )}

                    {checkpoints.map((chk, i) => (
                        editingId === chk.id ? (
                            <CheckpointForm
                                key={chk.id}
                                initial={chk}
                                unitLabel={unitLabel}
                                onSave={handleEdit}
                                onCancel={() => setEditingId(null)}
                            />
                        ) : (
                            <div key={chk.id} className="group relative bg-white border border-black/5 rounded-xl p-4 hover:border-teal/30 transition-all flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center justify-center w-8 h-8 rounded-full bg-grey/5 text-xs font-bold text-grey/40 shrink-0">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-grey-dark">{chk.title}</h4>
                                        <div className="flex items-center gap-3 text-xs text-grey/60">
                                            <span>{unitLabel} {chk.start} – {chk.end}</span>
                                            {!!chk.questions?.length && (
                                                <>
                                                    <span>-</span>
                                                    <span>{chk.questions.length} preguntas</span>
                                                </>
                                            )}
                                            {chk.date && (
                                                <>
                                                    <span>·</span>
                                                    <span>{new Date(chk.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => { setEditingId(chk.id); setShowAddForm(false); }}
                                        className="p-1.5 text-grey/40 hover:text-teal transition-colors rounded-lg hover:bg-teal/5"
                                        title="Editar"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(chk.id)}
                                        className="p-1.5 text-grey/40 hover:text-coral transition-colors rounded-lg hover:bg-coral/5"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        )
                    ))}

                    {showAddForm && (
                        <CheckpointForm
                            unitLabel={unitLabel}
                            onSave={handleAdd}
                            onCancel={() => setShowAddForm(false)}
                        />
                    )}
                </div>

                {/* Save button */}
                {checkpoints.length > 0 && (
                    <div className="mt-6 flex flex-col gap-3 border-t border-black/5 pt-4 sm:flex-row sm:items-center">
                        <Button
                            variant="primary"
                            onClick={handleSave}
                            disabled={isSaving || !!editingId || showAddForm}
                            className="w-full whitespace-nowrap sm:w-auto"
                        >
                            {isSaving ? "Guardando..." : "Guardar cambios"}
                        </Button>
                        {(editingId || showAddForm) && (
                            <span className="text-sm leading-6 text-grey/50">
                                Guarda o cancela el checkpoint abierto antes de guardar el plan.
                            </span>
                        )}
                        {savedOk && (
                            <span className="text-sm text-teal flex items-center gap-1">
                                <Check size={14} /> Cambios guardados
                            </span>
                        )}
                    </div>
                )}

                {/* AI Assistant */}
                <div className="mt-8 pt-6 border-t border-black/5">
                    <div className="flex items-center gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm text-blue-900">Asistente de Planificación</h4>
                            <p className="text-xs text-blue-700/70">¿Quieres que la IA sugiera checkpoints basados en el libro?</p>
                        </div>
                        <Button variant="outline" size="sm" className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => toast.info("Próximamente")}>Sugerir</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
