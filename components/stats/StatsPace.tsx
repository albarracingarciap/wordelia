import { Card } from "../ui/Card";
import { SimpleChart } from "./SimpleChart";
import { Button } from "../ui/Button";

export function StatsPace() {
    return (
        <div className="space-y-8">
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-grey/40 uppercase tracking-widest">Progreso (Últimos 30 días)</h3>
                    <div className="flex gap-2">
                        <button className="px-2 py-1 text-xs font-bold text-white bg-teal rounded-md">Minutos</button>
                        <button className="px-2 py-1 text-xs font-medium text-grey hover:bg-grey/10 rounded-md transition-colors">Páginas</button>
                    </div>
                </div>
                <Card className="h-64 flex items-end pb-4 px-4 bg-white">
                    {/* Placeholder for a line chart using SimpleChart logic or SparkLine for now */}
                    <SimpleChart
                        type="bar"
                        color="bg-teal/60"
                        data={[
                            { label: "Sem 1", value: 120 },
                            { label: "Sem 2", value: 180 },
                            { label: "Sem 3", value: 90 },
                            { label: "Sem 4", value: 210 },
                        ]}
                        height={200}
                    />
                </Card>
                <p className="text-center text-sm text-grey/60 mt-4 italic">"Cuando registras aunque sea poquito, tu hábito se sostiene."</p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Momentos del día">
                    <div className="pt-4">
                        <SimpleChart
                            type="bar"
                            color="bg-coral"
                            height={120}
                            data={[
                                { label: "Mañana", value: 15 },
                                { label: "Tarde", value: 25 },
                                { label: "Noche", value: 60 },
                            ]}
                        />
                    </div>
                </Card>
                <Card title="Días de la semana">
                    <div className="pt-4">
                        <SimpleChart
                            type="bar"
                            color="bg-teal"
                            height={120}
                            data={[
                                { label: "L", value: 20 },
                                { label: "M", value: 50 },
                                { label: "X", value: 30 },
                                { label: "J", value: 40 },
                                { label: "V", value: 60 },
                                { label: "S", value: 80 },
                                { label: "D", value: 70 },
                            ]}
                        />
                    </div>
                </Card>
            </div>
        </div>
    );
}
