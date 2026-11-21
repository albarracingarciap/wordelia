// Formato de fechas del shell móvil. Zona fija Europe/Madrid para que el HTML
// renderizado en el servidor (UTC en Docker) y el del navegador coincidan.
const TZ = "Europe/Madrid";

const dayTime = new Intl.DateTimeFormat("es-ES", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
});

const dayOnly = new Intl.DateTimeFormat("es-ES", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
});

const dateKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

/** "vie, 21 nov, 19:30" — o "Hoy, 19:30" / "Mañana, 19:30". */
export function formatWhen(iso: string, withTime = true): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const key = dateKey.format(d);
    const today = dateKey.format(new Date());
    const tomorrow = dateKey.format(new Date(Date.now() + 86400000));
    const time = new Intl.DateTimeFormat("es-ES", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(d);
    if (key === today) return withTime ? `Hoy, ${time}` : "Hoy";
    if (key === tomorrow) return withTime ? `Mañana, ${time}` : "Mañana";
    return (withTime ? dayTime : dayOnly).format(d);
}
