import * as React from "react";

interface DataPoint {
    label: string;
    value: number;
    tooltip?: string;
}

interface SimpleChartProps {
    type: "bar" | "line"; // For now simplified
    data: DataPoint[];
    height?: number;
    color?: string;
    className?: string;
}

export function SimpleChart({ type, data, height = 150, color = "bg-teal", className = "" }: SimpleChartProps) {
    const maxValue = Math.max(...data.map(d => d.value), 1); // Avoid div by zero

    return (
        <div className={`w-full ${className}`} style={{ height }}>
            <div className="flex items-end justify-between h-full gap-2 pt-6">
                {data.map((d, i) => {
                    const heightPercent = (d.value / maxValue) * 100;
                    return (
                        <div key={i} className="group relative flex flex-col items-center justify-end h-full flex-1">
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-teal-dark text-white text-[10px] px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10">
                                {d.tooltip || d.value}
                            </div>

                            {/* Bar */}
                            <div
                                className={`w-full max-w-[20px] rounded-t-sm transition-all duration-500 ease-out ${color} opacity-80 hover:opacity-100`}
                                style={{ height: `${heightPercent}%` }}
                            />

                            {/* Label */}
                            <div className="mt-2 text-[10px] text-grey/60 truncate w-full text-center">
                                {d.label}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Sparkline variant for mini charts
export function SparkLine({ data, color = "stroke-teal" }: { data: number[], color?: string }) {
    const max = Math.max(...data, 1);
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - (val / max) * 100;
        return `${x},${y}`;
    }).join(" ");

    return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
            <polyline
                points={points}
                fill="none"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                className={color}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
