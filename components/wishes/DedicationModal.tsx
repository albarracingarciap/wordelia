import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { WishlistItem } from '@/lib/mock-data';

interface DedicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: WishlistItem;
    onAddDedication: (message: string, style: 'classic' | 'fun' | 'romantic') => void;
}

export function DedicationModal({ isOpen, onClose, item, onAddDedication }: DedicationModalProps) {
    const [message, setMessage] = useState('');
    const [style, setStyle] = useState<'classic' | 'fun' | 'romantic'>('classic');

    const styles = {
        classic: { label: 'Clásico 💌', bg: 'bg-white', border: 'border-grey/20' },
        fun: { label: 'Divertido 🎉', bg: 'bg-yellow-50', border: 'border-yellow-200' },
        romantic: { label: 'Romántico 💖', bg: 'bg-pink-50', border: 'border-pink-200' },
    };

    const handleSubmit = () => {
        onAddDedication(message, style);
        onClose();
        setMessage(''); // Reset
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all border-2 border-dashed border-teal/20">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-serif font-bold text-teal leading-6 mb-2 flex items-center gap-2"
                                >
                                    <span>🕵️‍♂️</span> Dedicatoria Secreta
                                </Dialog.Title>
                                <div className="mt-2">
                                    <p className="text-sm text-grey/80 mb-4">
                                        Escribe un mensaje para <strong>{item.title}</strong>. El dueño no podrá leerlo hasta que reciba el libro. 🤫
                                    </p>

                                    {/* Style Selector */}
                                    <div className="flex gap-2 mb-4">
                                        {(Object.keys(styles) as Array<keyof typeof styles>).map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setStyle(s)}
                                                className={`flex-1 text-xs font-bold py-2 rounded-lg border-2 transition-all ${style === s ? 'border-teal bg-teal/5 text-teal' : 'border-grey/10 text-grey/60 hover:border-grey/30'}`}
                                            >
                                                {styles[s].label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Message Input */}
                                    <div className={`p-4 rounded-xl border-2 mb-4 transition-colors ${styles[style].bg} ${styles[style].border}`}>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder={style === 'fun' ? "¡Escribe algo loco aquí!" : "Escribe tu mensaje..."}
                                            className="w-full bg-transparent border-none focus:ring-0 text-sm p-0 placeholder-grey/40 min-h-[100px] resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-full border border-transparent px-4 py-2 text-sm font-medium text-grey/60 hover:bg-grey/10 focus:outline-none"
                                        onClick={onClose}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!message.trim()}
                                        className="inline-flex justify-center rounded-full border border-transparent bg-teal px-6 py-2 text-sm font-bold text-white hover:bg-teal-dark focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
                                        onClick={handleSubmit}
                                    >
                                        Guardar Secreto 🔒
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
