import * as React from "react"
import Image from "next/image"

interface AvatarProps {
    src?: string
    alt?: string
    fallback?: string
    size?: "sm" | "md" | "lg"
    className?: string
}

export function Avatar({ src, alt = "User", fallback = "U", size = "md", className = "" }: AvatarProps) {
    const sizeClasses = {
        sm: "w-8 h-8 text-xs",
        md: "w-10 h-10 text-sm",
        lg: "w-12 h-12 text-base",
    }

    return (
        <div
            className={`relative rounded-full overflow-hidden bg-teal/10 border border-teal/5 flex items-center justify-center text-teal font-medium shrink-0 ${sizeClasses[size]} ${className}`}
        >
            {src ? (
                <Image src={src} alt={alt} fill className="object-cover" />
            ) : (
                <span>{fallback.slice(0, 2).toUpperCase()}</span>
            )}
        </div>
    )
}
