import Link from "next/link";
import { Button } from "./Button";

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    eyebrow?: string;
    action?: {
        label: string;
        onClick?: () => void;
        href?: string;
        variant?: "primary" | "secondary" | "ghost" | "outline";
    };
    secondaryAction?: {
        label: string;
        onClick?: () => void;
        href?: string;
        variant?: "primary" | "secondary" | "ghost" | "outline";
    };
    className?: string;
    children?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, eyebrow, action, secondaryAction, className = "", children }: SectionHeaderProps) {
    return (
        <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8 ${className}`}>
            <div className="w-full">
                {eyebrow && (
                    <span className="block text-xs font-bold text-grey/40 uppercase tracking-widest mb-2">
                        {eyebrow}
                    </span>
                )}
                <h1 className="text-2xl md:text-3xl font-serif text-teal font-medium tracking-tight mb-2">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-gray-500 text-sm md:text-base max-w-2xl leading-relaxed">
                        {subtitle}
                    </p>
                )}

                {/* Render children here, typically metadata or extra tags */}
                {children && <div className="mt-4">{children}</div>}
            </div>

            {(action || secondaryAction) && (
                <div className="flex items-center gap-3 shrink-0 mb-auto md:mb-1">
                    {secondaryAction && (
                        secondaryAction.href ? (
                            <Link href={secondaryAction.href}>
                                <Button variant={secondaryAction.variant || "secondary"} size="sm">
                                    {secondaryAction.label}
                                </Button>
                            </Link>
                        ) : (
                            <Button variant={secondaryAction.variant || "secondary"} size="sm" onClick={secondaryAction.onClick}>
                                {secondaryAction.label}
                            </Button>
                        )
                    )}
                    {action && (
                        action.href ? (
                            <Link href={action.href}>
                                <Button variant={action.variant || "primary"} size="sm">
                                    {action.label}
                                </Button>
                            </Link>
                        ) : (
                            <Button variant={action.variant || "primary"} size="sm" onClick={action.onClick}>
                                {action.label}
                            </Button>
                        )
                    )}
                </div>
            )}
        </div>
    );
}
