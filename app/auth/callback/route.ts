import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { getAppOrigin } from '@/lib/app-origin'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    // Origen público (wordelia.es). NO usar new URL(request.url).origin: dentro del
    // contenedor es el host interno (https://localhost:3001) y las redirecciones
    // acababan en localhost.
    const origin = await getAppOrigin()
    const code = searchParams.get('code')
    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/app/mi-lectura'

    const supabase = await createClient()

    // Soporta ambos flujos de confirmación: PKCE (?code=) y OTP (?token_hash=&type=).
    let ok = false
    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        ok = !error
    } else if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
        ok = !error
    }

    if (ok) {
        // Monedas Wordelia: ahora que hay sesión (email confirmado), registra el
        // referido pendiente de la cookie de invitación y límpiala.
        try {
            const cookieStore = await cookies()
            const ref = cookieStore.get('wordelia_ref')?.value
            if (ref) {
                await supabase.rpc('record_referral', { p_code: ref })
                cookieStore.delete('wordelia_ref')
            }
        } catch (referralError) {
            console.error('[auth/callback] record_referral:', referralError)
        }

        // Destino: si el `next` es el genérico (login/registro por Google o
        // confirmación de email) y el usuario aún no ha hecho el onboarding, lo
        // guiamos allí (sin atraparlo: puede salir con "Hacerlo más tarde"). Si
        // hay un `next` explícito (p.ej. /auth/nueva-password del reset), se respeta.
        let dest = next
        if (dest === '/app/mi-lectura') {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('onboarding_completed')
                    .eq('id', user.id)
                    .maybeSingle()
                if (profile && !profile.onboarding_completed) dest = '/app/onboarding'
            }
        }

        return NextResponse.redirect(`${origin}${dest}`)
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
