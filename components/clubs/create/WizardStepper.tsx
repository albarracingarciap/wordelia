import * as React from "react";

interface WizardStepperProps {
    steps: string[];
    currentStep: number;
}

export function WizardStepper({ steps, currentStep }: WizardStepperProps) {
    return (
        <div className="relative mb-8 flex items-center justify-between px-1 sm:px-4">
            {/* Background Line */}
            <div className="absolute left-0 top-4 -z-10 h-0.5 w-full bg-grey/10" />

            {steps.map((label, index) => {
                const stepNum = index + 1;
                const isActive = stepNum === currentStep;
                const isCompleted = stepNum < currentStep;

                return (
                    <div key={label} className="flex min-w-0 flex-1 flex-col items-center gap-2 bg-cream px-1 sm:px-2">
                        <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold transition-all
                            ${isActive ? 'border-teal bg-teal text-white scale-110' : ''}
                            ${isCompleted ? 'border-teal bg-teal text-white' : ''}
                            ${!isActive && !isCompleted ? 'border-grey/20 bg-white text-grey/40' : ''}
                            `}
                        >
                            {isCompleted ? (
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                stepNum
                            )}
                        </div>
                        <span className={`max-w-full truncate text-[10px] font-bold uppercase tracking-wider transition-colors ${isActive ? 'text-teal' : 'text-grey/40'}`}>
                            {label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
