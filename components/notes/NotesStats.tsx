import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

interface NotesStatsProps {
    notesThisMonth: number;
    booksWithNotes: number;
    questionsCount: number;
}

export function NotesStats({ notesThisMonth, booksWithNotes, questionsCount }: NotesStatsProps) {
    return (
        <div className="space-y-6">
            <Card className="bg-[#D8E2DC]/30 border-none">
                <h3 className="font-serif text-teal mb-4">Tu diario</h3>
                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-grey/60">Notas este mes</span>
                        <span className="font-bold text-teal-dark">{notesThisMonth}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-grey/60">Libros con notas</span>
                        <span className="font-bold text-teal-dark">{booksWithNotes}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-grey/60">Preguntas abiertas</span>
                        <span className="font-bold text-teal-dark">{questionsCount}</span>
                    </div>
                </div>
                <div className="mt-4 pt-3 border-t border-teal/5">
                    <Button variant="ghost" size="sm" fullWidth className="text-xs text-teal/60 hover:text-teal">
                        Ver estadísticas detalladas →
                    </Button>
                </div>
            </Card>

            <Card className="bg-white border border-teal/10">
                <div className="flex items-start gap-3">
                    <span className="text-xl">💡</span>
                    <div>
                        <p className="text-sm text-grey mb-2 font-medium">Sugerencia</p>
                        <p className="text-xs text-grey/60 leading-relaxed mb-3">
                            ¿Te apetece una pregunta para el próximo club? Guarda 2–3 ideas y Wordelia te propone una guía.
                        </p>
                        <Button variant="secondary" size="sm" className="text-xs h-8">
                            Probar guía
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
