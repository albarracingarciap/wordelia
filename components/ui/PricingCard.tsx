"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Check } from "lucide-react";

interface PricingFeature {
    text: string;
    included: boolean;
}

interface PricingCardProps {
    title: string;
    price: string;
    period?: string;
    description: string;
    features: PricingFeature[];
    buttonText: string;
    isPopular?: boolean;
    variant?: "default" | "premium" | "pro";
    onButtonClick?: () => void;
}

export function PricingCard({
    title,
    price,
    period,
    description,
    features,
    buttonText,
    isPopular = false,
    variant = "default",
    onButtonClick,
}: PricingCardProps) {
    const isPremium = variant === "premium";
    const isPro = variant === "pro";

    // Styles based on variant
    const cardBorderColor = isPro ? "border-coral" : isPremium ? "border-teal" : "border-grey/20";
    const cardShadow = isPro ? "shadow-xl shadow-coral/10" : isPremium ? "shadow-lg shadow-teal/10" : "shadow-sm";
    const titleColor = isPro ? "text-coral" : isPremium ? "text-teal" : "text-grey-dark";
    const buttonVariant = isPro ? "primary" : isPremium ? "primary" : "outline";

    // Custom button style for Pro to match Coral theme if primary is teal-based (assuming Button primary is coral based on previous files, but let's stick to standard variants)
    // Actually from Button.tsx: primary is coral, ghost is teal. 
    // Let's use primary (coral) for Pro, and maybe a custom class for Premium if we want it Teal, or just keep Primary. 
    // In Wordelia, Teal is often secondary or brand, Coral is action.
    // Let's make Premium button Teal and Pro button Coral.

    return (
        <Card className={`relative flex flex-col h-full border-2 ${cardBorderColor} ${cardShadow} transition-transform hover:-translate-y-1 duration-300`}>
            {isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-coral text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-wider">
                    Más Popular
                </div>
            )}

            <div className="p-6 md:p-8 flex-grow">
                <h3 className={`text-xl font-serif font-bold mb-2 ${titleColor}`}>{title}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-bold text-grey-dark">{price}</span>
                    {period && <span className="text-grey/60 text-sm font-medium">{period}</span>}
                </div>
                <p className="text-grey/80 text-sm mb-8 leading-relaxed min-h-[40px]">
                    {description}
                </p>

                <ul className="space-y-4 mb-8">
                    {features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm">
                            <div className={`mt-0.5 rounded-full p-0.5 ${feature.included ? (isPro ? "bg-coral/10 text-coral" : "bg-teal/10 text-teal") : "bg-grey/10 text-grey/40"}`}>
                                <Check className="w-3.5 h-3.5" strokeWidth={3} />
                            </div>
                            <span className={`${feature.included ? "text-grey-dark" : "text-grey/50 line-through"}`}>
                                {feature.text}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="p-6 md:p-8 pt-0 mt-auto">
                <Button
                    fullWidth
                    variant={buttonVariant}
                    onClick={onButtonClick}
                    className={isPremium ? "bg-teal hover:bg-teal-dark border-transparent text-white focus:ring-teal" : ""}
                >
                    {buttonText}
                </Button>
            </div>
        </Card>
    );
}
