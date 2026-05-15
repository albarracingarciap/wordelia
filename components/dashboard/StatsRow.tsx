import { Chip } from "../ui/Chip";

interface StatsRowProps {
    streakDays?: number | null;
    weeklyPages?: number | null;
    activeClubs?: number | null;
    spoilerMode?: boolean;
}

export function StatsRow({ streakDays, weeklyPages, activeClubs, spoilerMode }: StatsRowProps) {
    const formatValue = (val: number | null | undefined, suffix: string, prefix: string = "") => {
        if (val === null || val === undefined) return "N/A";
        return `${prefix}${val} ${suffix}`;
    };

    return (
        <div className="mb-6 flex flex-wrap gap-2 pb-1 md:mb-8 md:gap-3">
            <Chip
                label={`Racha: ${formatValue(streakDays, "días")}`}
                variant="neutral"
                size="sm"
                className="shrink-0 bg-white/50 border-teal/5 text-grey/80"
            />
            <Chip
                label={`Esta semana: ${formatValue(weeklyPages, "págs", "+")}`}
                variant="neutral"
                size="sm"
                className="shrink-0 bg-white/50 border-teal/5 text-grey/80"
            />
            <Chip
                label={`Clubs: ${formatValue(activeClubs, "activos")}`}
                variant="neutral"
                size="sm"
                className="shrink-0 bg-white/50 border-teal/5 text-grey/80"
            />
            {spoilerMode && (
                <Chip
                    label="Modo sin spoilers"
                    variant="selected"
                    size="sm"
                    className="shrink-0 border-coral/20 bg-coral/5 text-coral"
                />
            )}
        </div>
    );
}
