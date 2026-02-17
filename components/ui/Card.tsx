import * as React from "react"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    noPadding?: boolean
}

export function Card({ className = "", children, noPadding = false, ...props }: CardProps) {
    return (
        <div
            className={`
        bg-white rounded-xl border border-teal/5 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md
        ${noPadding ? "" : "p-4 md:p-6"}
        ${className}
      `}
            {...props}
        >
            {children}
        </div>
    )
}
