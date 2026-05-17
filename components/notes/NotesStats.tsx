import { BookOpen, HelpCircle, NotebookPen } from "lucide-react";
import { Card } from "../ui/Card";

interface NotesStatsProps {
    notesThisMonth: number;
    booksWithNotes: number;
    questionsCount: number;
}

export function NotesStats({ notesThisMonth, booksWithNotes, questionsCount }: NotesStatsProps) {
    return (
        <div className="space-y-4">
            <Card className="border border-teal/5 bg-white/90 shadow-sm">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-grey/45">Tu diario</h3>
                <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between rounded-2xl bg-cream/40 px-3 py-3 text-sm">
                        <span className="inline-flex items-center gap-2 text-grey/60">
                            <NotebookPen className="h-4 w-4 text-teal/70" />
                            Notas
                        </span>
                        <span className="font-bold text-teal-dark">{notesThisMonth}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-cream/40 px-3 py-3 text-sm">
                        <span className="inline-flex items-center gap-2 text-grey/60">
                            <BookOpen className="h-4 w-4 text-teal/70" />
                            Libros
                        </span>
                        <span className="font-bold text-teal-dark">{booksWithNotes}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-cream/40 px-3 py-3 text-sm">
                        <span className="inline-flex items-center gap-2 text-grey/60">
                            <HelpCircle className="h-4 w-4 text-teal/70" />
                            Preguntas
                        </span>
                        <span className="font-bold text-teal-dark">{questionsCount}</span>
                    </div>
                </div>
            </Card>

            <Card className="border border-teal/10 bg-[#D8E2DC]/25 shadow-sm">
                <p className="mb-2 text-sm font-bold text-teal-dark">Sugerencia</p>
                <p className="text-xs leading-relaxed text-grey/60">
                    Usa etiquetas como #personaje, #idea o #final para encontrar tus notas más rápido.
                </p>
            </Card>
        </div>
    );
}
