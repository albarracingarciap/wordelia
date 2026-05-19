import Image from "next/image";
import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { WishlistData } from "@/app/app/wishes/wishlist-actions";

interface WishlistCardProps {
    wishlist: WishlistData;
}

export function WishlistCard({ wishlist }: WishlistCardProps) {
    const privacyIcon = {
        public: "🌍",
        private: "🔒",
        shared: "👥",
    };

    const privacyLabel = {
        public: "Pública",
        private: "Privada",
        shared: "Compartida",
    };

    const isEmpty = wishlist.bookCount === 0;
    const lastUpdatedLabel = wishlist.lastUpdated.toLowerCase().includes("0")
        ? "hoy"
        : wishlist.lastUpdated.toLowerCase();

    return (
        <Link href={`/app/wishes/${wishlist.id}`} className="group block">
            <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-teal/5 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <div className="mb-3 flex items-center gap-2">
                            <div className="flex w-fit shrink-0 items-center gap-1 rounded-full border border-black/5 bg-cream px-2 py-0.5 text-[10px] font-medium text-grey/80">
                                <span>{privacyIcon[wishlist.privacy]}</span>
                                <span className="hidden sm:inline">{privacyLabel[wishlist.privacy]}</span>
                            </div>
                        </div>

                        <h3 className="mb-1 truncate font-serif text-lg font-bold leading-tight text-teal transition-colors group-hover:text-coral">
                            {wishlist.emoji} {wishlist.name}
                        </h3>
                        <p className="text-xs text-grey/55">Actualizada {lastUpdatedLabel}</p>
                    </div>

                    <div className="relative h-[74px] w-[58px] shrink-0 sm:h-[86px] sm:w-[68px]">
                        {wishlist.coverImages.length > 0 ? (
                            <div className="relative flex h-full w-full items-center justify-center">
                                {wishlist.coverImages.slice(0, 3).map((img, i) => (
                                    <div
                                        key={img}
                                        className="absolute overflow-hidden rounded-sm border border-white shadow-sm"
                                        style={{
                                            width: "45px",
                                            height: "65px",
                                            left: `${i * 10}px`,
                                            top: `${i * 2}px`,
                                            zIndex: i,
                                            transform: `rotate(${(i - 1) * 6}deg)`,
                                        }}
                                    >
                                        <Image src={img} alt="Cubierta del libro" fill className="object-cover" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-xl bg-teal/5 text-teal/40">
                                        <BookOpen className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.5} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-black/5 pt-3">
                    {isEmpty ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-coral">
                            <Plus className="h-4 w-4" />
                            Añadir primer libro
                        </span>
                    ) : (
                        <span className="text-sm font-medium text-grey">
                            {wishlist.bookCount} {wishlist.bookCount === 1 ? "libro" : "libros"}
                        </span>
                    )}

                    <span className="translate-x-2 text-xs font-semibold text-teal opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
                        Ver lista →
                    </span>
                </div>
            </div>
        </Link>
    );
}
