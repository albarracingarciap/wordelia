'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

export async function signInWithGoogle(formData: FormData) {
    const supabase = await createClient()
    const origin = (await headers()).get('origin')

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        // El callback vive en /auth/callback (ruta pública que intercambia el code
        // por sesión y registra el referido). Antes apuntaba a /app/auth/callback,
        // que NO existe y además cae en zona protegida → el login quedaba colgado.
        options: {
            redirectTo: `${origin}/auth/callback`,
        },
    })

    if (error) {
        console.error(error)
        return { error: error.message }
    }

    if (data.url) {
        redirect(data.url)
    }
}

export async function signInWithApple(formData: FormData) {
    // Apple auth implementation similar to Google
    // Note: Apple often requires more setup (Service ID, Key, etc.)
    // For now, we'll placeholder it or implement if credentials exist
    return { error: "Apple Sign-In configuration required" }
}
