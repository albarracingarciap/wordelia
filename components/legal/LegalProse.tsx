import React from "react";

// Estilos de la prosa legal aplicados a HTML semántico de los hijos. Compartido
// por LegalPage (shell público) y por la variante in-app (dentro de /app).
export const legalProseClass = [
    "max-w-none text-[15px] leading-relaxed text-grey",
    "[&>*:first-child]:mt-0",
    "[&>p]:mt-4",
    "[&>h2]:mt-10 [&>h2]:mb-2 [&>h2]:font-serif [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:text-teal-dark",
    "[&>h3]:mt-6 [&>h3]:mb-1.5 [&>h3]:text-base [&>h3]:font-semibold [&>h3]:text-teal-dark",
    "[&>ul]:mt-3 [&>ul]:list-disc [&>ul]:space-y-1.5 [&>ul]:pl-5",
    "[&>ol]:mt-3 [&>ol]:list-decimal [&>ol]:space-y-1.5 [&>ol]:pl-5",
    "[&_a]:text-teal [&_a]:underline-offset-2 hover:[&_a]:underline",
    "[&_strong]:font-semibold [&_strong]:text-teal-dark",
    "[&>div.table-wrap]:mt-4 [&>div.table-wrap]:overflow-x-auto [&>div.table-wrap]:rounded-2xl [&>div.table-wrap]:border [&>div.table-wrap]:border-teal/10",
    "[&_table]:w-full [&_table]:border-collapse [&_table]:text-sm",
    "[&_th]:border-b [&_th]:border-teal/10 [&_th]:bg-teal/5 [&_th]:px-3 [&_th]:py-2.5 [&_th]:text-left [&_th]:font-semibold [&_th]:text-teal-dark",
    "[&_td]:border-b [&_td]:border-teal/5 [&_td]:px-3 [&_td]:py-2.5 [&_td]:align-top",
    "[&_tr:last-child_td]:border-b-0",
].join(" ");

export function LegalProse({ children }: { children: React.ReactNode }) {
    return <div className={legalProseClass}>{children}</div>;
}
