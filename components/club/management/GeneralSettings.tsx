"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useParams } from "next/navigation";
import { updateClubSettings } from "@/app/app/clubs/[id]/actions";
import { Check } from "lucide-react";

const PRIVACY_OPTIONS = [
    { label: "Público — cualquiera puede ver y unirse", value: "public" },
    { label: "Privado — visible, requiere aprobación", value: "private" },
    { label: "Secreto — solo por invitación", value: "secret" },
];

const PRIVACY_HINT: Record<string, string> = {
    public: "Cualquiera puede ver el club y unirse directamente.",
    private: "Visible en búsquedas, pero requiere aprobación para entrar.",
    secret: "Solo accesible mediante enlace de invitación.",
};

export function GeneralSettings({ club }: { club?: any }) {
    const params = useParams();
    const clubId = params.id as string;

    const [name, setName] = React.useState(club?.name || "");
    const [description, setDescription] = React.useState(club?.description || "");
    const [visibility, setVisibility] = React.useState(club?.visibility || "public");
    const [isSaving, setIsSaving] = React.useState(false);
    const [savedOk, setSavedOk] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Sync when club data arrives
    React.useEffect(() => {
        if (club) {
            setName(club.name || "");
            setDescription(club.description || "");
            setVisibility(club.visibility || "public");
        }
    }, [club]);

    const handleSave = async () => {
        if (!name.trim()) return;
        setIsSaving(true);
        setError(null);
        const result = await updateClubSettings(clubId, { name, description, visibility });
        setIsSaving(false);
        if (result?.error) {
            setError(result.error);
        } else {
            setSavedOk(true);
            setTimeout(() => setSavedOk(false), 2500);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <h3 className="text-lg font-serif text-teal mb-6">Configuración general</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-grey-dark mb-1.5">Nombre del club</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nombre del club"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-grey-dark mb-1.5">Descripción</label>
                        <textarea
                            className="w-full rounded-xl border border-grey/20 bg-white px-4 py-3 text-sm text-grey-dark placeholder:text-grey/40 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/20 min-h-[100px] resize-none"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe el club..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-grey-dark mb-1.5">Privacidad</label>
                        <Select
                            options={PRIVACY_OPTIONS}
                            value={visibility}
                            onChange={(e) => setVisibility(e.target.value)}
                        />
                        <p className="text-xs text-grey/50 mt-1">{PRIVACY_HINT[visibility]}</p>
                    </div>

                    {error && (
                        <p className="text-sm text-coral">{error}</p>
                    )}

                    <div className="pt-4 flex justify-end items-center gap-3">
                        {savedOk && (
                            <span className="text-sm text-teal flex items-center gap-1">
                                <Check size={14} /> Cambios guardados
                            </span>
                        )}
                        <Button variant="primary" onClick={handleSave} disabled={isSaving || !name.trim()}>
                            {isSaving ? "Guardando..." : "Guardar cambios"}
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Danger zone */}
            <Card className="border-red-100 bg-red-50/10">
                <h4 className="text-sm font-bold text-red-600 mb-2">Zona de peligro</h4>
                <p className="text-sm text-grey/60 mb-4">Estas acciones no se pueden deshacer.</p>
                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => alert("Próximamente: archivar club")}
                    >
                        Archivar club
                    </Button>
                    <Button
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => {
                            if (confirm("¿Estás seguro de que quieres eliminar este club? Esta acción no se puede deshacer.")) {
                                alert("Próximamente: eliminar club");
                            }
                        }}
                    >
                        Eliminar club
                    </Button>
                </div>
            </Card>
        </div>
    );
}
