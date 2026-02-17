import * as React from "react";
import Image from "next/image"; // Assuming Avatar usually uses Image or fallback

interface AvatarStackProps {
    avatars: { src?: string; alt?: string; fallback?: string }[];
    max?: number;
    size?: "sm" | "md";
    className?: string;
}

export function AvatarStack({ avatars, max = 3, size = "sm", className = "" }: AvatarStackProps) {
    const visibleAvatars = avatars.slice(0, max);
    const remaining = Math.max(0, avatars.length - max);

    // Size mapping
    const sizeClasses = size === "sm" ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm";
    const borderClass = "border-2 border-white";

    return (
        <div className={`flex items-center -space-x-2 ${className}`}>
            {visibleAvatars.map((user, i) => (
                <div key={i} className={`relative rounded-full overflow-hidden bg-teal/10 flex items-center justify-center ${sizeClasses} ${borderClass}`}>
                    {user.src ? (
                        <Image
                            src={user.src}
                            alt={user.alt || "User"}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <span className="font-bold text-teal">{user.fallback || user.alt?.[0] || "?"}</span>
                    )}
                </div>
            ))}
            {remaining > 0 && (
                <div className={`relative rounded-full bg-cream-dark text-grey font-medium flex items-center justify-center ${sizeClasses} ${borderClass}`}>
                    +{remaining}
                </div>
            )}
        </div>
    );
}
