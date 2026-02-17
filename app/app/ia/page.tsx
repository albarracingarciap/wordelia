import { EmptyState } from "@/components/ui/EmptyState";

export default function IALiterariaPage() {
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-serif text-teal">IA Literaria</h1>
                <p className="text-grey/60">Análisis profundo de tus libros favoritos.</p>
            </div>
            <EmptyState
                title="Tu asistente literario"
                description="Analiza tramas, personajes y estilos con nuestra IA."
                actionLabel="Probar demo"
            />
        </div>
    );
}
