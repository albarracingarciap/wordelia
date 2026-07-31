"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Gift, Sparkles, Trash2 } from "lucide-react";
import { GiftRecipientData, deleteGiftRecipient } from "@/app/app/wishes/gift-actions";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface PersonCardProps {
    recipient: GiftRecipientData;
}

export function PersonCard({ recipient }: PersonCardProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isConfirmOpen, setConfirmOpen] = useState(false);

    const isSoon = recipient.upcomingEvent?.daysLeft !== null &&
        recipient.upcomingEvent?.daysLeft !== undefined &&
        recipient.upcomingEvent.daysLeft <= 7;

    function openConfirm(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        setConfirmOpen(true);
    }

    function confirmDelete() {
        startTransition(async () => {
            const result = await deleteGiftRecipient(recipient.id);
            if (result?.error) { alert(result.error); return; }
            setConfirmOpen(false);
            router.refresh();
        });
    }

    return (
        <>
            <Link href={`/app/wishes/person/${recipient.id}`} className="group block">
                <article className="relative flex min-h-[168px] flex-col rounded-2xl border border-teal/10 bg-white p-5 shadow-sm transition-all hover:border-teal/20 hover:shadow-md">
                    {isSoon && (
                        <div className="absolute right-4 top-4 rounded-full bg-coral/10 px-3 py-1 text-xs font-bold text-coral">
                            {recipient.upcomingEvent!.daysLeft === 0 ? "Hoy" : `${recipient.upcomingEvent!.daysLeft} días`}
                        </div>
                    )}

                    {/* Eliminar persona (aparece al pasar el ratón; no navega) */}
                    <button
                        type="button"
                        onClick={openConfirm}
                        title="Eliminar persona"
                        className={`absolute ${isSoon ? "right-4 top-12" : "right-3 top-3"} z-10 hidden h-8 w-8 items-center justify-center rounded-full bg-white/95 text-grey/40 shadow-sm ring-1 ring-grey/10 transition-colors hover:text-coral group-hover:flex`}
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-teal/10 bg-teal/10 text-teal shadow-sm">
                            {recipient.avatarUrl ? (
                                <Image
                                    src={recipient.avatarUrl}
                                    alt={recipient.name}
                                    width={64}
                                    height={64}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span className="text-2xl font-bold">{recipient.name.charAt(0).toUpperCase()}</span>
                            )}
                        </div>

                        <div className="min-w-0 flex-1 pr-12">
                            <h3 className="truncate font-serif text-xl font-bold text-teal transition-colors group-hover:text-coral">
                                {recipient.name}
                            </h3>
                            {recipient.relation && (
                                <p className="mt-0.5 truncate text-sm text-grey/60">{recipient.relation}</p>
                            )}
                        </div>
                    </div>

                    <div className="mt-5 space-y-3 border-t border-grey/10 pt-4">
                        {recipient.upcomingEvent ? (
                            <div className="flex items-center gap-2 text-sm text-grey/70">
                                <CalendarDays className="h-4 w-4 shrink-0 text-teal/70" />
                                <span className="truncate">
                                    {recipient.upcomingEvent.name}
                                    {recipient.upcomingEvent.daysLeft !== null && (
                                        <span className="text-grey/45"> · en {recipient.upcomingEvent.daysLeft} días</span>
                                    )}
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-grey/45">
                                <CalendarDays className="h-4 w-4 shrink-0" />
                                <span>Sin fechas próximas</span>
                            </div>
                        )}

                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm text-grey/70">
                                <Gift className="h-4 w-4 shrink-0 text-coral/80" />
                                <span>
                                    {recipient.giftIdeasCount === 1 ? "1 idea guardada" : `${recipient.giftIdeasCount} ideas guardadas`}
                                </span>
                            </div>
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-teal transition-transform group-hover:scale-105">
                                <Sparkles className="h-4 w-4" />
                            </div>
                        </div>
                    </div>
                </article>
            </Link>

            <ConfirmModal
                open={isConfirmOpen}
                title={`Eliminar a ${recipient.name}`}
                message="Se borrará esta persona y todas sus ideas de regalo guardadas. Esta acción no se puede deshacer."
                confirmLabel="Eliminar persona"
                cancelLabel="Volver"
                tone="danger"
                busy={isPending}
                onConfirm={confirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </>
    );
}
