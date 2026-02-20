"use client"

import * as React from "react"

interface SwitchProps {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    className?: string;
    disabled?: boolean;
}

export function Switch({ checked = false, onCheckedChange, className = "", disabled = false }: SwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onCheckedChange?.(!checked)}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                width: '44px',
                height: '24px',
                borderRadius: '9999px',
                border: 'none',
                padding: '2px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                backgroundColor: checked ? '#336871' : '#c0c0c0',
                transition: 'background-color 0.2s ease-in-out',
                flexShrink: 0,
                outline: 'none',
            }}
        >
            <span
                style={{
                    display: 'block',
                    width: '18px',
                    height: '18px',
                    borderRadius: '9999px',
                    backgroundColor: 'white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    transform: checked ? 'translateX(20px)' : 'translateX(0px)',
                    transition: 'transform 0.2s ease-in-out',
                }}
            />
        </button>
    )
}
