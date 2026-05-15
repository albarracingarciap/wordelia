import * as React from "react";
import { Modal } from "../ui/Modal";
import { ReadingForm, ReadingFormBook } from "@/components/registration/ReadingForm";

export interface RegisterReadingModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialDuration?: number;
    books: ReadingFormBook[];
    initialBookId?: string; // To pre-select
}

export function RegisterReadingModal({ isOpen, onClose, initialDuration, books, initialBookId }: RegisterReadingModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Registrar lectura"
            className="max-h-[92dvh] overflow-y-auto overscroll-contain sm:max-h-[calc(100dvh-2rem)]"
        >
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
