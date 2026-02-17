import { SearchInput } from "../ui/SearchInput";
import { Select } from "../ui/Select";
import { Chip } from "../ui/Chip";

export function ClubFilters() {
    return (
        <div className="py-4 space-y-4 sticky top-[64px] z-20 bg-cream/95 backdrop-blur-sm border-b border-black/5 pb-6">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <SearchInput placeholder="Buscar clubs por libro, tema o estilo..." />
                </div>
                <div className="w-full md:w-48">
                    <Select
                        options={[
                            { label: "Más activos", value: "active" },
                            { label: "Empiezan pronto", value: "soon" },
                            { label: "Nuevos", value: "new" },
                        ]}
                    />
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <Chip label="Sin spoilers" variant="filter" />
                <Chip label="Ritmo: suave" variant="filter" />
                <Chip label="Nivel: todos" variant="filter" />
                <Chip label="Formato: papel/ebook" variant="filter" />
                <Chip label="Idioma: Español" variant="filter" />
                <button className="text-xs text-grey/50 hover:text-teal font-medium px-2 whitespace-nowrap">
                    Limpiar filtros
                </button>
            </div>
        </div>
    );
}
