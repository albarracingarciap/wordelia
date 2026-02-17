import * as React from "react";
import { Modal } from "../ui/Modal";
import { ReadingForm } from "@/components/registration/ReadingForm";

export interface RegisterReadingModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookTitle?: string;
    initialDuration?: number;
    books: { id: string; title: string; author: string; coverUrl: string; progress: any }[]; // Added props
    initialBookId?: string; // To pre-select
}

export function RegisterReadingModal({ isOpen, onClose, bookTitle, initialDuration, books, initialBookId }: RegisterReadingModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registrar lectura">
            <ReadingForm
                books={books}
                initialBookId={initialBookId} // Pass it down
                onCancel={onClose}
                onSuccess={() => {
                    // Show success toast?
                    onClose();
                }}
                isModal
                initialDuration={initialDuration}
            />
        </Modal>
    );
}
