#!/usr/bin/env tsx

/**
 * Fase 0 — Bootstrap de los billing plans de PayPal (Subscriptions API).
 *
 * Crea (de forma idempotente) los 3 products y 6 billing plans de Wordelia en la
 * cuenta de PayPal del entorno actual (sandbox o live, según PAYPAL_ENV) y vuelca
 * las líneas PAYPAL_PLAN_* listas para pegar en .env.local.
 *
 *   Voraz       →  mensual 6,99 € · anual 67,10 €
 *   Bibliófilo  →  mensual 14,99 € · anual 143,90 €
 *   Librería Pro→  mensual 24,99 € · anual 239,90 €
 *
 * Los importes se derivan de lib/pricing.ts (única fuente de verdad). Idempotente:
 * si un product/plan con el mismo nombre ya existe, lo reutiliza en lugar de
 * duplicarlo. Ejecuta una vez por entorno (los plan_id difieren entre sandbox y live).
 *
 * Uso:
 *   npx tsx scripts/paypal-setup-plans.ts
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getPrice, type BillingPeriod } from '../lib/pricing';

// --- Config de entorno ------------------------------------------------------

const BASE = process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('❌ Faltan PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET en .env.local');
    process.exit(1);
}

const CURRENCY = 'EUR';

// --- Definición de products y planes ---------------------------------------

interface PlanDef {
    envKey: string;          // línea a exportar en .env.local
    name: string;            // nombre del plan (sirve de clave de idempotencia)
    period: BillingPeriod;
    amountCents: number;     // derivado de lib/pricing.ts
}

interface ProductDef {
    name: string;            // clave de idempotencia del product
    description: string;
    plans: PlanDef[];
}

function userAmount(referenceId: string, period: BillingPeriod): number {
    const p = getPrice({ productType: 'user_plan', referenceId, period });
    if (!p) throw new Error(`Sin precio para user_plan ${referenceId}/${period}`);
    return p.amount_cents;
}

function orgAmount(period: BillingPeriod): number {
    const p = getPrice({ productType: 'org_subscription', referenceId: 'x', period });
    if (!p) throw new Error(`Sin precio para org_subscription/${period}`);
    return p.amount_cents;
}

const PRODUCTS: ProductDef[] = [
    {
        name: 'Wordelia Voraz',
        description: 'Plan Voraz de Wordelia — acceso a genomas literarios.',
        plans: [
            { envKey: 'PAYPAL_PLAN_VORAZ_MONTHLY', name: 'Voraz mensual', period: 'monthly', amountCents: userAmount('voraz', 'monthly') },
            { envKey: 'PAYPAL_PLAN_VORAZ_ANNUAL', name: 'Voraz anual', period: 'annual', amountCents: userAmount('voraz', 'annual') },
        ],
    },
    {
        name: 'Wordelia Bibliófilo',
        description: 'Plan Bibliófilo de Wordelia — genomas, guías y asistente literario IA.',
        plans: [
            { envKey: 'PAYPAL_PLAN_AI_MONTHLY', name: 'Bibliófilo mensual', period: 'monthly', amountCents: userAmount('ai', 'monthly') },
            { envKey: 'PAYPAL_PLAN_AI_ANNUAL', name: 'Bibliófilo anual', period: 'annual', amountCents: userAmount('ai', 'annual') },
        ],
    },
    {
        name: 'Wordelia Librería Pro',
        description: 'Plan Pro para librerías anfitrionas de clubs en Wordelia.',
        plans: [
            { envKey: 'PAYPAL_PLAN_ORG_PRO_MONTHLY', name: 'Librería Pro mensual', period: 'monthly', amountCents: orgAmount('monthly') },
            { envKey: 'PAYPAL_PLAN_ORG_PRO_ANNUAL', name: 'Librería Pro anual', period: 'annual', amountCents: orgAmount('annual') },
        ],
    },
];

// --- Cliente PayPal (mínimo, solo para el bootstrap) -----------------------

async function getToken(): Promise<string> {
    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const res = await fetch(`${BASE}/v1/oauth2/token`, {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=client_credentials',
    });
    if (!res.ok) throw new Error(`PayPal token error: ${res.status} ${await res.text()}`);
    return (await res.json()).access_token as string;
}

async function api(token: string, method: string, endpoint: string, body?: unknown): Promise<any> {
    const res = await fetch(`${BASE}${endpoint}`, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`PayPal ${method} ${endpoint} → ${res.status} ${JSON.stringify(data)}`);
    return data;
}

// Recorre todas las páginas de products buscando uno por nombre.
async function findProductByName(token: string, name: string): Promise<string | null> {
    let page = 1;
    while (true) {
        const data = await api(token, 'GET', `/v1/catalogs/products?page_size=20&page=${page}&total_required=true`);
        const match = (data.products ?? []).find((p: any) => p.name === name);
        if (match) return match.id as string;
        const total = data.total_pages ?? 1;
        if (page >= total) return null;
        page += 1;
    }
}

async function ensureProduct(token: string, def: ProductDef): Promise<string> {
    const existing = await findProductByName(token, def.name);
    if (existing) {
        console.log(`  · product "${def.name}" ya existe → ${existing}`);
        return existing;
    }
    const created = await api(token, 'POST', '/v1/catalogs/products', {
        name: def.name,
        description: def.description,
        type: 'SERVICE',
        category: 'SOFTWARE',
    });
    console.log(`  ✓ product "${def.name}" creado → ${created.id}`);
    return created.id as string;
}

async function findPlanByName(token: string, productId: string, name: string): Promise<string | null> {
    let page = 1;
    while (true) {
        const data = await api(token, 'GET', `/v1/billing/plans?product_id=${productId}&page_size=20&page=${page}&total_required=true`);
        const match = (data.plans ?? []).find((p: any) => p.name === name);
        if (match) return match.id as string;
        const total = data.total_pages ?? 1;
        if (page >= total) return null;
        page += 1;
    }
}

async function ensurePlan(token: string, productId: string, plan: PlanDef): Promise<string> {
    const existing = await findPlanByName(token, productId, plan.name);
    if (existing) {
        // PayPal billing plans son inmutables en importe. Si el precio de
        // pricing.ts cambió, el plan existente sigue con el viejo: avisamos alto.
        const detail = await api(token, 'GET', `/v1/billing/plans/${existing}`);
        const currentValue = detail?.billing_cycles?.[0]?.pricing_scheme?.fixed_price?.value;
        const wantValue = (plan.amountCents / 100).toFixed(2);
        if (currentValue && currentValue !== wantValue) {
            console.warn(`  ⚠ plan "${plan.name}" existe a ${currentValue} ${CURRENCY} pero pricing.ts pide ${wantValue}. Los planes son INMUTABLES: crea uno nuevo (renómbralo) o borra/renombra el actual y vuelve a ejecutar.`);
        } else {
            console.log(`  · plan "${plan.name}" ya existe → ${existing} (${currentValue ?? '?'} ${CURRENCY})`);
        }
        return existing;
    }
    const intervalUnit = plan.period === 'annual' ? 'YEAR' : 'MONTH';
    const value = (plan.amountCents / 100).toFixed(2);
    const created = await api(token, 'POST', '/v1/billing/plans', {
        product_id: productId,
        name: plan.name,
        status: 'ACTIVE',
        billing_cycles: [
            {
                frequency: { interval_unit: intervalUnit, interval_count: 1 },
                tenure_type: 'REGULAR',
                sequence: 1,
                total_cycles: 0, // 0 = indefinido (renueva hasta cancelación)
                pricing_scheme: { fixed_price: { value, currency_code: CURRENCY } },
            },
        ],
        payment_preferences: {
            auto_bill_outstanding: true,
            setup_fee: { value: '0', currency_code: CURRENCY },
            setup_fee_failure_action: 'CONTINUE',
            payment_failure_threshold: 3,
        },
    });
    console.log(`  ✓ plan "${plan.name}" (${value} ${CURRENCY}/${plan.period}) creado → ${created.id}`);
    return created.id as string;
}

// --- Main -------------------------------------------------------------------

async function main() {
    const env = process.env.PAYPAL_ENV === 'live' ? 'LIVE' : 'SANDBOX';
    console.log(`\n🔧 Bootstrap de billing plans de PayPal — entorno: ${env}\n`);

    const token = await getToken();
    const envLines: string[] = [];

    for (const product of PRODUCTS) {
        console.log(`▸ ${product.name}`);
        const productId = await ensureProduct(token, product);
        for (const plan of product.plans) {
            const planId = await ensurePlan(token, productId, plan);
            envLines.push(`${plan.envKey}=${planId}`);
        }
        console.log('');
    }

    console.log('────────────────────────────────────────────────────────────');
    console.log('Pega estas líneas en .env.local (entorno ' + env + '):\n');
    console.log(envLines.join('\n'));
    console.log('\n────────────────────────────────────────────────────────────');
    console.log('Hecho. Recuerda ejecutar de nuevo en el entorno LIVE antes de producción.');
}

main().catch((e) => {
    console.error('\n❌ Error en el bootstrap:', e.message || e);
    process.exit(1);
});
