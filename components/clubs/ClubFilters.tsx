import { SearchInput } from "../ui/SearchInput";
import { Select } from "../ui/Select";
import { Chip } from "../ui/Chip";

export const CLUB_FILTERS = [
    "Sin spoilers",
    "Ritmo: suave",
    "Nivel: todos",
    "Formato: papel/ebook",
    "Idioma: Español",
];

interface ClubFiltersProps {
    searchQuery: string;
    sortBy: string;
    activeFilters: string[];
    onSearchChange: (value: string) => void;
    onSortChange: (value: string) => void;
    onToggleFilter: (filter: string) => void;
    onClearFilters: () => void;
}

export function ClubFilters({
    searchQuery,
    sortBy,
    activeFilters,
    onSearchChange,
    onSortChange,
    onToggleFilter,
    onClearFilters,
}: ClubFiltersProps) {
    const hasActiveFilters = searchQuery.trim() || activeFilters.length > 0 || sortBy !== "active";

    return (
        <div className="sticky top-[56px] z-20 space-y-4 border-b border-teal/10 bg-cream/95 py-5 backdrop-blur-sm md:top-[72px]">
            <div className="flex flex-col gap-3 md:flex-row md:gap-4">
                <div className="flex-1">
                    <SearchInput
                        placeholder="Buscar clubs por libro, tema o estilo..."
                        value={searchQuery}
                        onChange={(event) => onSearchChange(event.currentTarget.value)}
                    />
                </div>
                <div className="w-full max-w-[240px] md:w-48">
                    <Select
                        value={sortBy}
                        onChange={(event) => onSortChange(event.currentTarget.value)}
                        className="w-full"
                        options={[
                            { label: "Más activos", value: "active" },
                            { label: "Empiezan pronto", value: "soon" },
                            { label: "Nuevos", value: "new" },
                        ]}
                    />
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {CLUB_FILTERS.map((filter) => (
                    <Chip
                        key={filter}
                        label={filter}
                        variant="filter"
                        active={activeFilters.includes(filter)}
                        onClick={() => onToggleFilter(filter)}
                        className="min-h-10 px-3 text-[12px] leading-tight shadow-sm"
                    />
                ))}
                <button
                    type="button"
                    onClick={onClearFilters}
                    disabled={!hasActiveFilters}
                    className="min-h-10 rounded-full border border-transparent px-3 text-xs font-bold text-grey/50 transition-colors hover:border-teal/10 hover:bg-white hover:text-teal disabled:cursor-default disabled:opacity-35 disabled:hover:border-transparent disabled:hover:bg-transparent disabled:hover:text-grey/50"
                >
                    Limpiar
                </button>
            </div>
        </div>
    );
}
