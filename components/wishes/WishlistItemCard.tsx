import { useState } from "react";
import Image from "next/image";
import { WishlistItem } from "@/lib/mock-data";
import { CrowdfundingModal } from "./CrowdfundingModal";
import { DedicationModal } from "./DedicationModal";

interface WishlistItemCardProps {
    item: WishlistItem;
    isGuestView: boolean; // Controls whether to show reservation status
    onReserve?: () => void;
}

export function WishlistItemCard({ item, isGuestView, onReserve }: WishlistItemCardProps) {
    const isReservedOrPurchased = item.status === 'RESERVED' || item.status === 'PURCHASED';
    const [isDedicationOpen, setIsDedicationOpen] = useState(false);
    const [isCrowdfundingOpen, setIsCrowdfundingOpen] = useState(false);

    // Logic: 
    // If Owner View: ALWAYS show as available (simulate ignorance), unless we want to show "purchased" by the owner themself? 
    // No, standard logic is owner sees simple list.
    // If Guest View: Show real status.
    const showAsBlocked = isGuestView && isReservedOrPurchased && !item.crowdfunding;

    // Crowdfunding logic
    const isCrowdfunding = !!item.crowdfunding;
    const progress = isCrowdfunding ? (item.crowdfunding!.collected / item.crowdfunding!.target) * 100 : 0;

    // Dedication Logic
    const hasDedication = !!item.dedication;
    const canAddDedication = isGuestView && isReservedOrPurchased && !hasDedication;
    const canViewDedication = !isGuestView && hasDedication;

    const handleAddDedication = (msg: string, style: 'classic' | 'fun' | 'romantic') => {
        alert(`Dedicatoria guardada: "${msg}" (${style})`);
    };

    return (
        <>
            <div className={`flex gap-4 p-4 rounded-xl border transition-all ${showAsBlocked ? 'bg-grey/5 border-transparent opacity-80' : 'bg-white border-teal/10 hover:shadow-md'}`}>
                {/* Cover */}
                <div className="relative w-20 h-28 shrink-0 rounded-md overflow-hidden shadow-sm">
                    <Image src={item.coverUrl} alt={item.title} fill className={`object-cover ${showAsBlocked ? 'grayscale' : ''}`} />

                    {/* Priority Badge */}
                    {!showAsBlocked && item.priority === 'HIGH' && (
                        <div className="absolute top-0 right-0 bg-coral text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-md">
                            TOP
                        </div>
                    )}

                    {/* Dedication Badge (Envelope) */}
                    {hasDedication && (
                        <div className="absolute bottom-0 right-0 bg-white/90 p-1 rounded-tl-md shadow-sm border-t border-l border-grey/10" title="Mensaje secreto adjunto">
                            <span className="text-xl leading-none">💌</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                        <h4 className={`font-serif font-bold text-lg leading-tight ${showAsBlocked ? 'text-grey line-through' : 'text-teal'}`}>
                            {item.title}
                        </h4>
                        <p className="text-sm text-grey/80">{item.author}</p>

                        {/* Reserved By Tag */}
                        {!isGuestView && item.reservedBy && (
                            <p className="text-xs text-coral mt-1 font-medium">
                                Reservado por: {item.reservedBy}
                            </p>
                        )}
                    </div>

                    {isCrowdfunding ? (
                        <div className="w-full mt-2">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-teal font-bold">{progress.toFixed(0)}% <span className="font-normal text-grey/60">recaudado</span></span>
                                <span className="text-grey/60">{item.crowdfunding!.collected}€ / {item.crowdfunding!.target}€</span>
                            </div>
                            <div className="h-2 w-full bg-grey/10 rounded-full overflow-hidden mb-3">
                                <div className="h-full bg-teal rounded-full" style={{ width: `${progress}%` }} />
                            </div>

                            {isGuestView && (
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setIsCrowdfundingOpen(true)}
                                        className="bg-coral text-white text-xs font-bold px-4 py-1.5 rounded-full hover:bg-coral-dark transition-colors flex items-center gap-1"
                                    >
                                        <span>🎁</span> Contribuir
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex justify-between items-end">
                            <div className="text-sm font-medium text-teal/80">
                                {item.price.toFixed(2)}€
                            </div>

                            {/* Actions / Status */}
                            {isGuestView ? (
                                <div className="flex items-center gap-2">
                                    {/* Add Dedication Button */}
                                    {canAddDedication && (
                                        <button
                                            onClick={() => setIsDedicationOpen(true)}
                                            className="text-teal bg-teal/5 hover:bg-teal/10 px-3 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1"
                                            title="Añadir dedicatoria secreta"
                                        >
                                            📝 Dedicar
                                        </button>
                                    )}

                                    {isReservedOrPurchased ? (
                                        <span className="text-xs font-bold text-coral bg-coral/10 px-2 py-1 rounded-full">
                                            {item.status === 'PURCHASED' ? '🎁 YA COMPRADO' : '🔒 RESERVADO'}
                                        </span>
                                    ) : (
                                        <button
                                            onClick={onReserve}
                                            className="bg-teal text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-teal-dark transition-colors"
                                        >
                                            RESERVAR
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="flex gap-2 items-center">
                                    {canViewDedication && (
                                        <button
                                            onClick={() => alert(`💌 Mensaje de ${item.dedication?.from}: \n\n"${item.dedication?.message}"`)}
                                            className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded border border-yellow-200 hover:shadow-sm"
                                        >
                                            Leer mensaje secreto
                                        </button>
                                    )}
                                    <button className="text-grey/40 hover:text-coral text-xs underline">Eliminar</button>
                                    <button className="text-grey/40 hover:text-teal text-xs underline">Editar</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <CrowdfundingModal
                isOpen={isCrowdfundingOpen}
                onClose={() => setIsCrowdfundingOpen(false)}
                item={item}
                onContribute={(amt) => alert(`Mock contribution: ${amt}€`)}
            />

            <DedicationModal
                isOpen={isDedicationOpen}
                onClose={() => setIsDedicationOpen(false)}
                item={item}
                onAddDedication={handleAddDedication}
            />
        </>
    );
}
