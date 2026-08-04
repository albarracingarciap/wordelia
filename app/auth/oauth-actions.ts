'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

// Server action usable directamente como `action` de un <form>: no devuelve
// valor (redirige siempre). El callback vive en /auth/callback (ruta pública que
// intercambia el code por sesión y registra el referido). Antes apuntaba a
// /app/auth/callback, que NO existe y caía en zona protegida → login colgado.
export async function signInWithGoogle() {
    const supabase = await createClient()
    const origin = (await headers()).get('origin')

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${origin}/auth/callback`,
        },
    })

    if (error) {
        console.error('[signInWithGoogle]', error)
        redirect('/login?error=google')
    }

    if (data?.url) redirect(data.url)
    redirect('/login?error=google')
}

export async function signInWithApple(formData: FormData) {
    // Apple auth implementation similar to Google
    // Note: Apple often requires more setup (Service ID, Key, etc.)
    // For now, we'll placeholder it or implement if credentials exist
    return { error: "Apple Sign-In configuration required" }
}
