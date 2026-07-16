'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

type AuthActionState = {
    error: string;
} | null;

function getAuthErrorMessage(message: string) {
    const normalized = message.toLowerCase();

    if (normalized.includes('already registered') || normalized.includes('already exists') || normalized.includes('user already')) {
        return 'Ya existe una cuenta con este email. Prueba a iniciar sesión.';
    }

    if (normalized.includes('invalid login credentials') || normalized.includes('invalid credentials')) {
        return 'Email o contraseña incorrectos. Revisa los datos e inténtalo de nuevo.';
    }

    if (normalized.includes('password')) {
        return 'La contraseña no cumple los requisitos mínimos.';
    }

    if (normalized.includes('email')) {
        return 'Revisa el email introducido.';
    }

    return message || 'No se ha podido completar la acción. Inténtalo de nuevo.';
}

function cleanOptionalValue(value: FormDataEntryValue | null, maxLength = 80) {
    const text = String(value || '').trim().toLowerCase();
    return text ? text.slice(0, maxLength) : null;
}

function getRequestedPlan(intent: string | null, plan: string | null) {
    const candidate = plan || (intent?.startsWith('plan-') ? intent.replace('plan-', '') : null);
    return candidate && ['explorador', 'voraz', 'ai'].includes(candidate) ? candidate : null;
}

// Solo se permite volver a rutas internas: debe empezar por "/" pero no por "//"
// (una URL protocol-relative como //evil.com sería un open redirect).
function getSafeRedirect(next: FormDataEntryValue | null, fallback = '/app/mi-lectura') {
    const target = String(next || '')
    return target.startsWith('/') && !target.startsWith('//') ? target : fallback
}

export async function login(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
    const supabase = await createClient()

    const email = String(formData.get('email') || '').trim().toLowerCase()
    const password = String(formData.get('password') || '')
    const nextUrl = getSafeRedirect(formData.get('next'))

    if (!email || !email.includes('@')) {
        return { error: 'Introduce un email válido.' }
    }

    if (!password) {
        return { error: 'Introduce tu contraseña.' }
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: getAuthErrorMessage(error.message) }
    }

    revalidatePath('/', 'layout')
    redirect(nextUrl)
}

export async function signup(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
    const supabase = await createClient()

    const email = String(formData.get('email') || '').trim().toLowerCase()
    const password = String(formData.get('password') || '')
    const name = String(formData.get('name') || '').trim()
    const signupSource = cleanOptionalValue(formData.get('signup_source'))
    const signupIntent = cleanOptionalValue(formData.get('signup_intent'))
    const requestedPlan = getRequestedPlan(signupIntent, cleanOptionalValue(formData.get('requested_plan')))
    const rawBillingPeriod = cleanOptionalValue(formData.get('billing_period'))
    const billingPeriod = rawBillingPeriod === 'annual' || rawBillingPeriod === 'monthly' ? rawBillingPeriod : null
    const newsletterOptIn = formData.get('newsletter_opt_in') === 'on'
    // Si venimos de /planes con un plan elegido, volvemos ahí a pagar; si no,
    // al onboarding. El onboarding igualmente se fuerza al entrar en /app.
    const nextUrl = getSafeRedirect(formData.get('next'), '/app/onboarding')

    if (!name) {
        return { error: 'Introduce tu nombre completo.' }
    }

    if (!email || !email.includes('@')) {
        return { error: 'Introduce un email válido.' }
    }

    if (password.length < 8) {
        return { error: 'La contraseña debe tener al menos 8 caracteres.' }
    }

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: name,
                signup_source: signupSource,
                signup_intent: signupIntent,
                requested_plan: requestedPlan,
                billing_period: billingPeriod,
                newsletter_opt_in: newsletterOptIn,
            }
        }
    })

    if (error) {
        return { error: getAuthErrorMessage(error.message) }
    }

    revalidatePath('/', 'layout')
    redirect(nextUrl)
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}
