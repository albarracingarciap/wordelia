import { UI_MODE_COOKIE } from "@/lib/mobile-routing";

// Preferencia de interfaz en móvil: "full" = versión completa (/app), "mobile" = shell /m.
// El middleware (lib/mobile-routing) la lee para decidir si redirige a /m.
export type UiMode = "full" | "mobile";

export function setUiMode(mode: UiMode) {
    document.cookie = `${UI_MODE_COOKIE}=${mode}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export function getUiMode(): UiMode | null {
    const m = document.cookie.match(new RegExp(`(?:^|; )${UI_MODE_COOKIE}=(full|mobile)`));
    return (m?.[1] as UiMode | undefined) ?? null;
}
