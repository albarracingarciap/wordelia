import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

export function GeneralSettings() {
    const [name, setName] = React.useState("Lectura Calmada");
    const [description, setDescription] = React.useState("Leemos sin prisa y debatimos con respeto. Nos enfocamos en clásicos modernos y literatura contemplativa.");
    const [privacy, setPrivacy] = React.useState("private");

    return (
        <div className="space-y-6">
            <Card>
                <h3 className="text-lg font-serif text-teal mb-6">Configuración general</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-grey-dark mb-1.5">Nombre del club</label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-grey-dark mb-1.5">Descripción</label>
                        <textarea
                            className="w-full rounded-xl border border-grey/20 bg-white px-4 py-3 text-sm text-grey-dark placeholder:text-grey/40 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/20 min-h-[100px] resize-none"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-grey-dark mb-1.5">Privacidad</label>
                        <Select
                            options={[
                                { label: "Público", value: "public" },
                                { label: "Privado (Solicitud)", value: "private" },
                                { label: "Secreto (Invitación)", value: "secret" },
                            ]}
                            value={privacy}
                            onChange={(e) => setPrivacy(e.target.value)}
                        />
                        <p className="text-xs text-grey/50 mt-1">
                            {privacy === 'public' && "Cualquiera puede ver y unirse al club."}
                            {privacy === 'private' && "Visible en búsquedas, pero requiere aprobación para entrar."}
                            {privacy === 'secret' && "Solo accesible mediante enlace de invitación."}
                        </p>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button variant="primary">Guardar cambios</Button>
                    </div>
                </div>
            </Card>

            <Card className="border-red-100 bg-red-50/10">
                <h4 className="text-sm font-bold text-red-600 mb-2">Zona de peligro</h4>
                <p className="text-sm text-grey/60 mb-4">Estas acciones no se pueden deshacer.</p>
                <div className="flex gap-4">
                    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">Archivar club</Button>
                    <Button variant="ghost" className="text-red-600 hover:bg-red-50">Eliminar club</Button>
                </div>
            </Card>
        </div>
    );
}
