// Server-only. HTML templates for subscription lifecycle emails. Each builder
// returns { subject, html }; sending is done by lib/email.ts. Kept as inline
// HTML (no @react-email dependency) with Wordelia's palette.

const TEAL = "#1f6f6b";
const CORAL = "#E0645C";
const CREAM = "#fbf7f0";

function layout(title: string, bodyHtml: string, cta?: { href: string; label: string }): string {
    const button = cta
        ? `<a href="${cta.href}" style="display:inline-block;background:${CORAL};color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:12px;margin-top:8px">${cta.label}</a>`
        : "";
    return `
<div style="background:${CREAM};padding:32px 0;font-family:Arial,Helvetica,sans-serif;color:#333">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #eee">
    <div style="background:${TEAL};padding:20px 28px">
      <span style="color:#fff;font-size:20px;font-weight:700">Wordelia</span>
    </div>
    <div style="padding:28px">
      <h1 style="font-size:20px;color:${TEAL};margin:0 0 12px">${title}</h1>
      <div style="font-size:15px;line-height:1.6;color:#444">${bodyHtml}</div>
      ${button}
    </div>
    <div style="padding:16px 28px;border-top:1px solid #f0f0f0;font-size:12px;color:#999">
      ¿Dudas? Escríbenos a <a href="mailto:hola@wordelia.es" style="color:${TEAL}">hola@wordelia.es</a>.
    </div>
  </div>
</div>`;
}

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://wordelia.es";

export function emailSubscriptionActivated(planLabel: string): { subject: string; html: string } {
    return {
        subject: `Tu suscripción ${planLabel} está activa`,
        html: layout(
            "¡Bienvenido a bordo!",
            `<p>Tu suscripción <strong>${planLabel}</strong> ya está activa. Se renovará automáticamente y puedes gestionarla o cancelarla cuando quieras desde tu cuenta.</p>`,
            { href: `${APP_URL}/app/perfil/suscripcion`, label: "Gestionar suscripción" },
        ),
    };
}

export function emailPaymentReceipt(planLabel: string, amountLabel: string): { subject: string; html: string } {
    return {
        subject: `Recibo de tu suscripción ${planLabel}`,
        html: layout(
            "Pago recibido",
            `<p>Hemos recibido el pago de <strong>${amountLabel}</strong> por tu suscripción <strong>${planLabel}</strong>. ¡Gracias por seguir con nosotros!</p>`,
            { href: `${APP_URL}/app/perfil/suscripcion`, label: "Ver mi suscripción" },
        ),
    };
}

export function emailPaymentFailed(planLabel: string): { subject: string; html: string } {
    return {
        subject: `Problema con el cobro de tu suscripción ${planLabel}`,
        html: layout(
            "No hemos podido cobrar tu suscripción",
            `<p>El último cobro de tu suscripción <strong>${planLabel}</strong> no se ha podido completar. PayPal lo reintentará automáticamente, pero para evitar perder el acceso revisa tu método de pago.</p>`,
            { href: `${APP_URL}/app/perfil/suscripcion`, label: "Revisar suscripción" },
        ),
    };
}

export function emailSubscriptionCancelled(planLabel: string, accessUntilLabel: string): { subject: string; html: string } {
    return {
        subject: `Tu suscripción ${planLabel} ha sido cancelada`,
        html: layout(
            "Suscripción cancelada",
            `<p>Hemos cancelado tu suscripción <strong>${planLabel}</strong>. Conservas el acceso hasta el <strong>${accessUntilLabel}</strong>; después pasarás al plan gratuito. Puedes volver cuando quieras.</p>`,
            { href: `${APP_URL}/planes`, label: "Ver planes" },
        ),
    };
}
