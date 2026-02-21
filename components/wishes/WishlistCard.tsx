import Image from "next/image";
import Link from "next/link";
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

    return (
        <Link href={`/app/wishes/${wishlist.id}`} className="group block">
            <div className="bg-white rounded-xl border border-teal/5 shadow-sm hover:shadow-md transition-all p-5 h-full flex flex-col relative overflow-hidden">

                <div className="flex justify-between items-start gap-4 mb-4">
                    {/* Left: Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-cream text-grey/80 border border-black/5 flex items-center gap-1 shrink-0 w-fit">
                                <span>{privacyIcon[wishlist.privacy]}</span>
                                <span className="hidden sm:inline">{privacyLabel[wishlist.privacy]}</span>
                            </div>
                        </div>
                        <h3 className="font-serif text-lg font-bold text-teal group-hover:text-coral transition-colors line-clamp-2 leading-tight mb-1">
                            {wishlist.emoji} {wishlist.name}
                        </h3>
                        <p className="text-xs text-grey/60">Act: {wishlist.lastUpdated}</p>
                    </div>

                    {/* Right: Mini Pile */}
                    <div className="w-[70px] h-[90px] relative shrink-0">
                        {wishlist.coverImages.length > 0 ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                                {wishlist.coverImages.slice(0, 3).map((img, i) => (
                                    <div
                                        key={i}
                                        className="absolute shadow-sm rounded-sm overflow-hidden border border-white"
                                        style={{
                                            width: "45px",
                                            height: "65px",
                                            left: `${i * 10}px`,
                                            top: `${i * 2}px`,
                                            zIndex: i,
                                            transform: `rotate(${(i - 1) * 6}deg)`,
                                        }}
                                    >
                                        <Image src={img} alt="Book cover" fill className="object-cover" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="w-full h-full bg-grey/5 rounded flex items-center justify-center text-2xl">
                                {wishlist.emoji}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-auto border-t border-black/5 pt-3 flex justify-between items-center">
                    <span className="text-sm font-medium text-grey">
                        {wishlist.bookCount} {wishlist.bookCount === 1 ? "libro" : "libros"}
                    </span>
                    <span className="text-xs text-coral font-semibold opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                        Ver lista →
                    </span>
                </div>
            </div>
        </Link>
    );
}
