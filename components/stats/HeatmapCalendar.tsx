"use client";

import * as React from "react";
import type { HeatmapDay } from "@/app/app/mi-lectura/estadisticas-actions";

interface HeatmapCalendarProps {
    data: HeatmapDay[];
    metric?: "minutes" | "pages" | "sessions";
    weeks?: number;
}

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const WEEKDAY_LABELS = ["L", "", "X", "", "V", "", "D"];

function pad(n: number): string {
    return String(n).padStart(2, "0");
}

function keyOf(d: Date): string {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type Cell = { date: string; value: number } | null;

function metricLabel(value: number, metric: HeatmapCalendarProps["metric"]): string {
    if (metric === "minutes") return `${value} min`;
    if (metric === "pages") return `${value} pág`;
    return `${value} ${value === 1 ? "sesión" : "sesiones"}`;
}

// Escala de intensidad en 4 niveles relativos al máximo.
function levelClass(value: number, max: number): string {
    if (value <= 0) return "bg-grey/10";
    const ratio = value / max;
    if (ratio > 0.66) return "bg-teal";
    if (ratio > 0.33) return "bg-teal/70";
    if (ratio > 0.12) return "bg-teal/45";
    return "bg-teal/25";
}

export function HeatmapCalendar({ data, metric = "sessions", weeks = 53 }: HeatmapCalendarProps) {
    const { columns, monthMarkers, max } = React.useMemo(() => {
        const dayMap = new Map(data.map((d) => [d.date, d.value]));
        const max = Math.max(1, ...data.map((d) => d.value));

        const today = new Date();
        today.setHours(12, 0, 0, 0);
        const todayIdx = (today.getDay() + 6) % 7; // Lunes = 0

        // Lunes de la primera columna.
        const start = new Date(today);
        start.setDate(start.getDate() - todayIdx - (weeks - 1) * 7);

        const columns: Cell[][] = [];
        const monthMarkers: { col: number; label: string }[] = [];
        let lastMonth = -1;

        for (let w = 0; w < weeks; w++) {
            const col: Cell[] = [];
            for (let d = 0; d < 7; d++) {
                const cur = new Date(start);
                cur.setDate(start.getDate() + w * 7 + d);
                cur.setHours(12, 0, 0, 0);
                if (cur.getTime() > today.getTime()) { col.push(null); continue; }
                const key = keyOf(cur);
                col.push({ date: key, value: dayMap.get(key) || 0 });
                // Marca de mes: primera semana en la que aparece un mes nuevo (en la fila superior).
                if (d === 0 && cur.getMonth() !== lastMonth) {
                    monthMarkers.push({ col: w, label: MONTH_LABELS[cur.getMonth()] });
                    lastMonth = cur.getMonth();
                }
            }
            columns.push(col);
        }
        return { columns, monthMarkers, max };
    }, [data, weeks]);

    return (
        <div className="overflow-x-auto pb-1">
            <div className="inline-flex flex-col gap-1 min-w-max">
                {/* Etiquetas de meses */}
                <div className="flex gap-[3px] pl-6">
                    {columns.map((_, w) => {
                        const marker = monthMarkers.find((m) => m.col === w);
                        return (
                            <div key={w} className="w-[11px] text-[9px] text-grey/40">
                                {marker ? marker.label : ""}
                            </div>
                        );
                    })}
                </div>

                <div className="flex gap-[3px]">
                    {/* Etiquetas de días de la semana */}
                    <div className="flex flex-col gap-[3px] pr-1">
                        {WEEKDAY_LABELS.map((label, i) => (
                            <div key={i} className="h-[11px] w-4 text-[9px] leading-[11px] text-grey/40 text-right">
                                {label}
                            </div>
                        ))}
                    </div>

                    {/* Columnas (semanas) */}
                    {columns.map((col, w) => (
                        <div key={w} className="flex flex-col gap-[3px]">
                            {col.map((cell, d) => (
                                <div
                                    key={d}
                                    title={cell ? `${cell.date}: ${cell.value > 0 ? metricLabel(cell.value, metric) : "sin lectura"}` : ""}
                                    className={`h-[11px] w-[11px] rounded-[2px] ${cell ? levelClass(cell.value, max) : "bg-transparent"}`}
                                />
                            ))}
                        </div>
                    ))}
                </div>

                {/* Leyenda */}
                <div className="flex items-center justify-end gap-1 pt-1 text-[9px] text-grey/40">
                    <span>Menos</span>
                    <div className="h-[10px] w-[10px] rounded-[2px] bg-grey/10" />
                    <div className="h-[10px] w-[10px] rounded-[2px] bg-teal/25" />
                    <div className="h-[10px] w-[10px] rounded-[2px] bg-teal/45" />
                    <div className="h-[10px] w-[10px] rounded-[2px] bg-teal/70" />
                    <div className="h-[10px] w-[10px] rounded-[2px] bg-teal" />
                    <span>Más</span>
                </div>
            </div>
        </div>
    );
}
