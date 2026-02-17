import { Button } from "../ui/Button";

interface EmptyStateProps {
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
    icon?: React.ReactNode;
}

export function EmptyState({ title, description, actionLabel, onAction, secondaryActionLabel, onSecondaryAction, icon }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-24 h-24 bg-teal/5 rounded-full flex items-center justify-center mb-6 text-teal/40">
                {icon || <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>}
            </div>
            <h3 className="text-xl md:text-2xl font-serif text-teal mb-2">{title}</h3>
            <p className="text-grey/80 max-w-md mb-8 leading-relaxed">
                {description}
            </p>
            <div className="flex gap-3">
                {secondaryActionLabel && (
                    <Button variant="secondary" onClick={onSecondaryAction}>{secondaryActionLabel}</Button>
                )}
                {actionLabel && (
                    <Button onClick={onAction}>{actionLabel}</Button>
                )}
            </div>
        </div>
    );
}
