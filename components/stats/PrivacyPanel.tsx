import * as React from "react";
import { Card } from "../ui/Card";

export function PrivacyPanel({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    if (!isOpen) return null;

    return (
        <div className="animate-fade-in mb-6">
            <Card className="bg-teal/5 border-teal/10 relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-grey/40 hover:text-teal">✕</button>
                <h3 className="text-sm font-bold text-teal uppercase tracking-widest mb-4">Privacidad de datos</h3>

                <div className="space-y-4">
                    {[
                        { label: "Mantener mis estadísticas en privado", desc: "Nadie más podrá ver este resumen.", checked: true },
                        { label: "Permitir estadísticas en clubs (agregadas)", desc: "Tu aporte será anónimo en los totales del grupo.", checked: false },
                        { label: "Registrar emociones (Opt-in)", desc: "Activa el seguimiento de estados de ánimo.", checked: false },
                    ].map((opt, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <div className="mt-0.5">
                                <input type="checkbox" className="w-4 h-4 text-teal rounded border-gray-300 focus:ring-teal" defaultChecked={opt.checked} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-teal-dark">{opt.label}</p>
                                <p className="text-xs text-grey/60">{opt.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-4 pt-3 border-t border-teal/10">
                    <p className="text-[10px] text-teal/60 italic">"Tú decides qué compartes. Siempre."</p>
                </div>
            </Card>
        </div>
    );
}
