import * as React from "react";

interface RatingProps {
    value: number; // 0-5
    onChange: (val: number) => void;
    readOnly?: boolean;
}

export function Rating({ value, onChange, readOnly = false }: RatingProps) {
    const [hoverValue, setHoverValue] = React.useState<number | null>(null);

    return (
        <div className="flex items-center gap-1.5" onMouseLeave={() => setHoverValue(null)}>
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => !readOnly && onChange(star)}
                    onMouseEnter={() => !readOnly && setHoverValue(star)}
                    className={`text-2xl transition-transform ${readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
                    disabled={readOnly}
                >
                    <span className={
                        (hoverValue !== null ? star <= hoverValue : star <= value)
                            ? "text-coral"
                            : "text-grey/20"
                    }>
                        ★
                    </span>
                </button>
            ))}
        </div>
    );
}
