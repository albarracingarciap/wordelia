// Server-only. Minimal transactional email via Resend's REST API (no SDK
// dependency — same fetch style as lib/paypal.ts). No-ops safely when
// RESEND_API_KEY isn't set, so sandbox/dev never break on a missing key.

const DEFAULT_FROM = "Wordelia <hola@wordelia.es>";

export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<void> {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
        console.log(`[email] omitido (sin RESEND_API_KEY): "${opts.subject}" → ${opts.to}`);
        return;
    }
    const from = process.env.EMAIL_FROM || DEFAULT_FROM;
    try {
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
            body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html }),
        });
        if (!res.ok) {
            console.error(`[email] envío fallido ${res.status}: ${await res.text()}`);
        }
    } catch (e) {
        console.error("[email] error de envío", e);
    }
}
