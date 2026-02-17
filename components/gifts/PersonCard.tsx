import Image from "next/image";
import Link from "next/link";
import { GiftRecipient } from "@/lib/mock-data";

interface PersonCardProps {
    recipient: GiftRecipient;
}

export function PersonCard({ recipient }: PersonCardProps) {
    return (
        <Link href={`/app/wishes/person/${recipient.id}`} className="group block">
            <div className="bg-white rounded-xl border border-teal/5 shadow-sm hover:shadow-md transition-all p-5 flex items-center gap-4 relative overflow-hidden">

                {/* Upcoming Event Indicator (Banner) */}
                {recipient.upcomingEvent && recipient.upcomingEvent.daysLeft <= 7 && (
                    <div className="absolute top-0 right-0 bg-coral/10 text-coral text-[10px] font-bold px-2 py-0.5 rounded-bl-md">
                        ¡{recipient.upcomingEvent.daysLeft} días! ⏰
                    </div>
                )}

                {/* Avatar */}
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0">
                    <Image src={recipient.avatarUrl} alt={recipient.name} width={64} height={64} className="object-cover h-full w-full" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-lg font-bold text-teal truncate group-hover:text-coral transition-colors">
                        {recipient.name}
                    </h3>
                    <p className="text-xs text-grey/60 mb-1">{recipient.relation}</p>

                    {recipient.upcomingEvent ? (
                        <p className="text-xs text-teal font-medium">
                            🎉 {recipient.upcomingEvent.name} ({recipient.upcomingEvent.date})
                        </p>
                    ) : (
                        <p className="text-xs text-grey/40 italic">Sin eventos próximos</p>
                    )}
                </div>

                {/* Stats / Chevron */}
                <div className="flex flex-col items-end justify-center pl-2 border-l border-grey/5">
                    <span className="text-xl font-bold text-grey/80">{recipient.giftIdeasCount}</span>
                    <span className="text-[10px] text-grey/60 uppercase">Ideas</span>
                </div>

            </div>
        </Link>
    );
}
