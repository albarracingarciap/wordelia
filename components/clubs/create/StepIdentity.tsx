import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";

interface StepIdentityProps {
    data: any;
    onUpdate: (field: string, value: any) => void;
}

export function StepIdentity({ data, onUpdate }: StepIdentityProps) {
    return (
        <Card className="animate-fade-in-up">
            <h3 className="text-lg font-serif text-teal mb-6">Identidad del club</h3>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-grey-dark mb-1.5">Nombre del club <span className="text-coral">*</span></label>
                    <Input
                        placeholder="Ej. Lecturas con calma"
                        value={data.name}
                        onChange={(e) => onUpdate("name", e.target.value)}
                        autoFocus
                    />
                    <p className="text-xs text-grey/50 mt-1">Puedes cambiarlo luego.</p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-grey-dark mb-3">Tipo de Club</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button
                            onClick={() => onUpdate("readingType", "guided")}
                            className={`text-left p-3 rounded-xl border transition-all ${data.readingType === 'guided' ? 'bg-teal/5 border-teal ring-1 ring-teal/20' : 'bg-white border-grey/10 hover:border-teal/30'}`}
                        >
                            <div className="font-bold text-sm text-grey-dark mb-1">Lectura Guiada</div>
                            <div className="text-xs text-grey/60 leading-tight">Leemos juntos paso a paso. Ideal para primeras lecturas.</div>
                        </button>
                        <button
                            onClick={() => onUpdate("readingType", "analysis")}
                            className={`text-left p-3 rounded-xl border transition-all ${data.readingType === 'analysis' ? 'bg-teal/5 border-teal ring-1 ring-teal/20' : 'bg-white border-grey/10 hover:border-teal/30'}`}
                        >
                            <div className="font-bold text-sm text-grey-dark mb-1">Club de Análisis</div>
                            <div className="text-xs text-grey/60 leading-tight">Ya lo hemos leído. Nos reunimos a profundizar.</div>
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-grey-dark mb-1.5">¿De qué va este club?</label>
                    <textarea
                        className="w-full rounded-xl border border-grey/20 bg-white px-4 py-3 text-sm text-grey-dark placeholder:text-grey/40 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/20 min-h-[100px] resize-none"
                        placeholder="Leemos sin prisa y debatimos con respeto..."
                        value={data.description}
                        onChange={(e) => onUpdate("description", e.target.value)}
                    />
                    <p className="text-xs text-grey/50 mt-1">2–3 líneas bastan.</p>
                </div>

                <div className="flex gap-4">
                    <div className="w-full md:w-1/2">
                        <label className="block text-sm font-bold text-grey-dark mb-1.5">Idioma</label>
                        <Select
                            options={[
                                { label: "Español", value: "es" },
                                { label: "English", value: "en" },
                                { label: "Català", value: "ca" },
                            ]}
                            value={data.language}
                            onChange={(e) => onUpdate("language", e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-1/2">
                        <label className="block text-sm font-bold text-grey-dark mb-1.5">Precio (Opcional)</label>
                        <div className="relative">
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={data.price || ''}
                                onChange={(e) => onUpdate("price", e.target.value)}
                                className="pl-12"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-grey/60">€</span>
                        </div>
                        <p className="text-[10px] text-grey/50 mt-1">Deja vacío para gratuito.</p>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-black/5 text-center">
                <p className="text-sm text-grey/60 italic font-serif">"Un buen club empieza con un propósito sencillo."</p>
            </div>
        </Card>
    );
}
