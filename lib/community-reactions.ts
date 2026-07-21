// Set de reacciones sobrio y con intención lectora (no un circo de emojis).
// ❤️ me llega · 🤯 me voló · 🥹 me removió · 😂 me hizo reír · 📚 lo quiero leer
export const REACTIONS = ["❤️", "🤯", "🥹", "😂", "📚"] as const;
export type Reaction = (typeof REACTIONS)[number];
