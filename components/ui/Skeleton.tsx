import { HTMLAttributes } from "react";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={`animate-pulse rounded-md bg-teal/5 ${className}`}
            {...props}
        />
    );
}
