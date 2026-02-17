import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    helperText?: string;
    fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, helperText, fullWidth = true, type, ...props }, ref) => {
        const [showPassword, setShowPassword] = React.useState(false)
        const isPassword = type === "password"

        const togglePasswordVisibility = () => {
            setShowPassword(!showPassword)
        }

        const inputType = isPassword ? (showPassword ? "text" : "password") : type

        return (
            <div className={`${fullWidth ? "w-full" : ""} mb-4`}>
                {label && (
                    <label className="block text-xs font-bold text-grey/60 uppercase tracking-widest mb-2">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <input
                        type={inputType}
                        className={`
                            w-full bg-cream/30 border border-teal/10 rounded-xl px-4 py-3 
                            text-teal-dark placeholder:text-grey/30 text-sm 
                            focus:outline-none focus:border-teal/30 focus:bg-white focus:ring-2 focus:ring-teal/5
                            transition-all
                            ${isPassword ? "pr-10" : ""}
                            ${className}
                        `}
                        ref={ref}
                        {...props}
                    />
                    {isPassword && (
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-grey/40 hover:text-teal transition-colors focus:outline-none"
                            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    )}
                </div>
                {helperText && (
                    <p className="text-xs text-grey/40 mt-1.5 ml-1">{helperText}</p>
                )}
            </div>
        )
    }
)
Input.displayName = "Input"
