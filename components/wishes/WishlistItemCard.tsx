"use client";

import { toast } from "@/components/ui/toast";

import { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import { WishlistItemData, removeItemFromWishlist, updateItemPriority, reserveWishlistItem, contributeToCrowdfunding, enableCrowdfunding, markWishlistItemPurchased, addDedication, removeDedication, updateCrowdfundingTarget, disableCrowdfunding } from "@/app/app/wishes/item-actions";
import { Trash2, Star, Coins, Gift, PenLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReserveModal } from "./ReserveModal";
import { CrowdfundingModal } from "./CrowdfundingModal";
import { EnableCrowdfundingModal } from "./EnableCrowdfundingModal";
import { DedicationModal } from "./DedicationModal";
import { ReadDedicationModal } from "./ReadDedicationModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface WishlistItemCardProps {
    item: WishlistItemData;
    isGuestView: boolean;
    isOwner: boolean;
    wishlistTargetDate?: string | null;
}

export function WishlistItemCard({ item, isGuestView, isOwner, wishlistTargetDate }: WishlistItemCardProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isReserveModalOpen, setReserveModalOpen] = useState(false);
    const [isCrowdModalOpen, setCrowdModalOpen] = useState(false);
    const [isEnableCrowdModalOpen, setEnableCrowdModalOpen] = useState(false);
    const [isEditTargetModalOpen, setEditTargetModalOpen] = useState(false);
    const [showContributors, setShowContributors] = useState(false);
    const [isDisableConfirmOpen, setDisableConfirmOpen] = useState(false);
    const [disableBusy, setDisableBusy] = useState(false);
    const [disableError, setDisableError] = useState("");
    const [isDedicationModalOpen, setDedicationModalOpen] = useState(false);
    const [isReadDedicationModalOpen, setReadDedicationModalOpen] = useState(false);
    const [myItems, setMyItems] = useState<string[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem("wordelia_my_items");
        if (stored) {
            try {
                setMyItems(JSON.parse(stored));
            } catch (e) { }
        }
    }, []);

    const isMyItem = myItems.includes(item.id);
    const isReservedOrPurchased = item.status === "RESERVED" || item.status === "PURCHASED";
    // Solo mostramos gris/bloqueado si estamos en la vista de invitado, no es nuestro item, es crowdfunding, etc
    const showAsBlocked = isGuestView && isReservedOrPurchased && !item.crowdfunding && !isMyItem;

    // El propietario en "Vista amigo" solo previsualiza la presentación: sin mecánica
    // de regalo (nada de reservar/contribuir/dedicar/abrir sorpresa/ver avance del bote).
    const isOwnerPreview = isOwner && isGuestView;

    const isCrowdfunding = !!item.crowdfunding;
    const progress = isCrowdfunding
        ? Math.min((item.crowdfunding!.collected / item.crowdfunding!.target) * 100, 100)
        : 0;

    const hasDedication = !!item.dedication;
    // El estado de desbloqueo ya lo calcula el servidor (buildDedication).
    const canReadDedication = !!item.dedication?.isUnlocked;

    function handleDelete() {
        startTransition(async () => {
            await removeItemFromWishlist(item.id, item.wishlistId);
            router.refresh();
        });
    }

    function handleTogglePriority() {
        const next = item.priority === "HIGH" ? "MEDIUM" : "HIGH";
        startTransition(async () => {
            await updateItemPriority(item.id, next, item.wishlistId);
            router.refresh();
        });
    }

    async function handleReserve(name: string) {
        const res = await reserveWishlistItem(item.id, item.wishlistId, name);
        if (res.error) throw new Error(res.error);

        const newMyItems = [...myItems, item.id];
        setMyItems(newMyItems);
        localStorage.setItem("wordelia_my_items", JSON.stringify(newMyItems));

        router.refresh();
    }

    async function handleMarkPurchased() {
        startTransition(async () => {
            await markWishlistItemPurchased(item.id, item.wishlistId);
            router.refresh();
        });
    }

    async function handleAddDedication(message: string, style: "classic" | "fun" | "romantic", from: string, isUnlocked: boolean, unlockDate?: string, unlockOnEventDate?: boolean) {
        const res = await addDedication(item.id, item.wishlistId, { message, style, from, isUnlocked, unlockDate, unlockOnEventDate });
        if (res.error) throw new Error(res.error);
        router.refresh();
    }

    async function handleRemoveDedication() {
        const res = await removeDedication(item.id, item.wishlistId);
        if (res.error) throw new Error(res.error);
        router.refresh();
    }

    async function handleContribute(amount: number, note?: string, anonymous?: boolean) {
        const res = await contributeToCrowdfunding(item.id, item.wishlistId, amount, note, anonymous);
        if (res.error) throw new Error(res.error);
        router.refresh();
    }

    async function handleEnableCrowdfunding(targetAmount: number) {
        const res = await enableCrowdfunding(item.id, targetAmount, item.wishlistId);
        if (res.error) throw new Error(res.error);
        router.refresh();
    }

    async function handleUpdateTarget(targetAmount: number) {
        const res = await updateCrowdfundingTarget(item.id, item.wishlistId, targetAmount);
        if (res.error) throw new Error(res.error);
        router.refresh();
    }

    function openDisableConfirm() {
        setDisableError("");
        setDisableConfirmOpen(true);
    }

    async function confirmDisableCrowdfunding() {
        setDisableBusy(true);
        setDisableError("");
        const res = await disableCrowdfunding(item.id, item.wishlistId);
        setDisableBusy(false);
        if (res.error) { setDisableError(res.error); return; }
        setDisableConfirmOpen(false);
        router.refresh();
    }

    return (
        <div className={`flex gap-4 p-4 rounded-xl border transition-all ${showAsBlocked ? "bg-grey/5 border-transparent opacity-70" : "bg-white border-teal/10 hover:shadow-md"} ${isPending ? "opacity-60" : ""}`}>
            {/* Cover */}
            <div className="relative w-20 h-28 shrink-0 rounded-md overflow-hidden shadow-sm bg-grey/10">
                {item.coverUrl ? (
                    <Image
                        src={item.coverUrl}
                        alt={item.title}
                        fill
                        className={`object-cover ${showAsBlocked ? "grayscale" : ""}`}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-grey/30 text-sm">📚</div>
                )}

                {/* Priority Badge */}
                {!showAsBlocked && item.priority === "HIGH" && (
                    <div className="absolute top-0 right-0 bg-coral text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-md">
                        TOP
                    </div>
                )}

                {/* Dedication Badge (oculta en la preview del propietario) */}
                {hasDedication && !isOwnerPreview && (
                    <button
                        onClick={() => {
                            if (canReadDedication) {
                                setReadDedicationModalOpen(true);
                            } else {
                                const msg = item.dedication?.unlockOnEventDate && item.dedication?.unlockDate
                                    ? `Este mensaje se desbloqueará el día de la lista (${new Date(item.dedication.unlockDate).toLocaleDateString()}).`
                                    : item.dedication?.unlockDate
                                        ? `Este mensaje se desbloqueará el ${new Date(item.dedication.unlockDate).toLocaleDateString()}.`
                                        : `Este mensaje está bloqueado. El remitente decidirá cuándo puedes leerlo.`;
                                toast.error(msg);
                            }
                        }}
                        className={`absolute bottom-0 right-0 p-1.5 rounded-tl-md shadow-sm border-t border-l border-grey/10 transition-colors ${canReadDedication ? 'bg-white/90 hover:bg-white text-xl' : 'bg-grey/10 text-lg opacity-80 cursor-not-allowed'}`}
                        title={canReadDedication ? "¡Tienes un mensaje secreto!" : "Mensaje bloqueado"}
                    >
                        <span>{canReadDedication ? "💌" : "🔒"}</span>
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                <div>
                    <h4 className={`font-serif font-bold text-lg leading-tight ${showAsBlocked ? "text-grey line-through" : "text-teal"}`}>
                        {item.title}
                    </h4>
                    {item.author && <p className="text-sm text-grey/80">{item.author}</p>}
                </div>

                {isCrowdfunding ? (
                    <div className="w-full mt-2">
                        {isOwnerPreview ? (
                            <span className="inline-flex text-xs font-bold text-coral bg-coral/5 px-3 py-1.5 rounded-full">
                                🎁 Regalo en grupo
                            </span>
                        ) : (
                        <>
                        {/* Progreso del bote (amigo real, o Mi vista del propietario) */}
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-teal font-bold">{progress.toFixed(0)}% <span className="font-normal text-grey/60">recaudado</span></span>
                            <span className="text-grey/60">{item.crowdfunding!.collected}€ / {item.crowdfunding!.target}€</span>
                        </div>
                        <div className="h-2 w-full bg-grey/10 rounded-full overflow-hidden mb-3">
                            <div className="h-full bg-teal rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>

                        {isGuestView ? (
                            <div className="flex flex-wrap items-center gap-2">
                                {item.status !== "PURCHASED" && !isOwner && (
                                    <button
                                        onClick={() => setCrowdModalOpen(true)}
                                        className="bg-coral text-white text-xs font-bold px-4 py-1.5 rounded-full hover:bg-opacity-90 transition-colors flex items-center gap-1"
                                    >
                                        🎁 Contribuir
                                    </button>
                                )}
                                {item.status === "PURCHASED" && (
                                    <span className="text-xs font-bold text-coral bg-coral/10 px-3 py-1.5 rounded-full">
                                        🎁 YA COMPRADO
                                    </span>
                                )}
                                {/* Dedicatoria grupal: cualquier mecenas del bote puede escribirla. */}
                                {item.canDedicate && (
                                    <button
                                        onClick={() => setDedicationModalOpen(true)}
                                        className="bg-grey/10 text-grey text-xs font-bold px-3 py-1.5 rounded-full hover:bg-grey/20 transition-colors flex items-center gap-1.5"
                                    >
                                        <PenLine className="w-3.5 h-3.5" />
                                        {item.dedication ? "Editar dedicatoria" : "Dedicar"}
                                    </button>
                                )}
                                {item.canDedicate && item.dedication && !item.dedication.isUnlocked && item.dedication.mine && (
                                    <button
                                        onClick={() => handleAddDedication(item.dedication!.message ?? "", item.dedication!.style as any, item.dedication!.from, true)}
                                        disabled={isPending}
                                        className="bg-teal/10 text-teal text-xs font-bold px-3 py-1.5 rounded-full hover:bg-teal/20 transition-colors flex items-center gap-1.5"
                                        title="Desbloquear la dedicatoria para que el dueño la pueda leer"
                                    >
                                        🔓 Desbloquear
                                    </button>
                                )}
                            </div>
                        ) : isOwner ? (
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        onClick={() => setEditTargetModalOpen(true)}
                                        disabled={isPending}
                                        className="text-xs font-bold text-teal bg-teal/5 px-3 py-1.5 rounded-full hover:bg-teal/10 transition-colors"
                                    >
                                        Editar objetivo
                                    </button>
                                    <button
                                        onClick={openDisableConfirm}
                                        disabled={isPending}
                                        className="text-xs font-bold text-grey/60 bg-grey/10 px-3 py-1.5 rounded-full hover:text-coral transition-colors"
                                    >
                                        Desactivar bote
                                    </button>
                                    {item.crowdfunding!.collected === 0 && (
                                        <button
                                            onClick={handleDelete}
                                            disabled={isPending}
                                            className="inline-flex items-center gap-1 text-xs font-bold text-grey/50 px-3 py-1.5 rounded-full hover:text-coral hover:bg-coral/10 transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Borrar
                                        </button>
                                    )}
                                    {(item.contributions?.length ?? 0) > 0 && (
                                        <button
                                            onClick={() => setShowContributors((v) => !v)}
                                            className="text-xs font-medium text-teal/80 px-2 py-1.5 hover:underline"
                                        >
                                            {showContributors ? "Ocultar mecenas" : `Ver mecenas (${item.contributions!.length})`}
                                        </button>
                                    )}
                                </div>

                                {showContributors && item.contributions && item.contributions.length > 0 && (
                                    <ul className="rounded-lg border border-teal/10 bg-cream/30 divide-y divide-teal/5 text-xs">
                                        {item.contributions.map((c, idx) => (
                                            <li key={idx} className="px-3 py-2">
                                                <span className="font-semibold text-teal-dark">{c.name || "Anónimo"}</span>
                                                {c.note && <span className="block truncate text-grey/55">&ldquo;{c.note}&rdquo;</span>}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ) : null}
                        </>
                        )}
                    </div>
                ) : (
                    <div className="flex justify-between items-end mt-2">
                        <div className="text-sm font-medium text-teal/80">
                            {item.price != null ? `${item.price.toFixed(2)}€` : "—"}
                        </div>

                        {isGuestView ? (
                            <div className="flex items-center gap-2">
                                {item.status === "AVAILABLE" && !isOwner && (
                                    <button
                                        onClick={() => setReserveModalOpen(true)}
                                        className="bg-teal text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-opacity-90 transition-colors"
                                    >
                                        RESERVAR
                                    </button>
                                )}

                                {item.status === "RESERVED" && isMyItem && (
                                    <button
                                        onClick={handleMarkPurchased}
                                        disabled={isPending}
                                        className="bg-coral text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-opacity-90 transition-colors"
                                    >
                                        YA LO HE COMPRADO
                                    </button>
                                )}

                                {item.status === "PURCHASED" && isMyItem && (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            onClick={() => setDedicationModalOpen(true)}
                                            className="bg-grey/10 text-grey text-xs font-bold px-3 py-1.5 rounded-full hover:bg-grey/20 transition-colors flex items-center gap-1.5"
                                        >
                                            <PenLine className="w-3.5 h-3.5" />
                                            {item.dedication ? "Editar dedicatoria" : "Dedicar"}
                                        </button>
                                        {item.dedication && !item.dedication.isUnlocked && (
                                            <button
                                                onClick={() => handleAddDedication(item.dedication!.message ?? "", item.dedication!.style as any, item.dedication!.from, true)}
                                                disabled={isPending}
                                                className="bg-teal/10 text-teal text-xs font-bold px-3 py-1.5 rounded-full hover:bg-teal/20 transition-colors flex items-center gap-1.5"
                                                title="Desbloquear la dedicatoria para que el dueño la pueda leer"
                                            >
                                                🔓 Desbloquear
                                            </button>
                                        )}
                                        <div className="relative group">
                                            <span className="text-xs font-bold text-coral bg-coral/10 px-3 py-1.5 rounded-full flex items-center gap-1">
                                                <Gift className="w-3.5 h-3.5" /> YA COMPRADO
                                            </span>
                                            {!item.dedication && (
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max px-2 py-1 bg-grey/10 border border-grey/20 text-[10px] text-grey rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                    Añadir dedicatoria secreta
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {isReservedOrPurchased && !isMyItem && (
                                    <span className="text-xs font-bold text-coral bg-coral/10 px-2 py-1 rounded-full">
                                        {item.status === "PURCHASED" ? "🎁 YA COMPRADO" : "🔒 RESERVADO"}
                                    </span>
                                )}
                            </div>
                        ) : isOwner ? (
                            <div className="flex gap-2 items-center">
                                {!isCrowdfunding && item.status === "AVAILABLE" && (
                                    <button
                                        onClick={() => setEnableCrowdModalOpen(true)}
                                        disabled={isPending}
                                        title="Hacer de este regalo un bote para varios amigos"
                                        className="p-1.5 text-coral hover:bg-coral/10 rounded-full transition-colors"
                                    >
                                        <Coins className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={handleTogglePriority}
                                    disabled={isPending}
                                    title={item.priority === "HIGH" ? "Quitar prioridad alta" : "Marcar como prioritario"}
                                    className={`p-1.5 rounded-full transition-colors ${item.priority === "HIGH" ? "text-coral bg-coral/10" : "text-grey/30 hover:text-coral hover:bg-coral/10"}`}
                                >
                                    <Star className="w-4 h-4" fill={item.priority === "HIGH" ? "currentColor" : "none"} />
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isPending}
                                    className="p-1.5 text-grey/30 hover:text-coral hover:bg-coral/10 rounded-full transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <span className="text-xs font-bold text-grey/50 bg-grey/10 px-3 py-1.5 rounded-full">
                                Solo lectura
                            </span>
                        )}
                    </div>
                )}
            </div>

            <ReserveModal
                isOpen={isReserveModalOpen}
                onClose={() => setReserveModalOpen(false)}
                item={item}
                onReserve={handleReserve}
            />

            <CrowdfundingModal
                isOpen={isCrowdModalOpen}
                onClose={() => setCrowdModalOpen(false)}
                item={item}
                onContribute={handleContribute}
            />

            <EnableCrowdfundingModal
                isOpen={isEnableCrowdModalOpen}
                onClose={() => setEnableCrowdModalOpen(false)}
                item={item}
                onEnable={handleEnableCrowdfunding}
            />

            <EnableCrowdfundingModal
                isOpen={isEditTargetModalOpen}
                onClose={() => setEditTargetModalOpen(false)}
                item={item}
                onEnable={handleUpdateTarget}
                title="Editar objetivo del bote"
                description={`Cambia el objetivo del bote de "${item.title}". No puede ser menor que lo ya recaudado.`}
                submitLabel="Guardar objetivo"
                initialAmount={item.crowdfunding?.target}
                min={item.crowdfunding?.collected}
            />

            <DedicationModal
                isOpen={isDedicationModalOpen}
                onClose={() => setDedicationModalOpen(false)}
                item={item}
                targetDate={wishlistTargetDate}
                onAddDedication={handleAddDedication}
                onRemove={handleRemoveDedication}
            />

            <ReadDedicationModal
                isOpen={isReadDedicationModalOpen}
                onClose={() => setReadDedicationModalOpen(false)}
                item={item}
            />

            <ConfirmModal
                open={isDisableConfirmOpen}
                title="Desactivar bote"
                message={disableError || ((item.crowdfunding?.collected ?? 0) > 0
                    ? "Se borrarán las contribuciones registradas (el bote es simbólico, no hay dinero real) y el libro volverá a estado normal."
                    : "El libro dejará de tener bote y volverá a estado normal.")}
                confirmLabel="Desactivar"
                tone="danger"
                busy={disableBusy}
                onConfirm={confirmDisableCrowdfunding}
                onCancel={() => setDisableConfirmOpen(false)}
            />
        </div>
    );
}
