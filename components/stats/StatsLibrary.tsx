import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

export function StatsLibrary() {
    return (
        <div className="space-y-6">
            <section>
                <Card title="Géneros y temas">
                    <div className="space-y-3 mt-4">
                        {[
                            { label: "Distopía", count: 12, pct: 80 },
                            { label: "Clásicos", count: 8, pct: 50 },
                            { label: "Feminismo", count: 6, pct: 40 },
                            { label: "Misterio", count: 4, pct: 25 },
                        ].map(tag => (
                            <div key={tag.label} className="flex items-center gap-3">
                                <span className="w-24 text-sm text-grey truncate text-right">{tag.label}</span>
                                <div className="flex-1 h-2 bg-grey/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-teal opacity-60" style={{ width: `${tag.pct}%` }} />
                                </div>
                                <span className="w-8 text-xs text-grey/60">{tag.count}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 text-center">
                        <Button variant="ghost" size="sm" className="text-xs">Ver más etiquetas</Button>
                    </div>
                </Card>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Autores recurrentes">
                    <ul className="space-y-3 mt-2">
                        {[
                            { name: "Ursula K. Le Guin", count: 3 },
                            { name: "Margaret Atwood", count: 2 },
                            { name: "Frank Herbert", count: 2 },
                        ].map((author, i) => (
                            <li key={i} className="flex justify-between items-center py-1 border-b border-dashed border-teal/5 last:border-0">
                                <span className="text-sm text-grey-dark">{author.name}</span>
                                <span className="text-xs font-bold text-teal bg-teal/5 px-2 py-0.5 rounded-full">{author.count} libros</span>
                            </li>
                        ))}
                    </ul>
                </Card>

                <Card className="bg-[#D8E2DC]/20 border-none flex flex-col justify-center">
                    <h3 className="font-serif text-teal text-lg mb-4 text-center">Longitud y complejidad</h3>
                    <div className="flex justify-around text-center mb-4">
                        <div>
                            <span className="block text-2xl font-bold text-teal-dark">320</span>
                            <span className="text-xs text-grey/60 uppercase tracking-widest">Promedio Pág.</span>
                        </div>
                        <div>
                            <span className="block text-2xl font-bold text-teal-dark">Media</span>
                            <span className="text-xs text-grey/60 uppercase tracking-widest">Complejidad</span>
                        </div>
                    </div>
                    <p className="text-center text-[10px] text-grey/40 opacity-70">"Esto no es un examen. Es una foto de tus gustos."</p>
                </Card>
            </div>
        </div>
    );
}
