"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { CheckpointModal } from "@/components/clubs/create/CheckpointModal"; // Reuse existing modal? Or move it.

import { ProFeatureModal } from "@/components/ui/ProFeatureModal";

interface ReadingSetupProps {
    book: any;
    onBack: () => void;
    onSave: (config: any) => void;
    isPro?: boolean; // New prop to check subscription status
    initialConfig?: {
        startDate?: string;
        pace?: string;
        progressMeasure?: string;
        checkpoints?: any[];
        preguntaApertura?: string;
    } | null;
    isSaving?: boolean;
}

export function ReadingSetup({ book, onBack, onSave, isPro = false, initialConfig = null, isSaving = false }: ReadingSetupProps) {
    const [config, setConfig] = React.useState({
        startDate: initialConfig?.startDate || new Date().toISOString().split('T')[0],
        pace: initialConfig?.pace || "Estándar (2 check/sem)",
        progressMeasure: initialConfig?.progressMeasure || "pages",
        checkpoints: initialConfig?.checkpoints || ([] as any[]),
        preguntaApertura: initialConfig?.preguntaApertura || "",
    });

    const [isCheckpointModalOpen, setIsCheckpointModalOpen] = React.useState(false);
    const [isProModalOpen, setIsProModalOpen] = React.useState(false);
    const [editingCheckpoint, setEditingCheckpoint] = React.useState<any>(null);

    const handleAiGenerate = () => {
        if (!isPro) {
            setIsProModalOpen(true);
            return;
        }
        alert("Generando con IA... (Simulación)");
        // Add AI generation logic here
    };

    const updateField = (field: string, value: any) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    const handleUnitChange = (newUnit: string) => {
        const confirmReset = config.checkpoints.length > 0
            ? confirm("Al cambiar la unidad, se borrarán los checkpoints actuales. ¿Continuar?")
            : true;

        if (confirmReset) {
            updateField("progressMeasure", newUnit);
            updateField("checkpoints", []);
        }
    };

    const handleSaveCheckpoint = (chk: any) => {
        const currentCheckpoints = config.checkpoints;
        let newCheckpoints;
        if (editingCheckpoint) {
            newCheckpoints = currentCheckpoints.map((c: any) => c.id === chk.id ? chk : c);
        } else {
            newCheckpoints = [...currentCheckpoints, chk];
        }
        updateField("checkpoints", newCheckpoints);
        if (config.pace !== 'Personalizado') updateField("pace", "Personalizado");
        setIsCheckpointModalOpen(false);
    };

    const handleDeleteCheckpoint = (id: string) => {
        const newCheckpoints = config.checkpoints.filter((c: any) => c.id !== id);
        updateField("checkpoints", newCheckpoints);
        if (config.pace !== 'Personalizado') updateField("pace", "Personalizado");
    };

    const openModal = (chk?: any) => {
        setEditingCheckpoint(chk || null);
        setIsCheckpointModalOpen(true);
    };

    const unitLabel = config.progressMeasure === 'pages' ? 'p.' : config.progressMeasure === 'chapters' ? 'cap.' : '%';

    return (
        <div className="bg-white border-2 border-dashed border-teal/20 rounded-xl p-8 animate-fade-in-up">
            <div className="flex justify-between items-start mb-8 border-b border-grey/10 pb-6">
                <div className="flex gap-6">
                    <div className="w-16 h-24 bg-grey/10 rounded overflow-hidden shadow-sm flex-shrink-0">
                        {book.cover_url ? (
                            <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-grey/40">No Cover</div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-serif text-2xl text-teal-dark mb-1">Configurar lectura</h3>
                        <div className="text-grey-dark font-bold text-lg">{book.title}</div>
                        <div className="text-grey/60 text-sm">{book.authors?.join(", ") || "Autor desconocido"}</div>
                    </div>
                </div>
                <Button variant="ghost" onClick={onBack}>Cambiar libro</Button>
            </div>

            <div className="space-y-8 max-w-2xl mx-auto">
                {/* 1. Start Date */}
                <div>
                    <label className="block text-sm font-bold text-grey-dark mb-1.5">Fecha de inicio</label>
                    <input
                        type="date"
                        value={config.startDate}
                        onChange={(e) => updateField("startDate", e.target.value)}
                        className="w-full p-3 bg-white border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
                    />
                </div>

                {/* 2. Speed Presets */}
                <div>
                    <label className="block text-sm font-bold text-grey-dark mb-3">Velocidad aproximada</label>
                    <div className="flex flex-wrap gap-2">
                        {["Suave (1 check/sem)", "Estándar (2 check/sem)", "Intenso (3 check/sem)", "Personalizado"].map(opt => (
                            <Chip
                                key={opt}
                                label={opt}
                                active={config.pace === opt}
                                onClick={() => updateField("pace", opt)}
                            />
                        ))}
                    </div>
                </div>

                {/* 3. Unit */}
                <div>
                    <label className="block text-sm font-bold text-grey-dark mb-1.5">Unidad de medida</label>
                    <Select
                        options={[
                            { label: "Páginas", value: "pages" },
                            { label: "Capítulos", value: "chapters" },
                        ]}
                        value={config.progressMeasure}
                        onChange={(e) => handleUnitChange(e.target.value)}
                    />
                </div>

                {/* 4. Opening question */}
                <div>
                    <label className="block text-sm font-bold text-grey-dark mb-1.5">Pregunta de apertura</label>
                    <textarea
                        className="w-full rounded-xl border border-grey/20 bg-white px-4 py-3 text-sm text-grey-dark placeholder:text-grey/40 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/20 min-h-[90px] resize-none"
                        value={config.preguntaApertura}
                        onChange={(e) => updateField("preguntaApertura", e.target.value)}
                        placeholder="Una pregunta potente para arrancar la conversación sobre este libro..."
                    />
                    <p className="text-xs text-grey/50 mt-1">Se muestra como gancho del club (opcional).</p>
                </div>

                {/* 5. Checkpoints */}
                <div className="bg-[#FAF9F6] border border-teal/10 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-teal text-sm uppercase tracking-wider">Plan de lectura {config.pace === 'Personalizado' ? '(Manual)' : '(Borrador)'}</h4>
                        <button
                            className="text-xs font-bold text-coral hover:underline flex items-center gap-1"
                            onClick={handleAiGenerate}
                        >
                            <span>✨</span> Generar con IA
                        </button>
                    </div>

                    <div className="space-y-2">
                        {config.checkpoints.length > 0 ? (
                            config.checkpoints.map((chk: any) => (
                                <div key={chk.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-black/5 shadow-sm group">
                                    <div>
                                        <span className="text-xs font-bold text-teal-dark">{chk.title}</span>
                                        <span className="text-xs text-grey/60 ml-2">{unitLabel} {chk.start} - {chk.end}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-grey/40 uppercase font-medium bg-grey/5 px-2 py-1 rounded">{chk.date || "Sin fecha"}</span>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                            <button onClick={() => openModal(chk)} className="text-xs text-teal hover:underline px-1">Editar</button>
                                            <button onClick={() => handleDeleteCheckpoint(chk.id)} className="text-xs text-red-500 hover:underline px-1">Borrar</button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-sm text-grey/40 italic py-4">Añade checkpoints para definir las metas de lectura.</p>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-grey/60 border-dashed border border-grey/20 mt-2 hover:border-teal/30 hover:text-teal"
                            onClick={() => openModal()}
                        >
                            + Añadir checkpoint
                        </Button>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end pt-8 border-t border-grey/10">
                    <Button variant="primary" onClick={() => onSave(config)} disabled={isSaving}>
                        {isSaving ? "Guardando..." : "Guardar cambios"}
                    </Button>
                </div>
            </div>

            {/* Reuse existing CheckpointModal from wizard */}
            <CheckpointModal
                isOpen={isCheckpointModalOpen}
                onClose={() => setIsCheckpointModalOpen(false)}
                onSave={handleSaveCheckpoint}
                initialData={editingCheckpoint}
                unitLabel={unitLabel}
            />

            <ProFeatureModal
                isOpen={isProModalOpen}
                onClose={() => setIsProModalOpen(false)}
                featureName="Plan de Lectura"
            />
        </div>
    );
}
