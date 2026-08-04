import * as React from "react";
import { confirmDialog } from "@/components/ui/confirm";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { CheckpointModal } from "./CheckpointModal";

interface StepPaceProps {
    data: any;
    onUpdate: (field: string, value: any) => void;
}

export function StepPace({ data, onUpdate }: StepPaceProps) {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingCheckpoint, setEditingCheckpoint] = React.useState<any>(null);

    if (!data.book) {
        return (
            <Card className="text-center py-12">
                <p className="text-grey/60">Primero elige un libro para poder definir el ritmo.</p>
            </Card>
        );
    }

    const handleUnitChange = async (newUnit: string) => {
        // Si hay checkpoints, avisar antes de borrarlos al cambiar de unidad.
        const confirmReset = data.checkpoints && data.checkpoints.length > 0
            ? await confirmDialog({ title: "Cambiar unidad", message: "Al cambiar la unidad, se borrarán los checkpoints actuales. ¿Continuar?", confirmLabel: "Continuar", tone: "danger" })
            : true;

        if (confirmReset) {
            onUpdate("progressMeasure", newUnit);
            onUpdate("checkpoints", []);
        }
    };

    const handleSaveCheckpoint = (chk: any) => {
        const currentCheckpoints = data.checkpoints || [];
        let newCheckpoints;

        if (editingCheckpoint) {
            newCheckpoints = currentCheckpoints.map((c: any) => c.id === chk.id ? chk : c);
        } else {
            newCheckpoints = [...currentCheckpoints, chk];
        }

        onUpdate("checkpoints", newCheckpoints);
        // Automatically switch to Custom pace if manual edits happen
        if (data.pace !== 'Personalizado') {
            onUpdate("pace", "Personalizado");
        }
    };

    const handleDeleteCheckpoint = (id: string) => {
        const newCheckpoints = (data.checkpoints || []).filter((c: any) => c.id !== id);
        onUpdate("checkpoints", newCheckpoints);
        if (data.pace !== 'Personalizado') {
            onUpdate("pace", "Personalizado");
        }
    };

    const openModal = (chk?: any) => {
        setEditingCheckpoint(chk || null);
        setIsModalOpen(true);
    };

    // Derived unit label
    const unitLabel = data.progressMeasure === 'pages' ? 'p.' : data.progressMeasure === 'chapters' ? 'cap.' : '%';

    return (
        <Card className="animate-fade-in-up">
            <h3 className="text-lg font-serif text-teal mb-6">Define el ritmo</h3>

            <div className="space-y-8">
                {/* Speed Presets */}
                <div>
                    <label className="block text-sm font-bold text-grey-dark mb-3">Velocidad aproximada</label>
                    <div className="flex flex-wrap gap-2">
                        {["Suave (1 check/sem)", "Estándar (2 check/sem)", "Intenso (3 check/sem)", "Personalizado"].map(opt => (
                            <Chip
                                key={opt}
                                label={opt}
                                active={data.pace === opt}
                                onClick={() => onUpdate("pace", opt)}
                            />
                        ))}
                    </div>
                    <p className="text-xs text-grey/50 mt-2">"El mejor ritmo es el que se sostiene."</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-grey-dark mb-1.5">Unidad de medida</label>
                        <Select
                            options={[
                                { label: "Páginas", value: "pages" },
                                { label: "Capítulos", value: "chapters" },
                            ]}
                            value={data.progressMeasure || "pages"}
                            onChange={(e) => handleUnitChange(e.target.value)}
                        />
                    </div>
                </div>

                {/* Checkpoints List */}
                <div className="bg-[#FAF9F6] border border-teal/10 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-teal text-sm uppercase tracking-wider">Plan de lectura {data.pace === 'Personalizado' ? '(Manual)' : '(Borrador)'}</h4>
                        <button className="text-xs font-bold text-coral hover:underline">Regenerar IA</button>
                    </div>

                    <div className="space-y-2">
                        {(data.checkpoints && data.checkpoints.length > 0) ? (
                            data.checkpoints.map((chk: any) => (
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
                            <p className="text-center text-sm text-grey/40 italic py-4">No hay checkpoints definidos.</p>
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
            </div>

            <CheckpointModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveCheckpoint}
                initialData={editingCheckpoint}
                unitLabel={unitLabel}
            />
        </Card>
    );
}
