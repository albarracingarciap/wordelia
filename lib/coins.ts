// Tamaño de página del histórico de movimientos.
export const TRANSACTIONS_PAGE_SIZE = 15;

// Etiquetas legibles para el histórico de movimientos de monedas.
// Vive fuera del archivo "use server" (allí solo se permiten exports async).
export const COIN_REASON_LABELS: Record<string, string> = {
    referral_reward: "Amigo invitado",
    referral_welcome: "Bienvenida por invitación",
    spend_official_club: "Club oficial",
    spend_event: "Evento Wordelia",
    admin_adjust: "Ajuste de Wordelia",
    expiry: "Caducidad",
    hold_release: "Reserva liberada",
};
