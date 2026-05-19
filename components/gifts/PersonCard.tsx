import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Gift, Sparkles } from "lucide-react";
import { GiftRecipientData } from "@/app/app/wishes/gift-actions";

interface PersonCardProps {
    recipient: GiftRecipientData;
}

export function PersonCard({ recipient }: PersonCardProps) {
    const isSoon = recipient.upcomingEvent?.daysLeft !== null &&
        recipient.upcomingEvent?.daysLeft !== undefined &&
        recipient.upcomingEvent.daysLeft <= 7;

    return (
        <Link href={`/app/wishes/person/${recipient.id}`} className="group block">
            <article className="relative flex min-h-[168px] flex-col rounded-2xl border border-teal/10 bg-white p-5 shadow-sm transition-all hover:border-teal/20 hover:shadow-md">
                {isSoon && (
                    <div className="absolute right-4 top-4 rounded-full bg-coral/10 px-3 py-1 text-xs font-bold text-coral">
                        {recipient.upcomingEvent!.daysLeft === 0 ? "Hoy" : `${recipient.upcomingEvent!.daysLeft} días`}
                    </div>
                )}

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
    );
}
