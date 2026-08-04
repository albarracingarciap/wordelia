import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // IMPORTANT: DO NOT REMOVE auth.getUser()
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (
        !user &&
        !request.nextUrl.pathname.startsWith("/login") &&
        !request.nextUrl.pathname.startsWith("/register") &&
        !request.nextUrl.pathname.startsWith("/auth") &&
        !request.nextUrl.pathname.startsWith("/demo") &&
        !request.nextUrl.pathname.startsWith("/planes") &&
        !request.nextUrl.pathname.startsWith("/explorar") && // Allow public access to Explorar page
        !request.nextUrl.pathname.startsWith("/clubes") && // Allow public access to Clubes page
        !request.nextUrl.pathname.startsWith("/app/adn") && // Allow public access to ADN demo
        !request.nextUrl.pathname.startsWith("/deseos") && // Allow public access to Wishlist landing
        request.nextUrl.pathname !== "/"
    ) {
        // If not logged in and trying to access protected route (e.g. /app/*), redirect to login
        if (request.nextUrl.pathname.startsWith("/app")) {
            const url = request.nextUrl.clone();
            url.pathname = "/login";
            return NextResponse.redirect(url);
        }
    } else if (user) {
        // User is logged in
        // Check if onboarding is completed
        // We need to fetch the profile. 
        // Note: Ideally, we cache this or use metadata to avoid DB hit on every request.
        // For now, we query the DB.
        const { data: profile } = await supabase
            .from("profiles")
            .select("onboarding_completed")
            .eq("id", user.id)
            .single();

        const isOnboardingRoute = request.nextUrl.pathname === "/app/onboarding";
        const isCompleted = profile?.onboarding_completed;
        const isServerAction = request.headers.has("next-action");

        // Onboarding BLANDO: NO se fuerza. Al registrarse se envía al onboarding
        // (desde el signup / callback), pero el usuario puede salir con "Hacerlo
        // más tarde" y usar la app; un aviso en la app le deja retomarlo cuando
        // quiera. Antes se forzaba en cada visita a /app y dejaba al usuario
        // atrapado sin poder entrar si no lo completaba.

        // Si el onboarding YA está completo y el usuario aterriza en él, lo
        // llevamos a su lectura (evita repetirlo). No redirige en Server Actions.
        if (isCompleted && isOnboardingRoute && !isServerAction) {
            const url = request.nextUrl.clone();
            url.pathname = "/app/mi-lectura";
            return NextResponse.redirect(url);
        }
    }

    return response;
}
