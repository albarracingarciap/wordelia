import * as React from "react"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    count?: number
    dot?: boolean
    variant?: "neutral" | "brand" | "outline" | "coral" | "teal"
    size?: "sm" | "md"
    className?: string
}

export function Badge({ count, dot, variant, size = "md", className = "", children, ...props }: BadgeProps) {
    // Tag/Chip Mode
    if (variant) {
        const variantStyles = {
            neutral: "bg-grey/10 text-grey-dark border border-transparent",
            brand: "bg-teal/10 text-teal-dark border border-transparent",
            outline: "bg-transparent border border-grey/20 text-grey",
            coral: "bg-coral/10 text-coral-dark border border-transparent",
            teal: "bg-teal/10 text-teal-dark border border-transparent",
        }[variant] || "bg-grey/10 text-grey-dark border border-transparent"

        const sizeStyles = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-0.5"

        return (
            <span
                className={`inline-flex items-center justify-center font-bold rounded-full ${variantStyles} ${sizeStyles} ${className}`}
                {...props}
            >
                {children}
            </span>
        )
    }

    // Notification Badge Mode
    return (
        <div className="relative inline-flex">
            {children}
            {(count || dot) && (
                <span
                    className={`
            absolute -top-1 -right-1 flex items-center justify-center
            bg-coral text-white font-bold
            ${dot ? "w-2.5 h-2.5 rounded-full" : "min-w-[18px] h-[18px] px-1 text-[10px] rounded-full"}
            border-2 border-cream ring-1 ring-cream
            ${className}
          `}
                    {...props}
                >
                    {!dot && count && count > 99 ? "99+" : count}
                </span>
            )}
        </div>
    )
}
