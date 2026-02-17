import { EmptyState } from "@/components/ui/EmptyState";

export default function GuardadosPage() {
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-serif text-teal">Guardados</h1>
                <p className="text-grey/60">Tus listas y libros pendientes.</p>
            </div>
            <EmptyState
                title="Tus listas de lectura"
                description="Guarda aquí los libros que quieres leer en el futuro."
                actionLabel="Crear lista"
            />
        </div>
    );
}
