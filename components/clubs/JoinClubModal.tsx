import * as React from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface JoinClubModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function JoinClubModal({ isOpen, onClose }: JoinClubModalProps) {
    const [code, setCode] = React.useState("");

    const handleJoin = () => {
        // Logic to join would go here
        console.log("Joining with code:", code);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Unirme con invitación"
            size="sm"
        >
            <div className="space-y-4 pt-2">
                <p className="text-sm text-grey/70">
                    Si tienes un código de acceso o enlace de invitación para un club privado, introdúcelo aquí.
                </p>

                <Input
                    placeholder="Ej. BOOK-XYZ-123"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    autoFocus
                />

                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button disabled={!code} onClick={handleJoin}>Unirse</Button>
                </div>
            </div>
        </Modal>
    );
}
