"use client";

import { confirmDialog } from "@/components/ui/confirm";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useParams, useRouter } from "next/navigation";
import { updateClubSettings, archiveClub, deleteClub } from "@/app/app/clubs/[id]/actions";
import { ClubHeaderUpload } from "@/components/clubs/create/ClubHeaderUpload";
import { Check, Archive, Trash2 } from "lucide-react";

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
    const router = useRouter();
    const clubId = params.id as string;

    const [name, setName] = React.useState(club?.name || "");
    const [description, setDescription] = React.useState(club?.description || "");
    const [visibility, setVisibility] = React.useState(club?.visibility || "public");
    const [price, setPrice] = React.useState(club?.price != null ? String(club.price) : "0");
    const [portada, setPortada] = React.useState(Boolean(club?.portada));
    const [destacado, setDestacado] = React.useState(Boolean(club?.destacado));
    const [coverUrl, setCoverUrl] = React.useState<string | null>(club?.cover_url ?? null);
    const [isSaving, setIsSaving] = React.useState(false);
    const [savedOk, setSavedOk] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Danger zone state
    const [isArchiving, setIsArchiving] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = React.useState("");
    const [showDeleteModal, setShowDeleteModal] = React.useState(false);
    const [dangerError, setDangerError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (club) {
            setName(club.name || "");
            setDescription(club.description || "");
            setVisibility(club.visibility || "public");
            setPrice(club.price != null ? String(club.price) : "0");
            setPortada(Boolean(club.portada));
            setDestacado(Boolean(club.destacado));
            setCoverUrl(club.cover_url ?? null);
        }
    }, [club]);

    const handleSave = async () => {
        if (!name.trim()) return;
        const parsedPrice = price.trim() === "" ? 0 : Number(price);
        if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
            setError("El precio no es válido");
            return;
        }
        setIsSaving(true);
        setError(null);
        const result = await updateClubSettings(clubId, {
            name,
            description,
            visibility,
            price: parsedPrice,
            portada,
            destacado,
            coverUrl,
        });
        setIsSaving(false);
        if (result?.error) {
            setError(result.error);
        } else {
            setSavedOk(true);
            setTimeout(() => setSavedOk(false), 2500);
        }
    };

    const handleArchive = async () => {
        if (!(await confirmDialog({ title: "Archivar club", message: "El club quedará inactivo y dejará de aparecer en Explorar, pero podrás restaurarlo más adelante. ¿Archivarlo?", confirmLabel: "Archivar", tone: "danger" }))) return;
        setIsArchiving(true);
        setDangerError(null);
        const result = await archiveClub(clubId);
        setIsArchiving(false);
        if (result?.error) {
            setDangerError(result.error);
        } else {
            router.push("/app/clubs");
        }
    };

    const handleDelete = async () => {
        if (deleteConfirmText !== club?.name) return;
        setIsDeleting(true);
        setDangerError(null);
        const result = await deleteClub(clubId);
        setIsDeleting(false);
        if (result?.error) {
            setDangerError(result.error);
            setShowDeleteModal(false);
        } else {
            router.push("/app/clubs");
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <h3 className="text-lg font-serif text-teal mb-6">Configuración general</h3>

                <div className="space-y-4">
                    <ClubHeaderUpload value={coverUrl} onChange={setCoverUrl} />

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

                    <div>
                        <label className="block text-sm font-bold text-grey-dark mb-1.5">Precio del club (€)</label>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="0.00"
                        />
                        <p className="text-xs text-grey/50 mt-1">Precio de acceso al club. Usa 0 para un club gratuito.</p>
                    </div>

                    {club?.is_official && (
                        <div className="rounded-xl border border-teal/15 bg-teal/5 p-4 space-y-3">
                            <div>
                                <p className="text-sm font-bold text-teal">Escaparate en la página de inicio</p>
                                <p className="text-xs text-grey/50">Controla si este club aparece en la home de Wordelia.</p>
                            </div>

                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={portada}
                                    onChange={(e) => setPortada(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 accent-teal"
                                />
                                <span>
                                    <span className="block text-sm font-semibold text-grey-dark">Mostrar en el home</span>
                                    <span className="block text-xs text-grey/50">Aparecerá en la sección de clubs de la página de inicio (máximo 4 clubs).</span>
                                </span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={destacado}
                                    onChange={(e) => {
                                        setDestacado(e.target.checked);
                                        if (e.target.checked) setPortada(true);
                                    }}
                                    className="mt-0.5 h-4 w-4 accent-coral"
                                />
                                <span>
                                    <span className="block text-sm font-semibold text-grey-dark">Destacar como “Libro del mes”</span>
                                    <span className="block text-xs text-grey/50">Se mostrará como club destacado. Solo un club puede estar destacado a la vez.</span>
                                </span>
                            </label>
                        </div>
                    )}

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
            <Card className="border-red-200 bg-red-50/20">
                <h4 className="text-sm font-bold text-red-600 mb-1">Zona de peligro</h4>
                <p className="text-xs text-grey/50 mb-5">Estas acciones son irreversibles o difíciles de deshacer. Procede con cuidado.</p>

                <div className="space-y-3">
                    {/* Archive */}
                    <div className="flex items-center justify-between py-3 border-b border-red-100">
                        <div>
                            <p className="text-sm font-bold text-grey-dark">Archivar club</p>
                            <p className="text-xs text-grey/50">El club quedará inactivo. Los datos se conservan.</p>
                        </div>
                        <Button
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50 shrink-0"
                            onClick={handleArchive}
                            disabled={isArchiving}
                        >
                            <Archive size={14} className="mr-1.5" />
                            {isArchiving ? "Archivando..." : "Archivar club"}
                        </Button>
                    </div>

                    {/* Delete */}
                    <div className="flex items-center justify-between py-3">
                        <div>
                            <p className="text-sm font-bold text-red-600">Eliminar club</p>
                            <p className="text-xs text-grey/50">Borra el club y todos sus datos permanentemente.</p>
                        </div>
                        <Button
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50 shrink-0"
                            onClick={() => { setShowDeleteModal(true); setDangerError(null); }}
                        >
                            <Trash2 size={14} className="mr-1.5" />
                            Eliminar club
                        </Button>
                    </div>
                </div>

                {dangerError && (
                    <p className="text-sm text-red-600 mt-3">{dangerError}</p>
                )}
            </Card>

            {/* Delete confirmation modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                <Trash2 size={18} className="text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-serif text-lg text-grey-dark font-bold">Eliminar club</h3>
                                <p className="text-xs text-grey/50">Esta acción no se puede deshacer</p>
                            </div>
                        </div>

                        <p className="text-sm text-grey/70">
                            Se eliminarán permanentemente todos los datos: miembros, posts, checkpoints y anuncios.
                        </p>

                        <div>
                            <label className="block text-xs font-bold text-grey-dark mb-1.5">
                                Escribe <span className="font-mono text-red-600">"{club?.name}"</span> para confirmar
                            </label>
                            <Input
                                value={deleteConfirmText}
                                onChange={e => setDeleteConfirmText(e.target.value)}
                                placeholder={club?.name}
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-2 pt-1">
                            <Button
                                variant="ghost"
                                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                onClick={handleDelete}
                                disabled={deleteConfirmText !== club?.name || isDeleting}
                            >
                                {isDeleting ? "Eliminando..." : "Sí, eliminar definitivamente"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
