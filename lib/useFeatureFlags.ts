"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { DEFAULT_FEATURE_FLAGS, mergeFlags, type FeatureFlags } from "@/lib/feature-flags";

// Lee los feature flags (fila pública `flags` de app_settings) desde el cliente.
// Devuelve los defaults hasta que resuelve la lectura (evita ocultar features por
// un fallo transitorio). La fuente de la verdad para gating server es getAppSettings.
export function useFeatureFlags(): FeatureFlags {
    const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);

    useEffect(() => {
        let active = true;
        const supabase = createClient();
        (async () => {
            const { data } = await supabase
                .from("app_settings")
                .select("value")
                .eq("key", "flags")
                .maybeSingle();
            if (active && data) setFlags(mergeFlags(data.value));
        })();
        return () => {
            active = false;
        };
    }, []);

    return flags;
}
