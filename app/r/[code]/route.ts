import { NextRequest, NextResponse } from "next/server";

// Enlace de invitación: /r/<code>. Guarda el código en una cookie (30 días) y
// lleva al registro. El alta (app/auth/actions.ts → signup) lo lee y registra
// el referido pendiente. La cualificación (monedas) ocurre al unirse al 1er club.
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;
    const res = NextResponse.redirect(new URL("/register", req.url));
    res.cookies.set("wordelia_ref", code.slice(0, 32), {
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
        sameSite: "lax",
    });
    return res;
}
