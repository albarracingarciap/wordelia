// Server-only. Mapea (productType, referenceId, period) → el billing plan id de
// PayPal (P-XXXX) creado por scripts/paypal-setup-plans.ts, y viceversa. Los
// plan_id viven en variables de entorno (PAYPAL_PLAN_*) y difieren por entorno
// (sandbox/live), por eso nunca se hardcodean aquí.

import type { BillingPeriod, ProductType } from './pricing';

// Nombres de las env vars que guardan cada plan_id.
const USER_PLAN_ENV: Record<string, Record<BillingPeriod, string>> = {
    voraz: { monthly: 'PAYPAL_PLAN_VORAZ_MONTHLY', annual: 'PAYPAL_PLAN_VORAZ_ANNUAL' },
    ai: { monthly: 'PAYPAL_PLAN_AI_MONTHLY', annual: 'PAYPAL_PLAN_AI_ANNUAL' },
};

const ORG_PLAN_ENV: Record<BillingPeriod, string> = {
    monthly: 'PAYPAL_PLAN_ORG_PRO_MONTHLY',
    annual: 'PAYPAL_PLAN_ORG_PRO_ANNUAL',
};

function readEnv(key: string): string | null {
    const v = process.env[key];
    return v && v.trim() ? v.trim() : null;
}

export interface PlanRef {
    productType: ProductType;
    referenceId: string;              // plan code (user) | org id (org, irrelevante al plan)
    period: BillingPeriod;
}

/** Devuelve el plan_id de PayPal para una suscripción, o null si no aplica/no está configurado. */
export function resolvePlanId(input: PlanRef): string | null {
    const { productType, referenceId, period } = input;
    if (period !== 'monthly' && period !== 'annual') return null;

    if (productType === 'user_plan') {
        const map = USER_PLAN_ENV[referenceId];
        return map ? readEnv(map[period]) : null;
    }
    if (productType === 'org_subscription') {
        // Todas las librerías comparten el mismo plan Pro; solo cambia la periodicidad.
        return readEnv(ORG_PLAN_ENV[period]);
    }
    return null; // 'resource' / 'club' son pago único, no suscripción
}

export interface PlanMeta {
    productType: 'user_plan' | 'org_subscription';
    planCode: string | null;          // 'voraz' | 'ai' para user; null para org
    period: BillingPeriod;
}

/**
 * Inverso de resolvePlanId: dado un plan_id de PayPal, identifica a qué
 * producto/plan/periodo corresponde. Lo usa el webhook para reflejar
 * upgrades/downgrades (BILLING.SUBSCRIPTION.UPDATED) en la fila local.
 */
export function planMetaFromId(planId: string): PlanMeta | null {
    for (const [code, map] of Object.entries(USER_PLAN_ENV)) {
        for (const period of ['monthly', 'annual'] as BillingPeriod[]) {
            if (readEnv(map[period]) === planId) {
                return { productType: 'user_plan', planCode: code, period };
            }
        }
    }
    for (const period of ['monthly', 'annual'] as BillingPeriod[]) {
        if (readEnv(ORG_PLAN_ENV[period]) === planId) {
            return { productType: 'org_subscription', planCode: null, period };
        }
    }
    return null;
}
