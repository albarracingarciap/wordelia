interface StatsRowProps {
    streakDays?: number | null;
    weeklyPages?: number | null;
    activeClubs?: number | null;
    spoilerMode?: boolean;
}

export function StatsRow({ streakDays, weeklyPages, activeClubs, spoilerMode }: StatsRowProps) {
    const formatNumber = (value: number | null | undefined) => {
        if (value === null || value === undefined) return "N/A";
        return String(value);
    };

    const items = [
        {
            label: "Racha",
            value: streakDays === 1 ? "1 día" : `${formatNumber(streakDays)} días`,
        },
        {
            label: "Semana",
            value: weeklyPages === null || weeklyPages === undefined ? "N/A" : `+${weeklyPages} págs`,
        },
        {
            label: "Clubs",
            value: activeClubs === 1 ? "1 activo" : `${formatNumber(activeClubs)} activos`,
        },
    ];

    return (
        <div className="mb-6 grid w-full grid-cols-3 gap-2 md:mb-8 md:max-w-xl md:gap-3">
            {items.map(item => (
                <div
                    key={item.label}
                    className="min-w-0 rounded-2xl border border-teal/5 bg-white/55 px-2.5 py-2 text-center shadow-[0_8px_18px_rgba(0,0,0,0.03)]"
                >
                    <span className="block truncate text-[10px] font-bold uppercase tracking-[0.12em] text-grey/45">
                        {item.label}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] font-bold leading-tight text-grey/80 sm:text-sm">
                        {item.value}
                    </span>
                </div>
            ))}
            {spoilerMode && (
                <div className="col-span-3 rounded-2xl border border-coral/20 bg-coral/5 px-3 py-2 text-center text-xs font-bold text-coral sm:col-span-1">
                    Modo sin spoilers
                </div>
            )}
        </div>
    );
}
