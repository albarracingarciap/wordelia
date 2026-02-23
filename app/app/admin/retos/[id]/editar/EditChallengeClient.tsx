"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateChallenge } from "@/app/app/admin/retos/nuevo/actions";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function EditChallengeClient({ challenge }: { challenge: any }) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: challenge.title || "",
        description: challenge.description || "",
        start_date: challenge.start_date ? challenge.start_date.split('T')[0] : "",
        end_date: challenge.end_date ? challenge.end_date.split('T')[0] : "",
        rules: challenge.rules || "",
        reward_badge_name: challenge.reward_badge_name || ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const result = await updateChallenge(challenge.id, formData);
            if (result.error) {
                alert(`Error: ${result.error}`);
            } else {
                router.push("/app/admin/retos");
            }
        } catch (error) {
            console.error(error);
            alert("Error al actualizar el reto");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/app/admin/retos" className="p-2 rounded-md hover:bg-accent text-muted-foreground transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Editar Reto</h1>
                    <p className="text-muted-foreground mt-1">
                        Modifica los detalles del reto de lectura.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-border rounded-xl p-6">
                <div>
                    <label className="block text-sm font-medium mb-1.5">Título del Reto *</label>
                    <Input
                        name="title"
                        required
                        placeholder="Ej. 5 libros de Ciencia Ficción"
                        value={formData.title}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1.5">Descripción</label>
                    <textarea
                        name="description"
                        rows={3}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="Describe de qué trata el reto..."
                        value={formData.description}
                        onChange={handleChange}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Fecha de Inicio</label>
                        <Input
                            type="date"
                            name="start_date"
                            value={formData.start_date}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Fecha de Fin</label>
                        <Input
                            type="date"
                            name="end_date"
                            value={formData.end_date}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1.5">Reglas (Opcional)</label>
                    <textarea
                        name="rules"
                        rows={3}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="1. Tienen que ser libros publicados después de 2020..."
                        value={formData.rules}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1.5">Nombre de la Insignia de Recompensa</label>
                    <Input
                        name="reward_badge_name"
                        placeholder="Ej. Explorador Espacial"
                        value={formData.reward_badge_name}
                        onChange={handleChange}
                    />
                </div>

                <div className="pt-4 border-t border-border flex justify-end gap-3">
                    <Link href="/app/admin/retos">
                        <Button type="button" variant="ghost">Cancelar</Button>
                    </Link>
                    <Button type="submit" variant="primary" disabled={isSubmitting || !formData.title}>
                        {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
