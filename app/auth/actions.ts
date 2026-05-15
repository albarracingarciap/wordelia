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

    if (normalized.includes('password')) {
        return 'La contraseña no cumple los requisitos mínimos.';
    }

    if (normalized.includes('email')) {
        return 'Revisa el email introducido.';
    }

    return message || 'No se ha podido completar la acción. Inténtalo de nuevo.';
}

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/app/mi-lectura')
}

export async function signup(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
    const supabase = await createClient()

    const email = String(formData.get('email') || '').trim().toLowerCase()
    const password = String(formData.get('password') || '')
    const name = String(formData.get('name') || '').trim()

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
            }
        }
    })

    if (error) {
        return { error: getAuthErrorMessage(error.message) }
    }

    revalidatePath('/', 'layout')
    // Redirect to onboarding for new users
    redirect('/app/onboarding')
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}
