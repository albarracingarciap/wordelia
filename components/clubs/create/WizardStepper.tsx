import * as React from "react";

interface WizardStepperProps {
    steps: string[];
    currentStep: number;
}

export function WizardStepper({ steps, currentStep }: WizardStepperProps) {
    return (
        <div className="flex items-center justify-between relative mb-8 px-4">
            {/* Background Line */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-grey/10 -z-10" />

            {steps.map((label, index) => {
                const stepNum = index + 1;
                const isActive = stepNum === currentStep;
                const isCompleted = stepNum < currentStep;

                return (
                    <div key={label} className="flex flex-col items-center gap-2 bg-cream px-2">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                            ${isActive ? 'border-teal bg-teal text-white scale-110' : ''}
                            ${isCompleted ? 'border-teal bg-teal text-white' : ''}
                            ${!isActive && !isCompleted ? 'border-grey/20 bg-white text-grey/40' : ''}
                            `}
                        >
                            {isCompleted ? (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                stepNum
                            )}
                        </div>
                        <span className={`text-[10px] uppercase tracking-wider font-bold transition-colors ${isActive ? 'text-teal' : 'text-grey/40'}`}>
                            {label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
