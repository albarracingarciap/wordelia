"use client";

import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "../ui/Button";
import { submitContactMessage } from "@/app/contacto/actions";

const SUBJECT_OPTIONS = [
    { value: "general", label: "Consulta general" },
    { value: "clubs", label: "Clubs y organizaciones" },
    { value: "librerias", label: "Librerías" },
    { value: "educacion", label: "Educación" },
    { value: "otro", label: "Otro" },
];

const inputClass =
    "w-full rounded-2xl border border-teal/10 bg-white px-4 py-3 text-sm text-grey transition-all placeholder:text-grey/40 focus:border-teal/30 focus:outline-none focus:ring-2 focus:ring-teal/10";

type ContactFormProps = {
    initialSubject?: string;
    source?: string;
};

export function ContactForm({ initialSubject = "general", source }: ContactFormProps) {
    const [subject, setSubject] = useState(initialSubject);
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (submitting) return;

        setSubmitting(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const result = await submitContactMessage(formData);

        if (result.success) {
            setSent(true);
        } else {
            setError(result.error);
            setSubmitting(false);
        }
    };

    if (sent) {
        return (
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-teal/10 bg-white p-8 text-center shadow-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal/10 text-teal">
                    <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-teal-dark">¡Mensaje enviado!</h3>
                <p className="max-w-sm text-sm leading-relaxed text-grey/80">
                    Gracias por escribirnos. Te responderemos al correo que nos has dejado lo antes posible.
                </p>
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-3xl border border-teal/10 bg-white p-6 shadow-sm md:p-8"
        >
            {/* Honeypot anti-spam: oculto para humanos, los bots lo rellenan */}
            <div className="hidden" aria-hidden="true">
                <label htmlFor="company">No rellenar</label>
                <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            <input type="hidden" name="source" value={source ?? ""} />

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <label htmlFor="name" className="text-sm font-medium text-teal-dark">
                        Nombre
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        minLength={2}
                        placeholder="Tu nombre"
                        className={inputClass}
                    />
                </div>
                <div className="space-y-1.5">
                    <label htmlFor="email" className="text-sm font-medium text-teal-dark">
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="tu@email.com"
                        className={inputClass}
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <label htmlFor="subject" className="text-sm font-medium text-teal-dark">
                    Motivo
                </label>
                <select
                    id="subject"
                    name="subject"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    className={inputClass}
                >
                    {SUBJECT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="space-y-1.5">
                <label htmlFor="message" className="text-sm font-medium text-teal-dark">
                    Mensaje
                </label>
                <textarea
                    id="message"
                    name="message"
                    required
                    minLength={10}
                    maxLength={5000}
                    rows={6}
                    placeholder="Cuéntanos en qué podemos ayudarte…"
                    onChange={() => error && setError(null)}
                    className={`${inputClass} resize-y`}
                />
            </div>

            {error && <p className="text-sm font-medium text-coral">{error}</p>}

            <Button type="submit" disabled={submitting} className="w-full justify-center sm:w-auto">
                {submitting ? "Enviando…" : "Enviar mensaje"}
            </Button>

            <p className="text-xs leading-relaxed text-grey/60">
                Al enviar este formulario aceptas nuestra{" "}
                <a href="/privacidad" className="text-teal underline-offset-2 hover:underline">
                    política de privacidad
                </a>
                .
            </p>
        </form>
    );
}
