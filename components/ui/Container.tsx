import * as React from "react"

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`max-w-[1200px] mx-auto w-full ${className}`}>
            {children}
        </div>
    )
}
