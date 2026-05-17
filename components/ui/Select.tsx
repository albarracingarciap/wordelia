import * as React from "react"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    options: { label: string; value: string }[];
    containerClassName?: string;
}

export function Select({ options, className = "", containerClassName = "", ...props }: SelectProps) {
    return (
        <div className={`relative inline-block ${containerClassName}`}>
            <select
                className={`
                appearance-none bg-white border border-teal/10 rounded-xl px-4 py-2 pr-8 
                text-sm text-grey focus:outline-none focus:border-teal/30 focus:ring-2 focus:ring-teal/5
                cursor-pointer transition-shadow
                ${className}
            `}
                {...props}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-teal/60">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
            </div>
        </div>
    )
}
