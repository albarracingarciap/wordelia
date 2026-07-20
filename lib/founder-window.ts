// Lógica pura (server + client safe) de si la ventana de fundador está abierta.
// Refleja la MISMA regla que el trigger SQL handle_new_user: abierta = habilitada
// y (sin fecha de fin o aún dentro de ella). El tope de 200 plazas no se evalúa
// aquí (es de servidor/BD); esto gobierna el DISPLAY del beneficio en la landing.
//
// Consumidores: app/page.tsx (home, server, vía getAppSettings) y app/planes
// (client, leyendo la fila pública founder_window de app_settings).

export interface FounderWindowLike {
    enabled?: boolean;
    ends_at?: string | null;
}

/** True si el aviso de fundador debe mostrarse (ventana habilitada y no caducada). */
export function isFounderWindowOpen(w: FounderWindowLike | null | undefined, now: Date = new Date()): boolean {
    if (!w?.enabled) return false;
    if (w.ends_at) {
        const end = new Date(`${w.ends_at}T23:59:59`);
        if (!Number.isNaN(end.getTime()) && now > end) return false;
    }
    return true;
}
