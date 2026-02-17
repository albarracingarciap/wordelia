"use client";

import * as React from "react"

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, label, ...props }, ref) => {
        return (
            <label className={`inline-flex items-start gap-3 cursor-pointer group ${className}`}>
                <div className="relative flex items-center mt-0.5">
                    <input
                        type="checkbox"
                        className="peer sr-only"
                        ref={ref}
                        {...props}
                    />
                    <div className="w-5 h-5 border border-grey/30 rounded-md bg-white peer-checked:bg-teal peer-checked:border-teal transition-all peer-focus:ring-2 peer-focus:ring-teal/20"></div>
                    <svg
                        className="absolute w-3.5 h-3.5 text-white left-[3px] top-[3px] opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="3"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                {label && (
                    <span className="text-sm text-grey/80 group-hover:text-grey-dark transition-colors select-none">
                        {label}
                    </span>
                )}
            </label>
        )
    }
)
Checkbox.displayName = "Checkbox"
