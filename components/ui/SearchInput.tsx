import * as React from "react"

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onSearch?: (value: string) => void
}

export function SearchInput({ className = "", onSearch, ...props }: SearchInputProps) {
    return (
        <div className={`relative group ${className}`}>
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-grey/40 group-focus-within:text-teal transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
            </div>
            <input
                type="text"
                className="w-full pl-10 pr-4 py-2 bg-white/50 hover:bg-white focus:bg-white border border-teal/5 focus:border-teal/20 rounded-xl text-sm text-grey placeholder:text-grey/40 outline-none transition-all shadow-sm focus:shadow-md"
                {...props}
            />
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <span className="text-[10px] bg-white/50 border border-black/5 px-1.5 py-0.5 rounded text-grey/40 group-focus-within:opacity-0 transition-opacity">
                    /
                </span>
            </div>
        </div>
    )
}
