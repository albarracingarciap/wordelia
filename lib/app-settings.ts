// Configuración global de Wordelia (tabla app_settings, clave-valor jsonb).
// getAppSettings() lee con service role, así que es server-only. Los consumidores
// (panel de Ajustes y, más adelante, banner global / gate de fundador / flags)
// leen siempre a través de aquí para tener un único sitio con los defaults.
//
// La tabla no está en types/supabase.ts todavía, de ahí el cast (igual que
// contact_messages). Migración: app_settings_migration.sql.
import { createAdminClient } from "@/utils/supabase/admin";
import { type FeatureFlags, DEFAULT_FEATURE_FLAGS, mergeFlags } from "./feature-flags";

export type { FeatureFlags } from "./feature-flags";

export interface AnnouncementSetting {
    enabled: boolean;
    message: string;
    variant: "info" | "warning";
    /** Fecha (YYYY-MM-DD) tras la cual el aviso deja de mostrarse. null = sin caducidad. */
    expires_at: string | null;
}

export interface FounderWindowSetting {
    enabled: boolean;
    ends_at: string | null; // YYYY-MM-DD
}

export interface AppSettings {
    announcement: AnnouncementSetting;
    founder_window: FounderWindowSetting;
    flags: FeatureFlags;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
    announcement: { enabled: false, message: "", variant: "info", expires_at: null },
    founder_window: { enabled: true, ends_at: "2026-09-01" },
    flags: DEFAULT_FEATURE_FLAGS,
};

export const APP_SETTINGS_KEYS = ["announcement", "founder_window", "flags"] as const;

/** Lee toda la configuración, mezclando con los defaults (tolera claves ausentes). */
export async function getAppSettings(): Promise<AppSettings> {
    try {
        const admin = createAdminClient() as unknown as { from: (table: string) => any };
        const { data, error } = await admin.from("app_settings").select("key, value");
        if (error) throw error;

        const map = new Map<string, any>((data ?? []).map((r: any) => [r.key, r.value]));
        return {
            announcement: { ...DEFAULT_APP_SETTINGS.announcement, ...(map.get("announcement") ?? {}) },
            founder_window: { ...DEFAULT_APP_SETTINGS.founder_window, ...(map.get("founder_window") ?? {}) },
            flags: mergeFlags(map.get("flags")),
        };
    } catch (e) {
        console.error("getAppSettings:", e);
        return DEFAULT_APP_SETTINGS;
    }
}
