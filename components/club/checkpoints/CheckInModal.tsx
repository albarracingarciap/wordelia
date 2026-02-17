import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Chip } from "@/components/ui/Chip";

interface CheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    checkpointTitle: string;
}

export function CheckInModal({ isOpen, onClose, checkpointTitle }: CheckInModalProps) {
    const [mood, setMood] = React.useState("");
    const [spoiler, setSpoiler] = React.useState("none");

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Check-in: ${checkpointTitle}`}
        >
            <div className="space-y-6 pt-2">
                <div>
                    <label className="block text-sm font-bold text-grey-dark mb-2">¿Cómo te ha dejado este tramo?</label>
                    <div className="flex flex-wrap gap-2">
                        {["Intrigado", "Emocionado", "Confuso", "Triste", "Aburrido"].map(m => (
                            <Chip key={m} label={m} active={mood === m} onClick={() => setMood(m)} />
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-grey-dark mb-2">Reflexión rápida</label>
                    <textarea
                        className="w-full rounded-xl border border-grey/20 bg-white px-4 py-3 text-sm text-grey-dark placeholder:text-grey/40 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/20 min-h-[100px] resize-none"
                        placeholder="Una idea, una emoción, una imagen..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-grey-dark mb-1.5">Nivel de spoilers</label>
                        <div className="flex gap-2">
                            {/* Simplification for mock UI */}
                            <button onClick={() => setSpoiler("none")} className={`px-2 py-1 text-xs rounded border ${spoiler === 'none' ? 'bg-teal text-white border-teal' : 'bg-white text-grey/60'}`}>Sin</button>
                            <button onClick={() => setSpoiler("mild")} className={`px-2 py-1 text-xs rounded border ${spoiler === 'mild' ? 'bg-teal text-white border-teal' : 'bg-white text-grey/60'}`}>Suave</button>
                            <button onClick={() => setSpoiler("strict")} className={`px-2 py-1 text-xs rounded border ${spoiler === 'strict' ? 'bg-teal text-white border-teal' : 'bg-white text-grey/60'}`}>Total</button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-black/5 mt-4">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button onClick={onClose}>Guardar Check-in</Button>
                </div>
            </div>
        </Modal>
    );
}
