"use client";

import React, { useState } from 'react';
import { Section } from '../ui/Section';
import { Button } from '../ui/Button';
import { Check, X } from 'lucide-react';

const plans = [
    {
        name: "Lector Explorador",
        monthlyPrice: "0€",
        annualPrice: "0€",
        originalAnnualPrice: null,
        description: "Ideal para empezar a organizar tu biblioteca y probar la experiencia Wordelia.",
        features: [
            { text: "Biblioteca ilimitada", included: true },
            { text: "Estadísticas básicas", included: true },
            { text: "ADN Literario (3 consultas/mes)", included: true },
            { text: "Unirse a Clubes públicos", included: true },
            { text: "Modo Tienda básico", included: true },
            { text: "Mapas Emocionales", included: false },
            { text: "Crear Clubes privados", included: false },
            { text: "Asistente AI Personal", included: false },
        ]
    },
    {
        name: "Lector Voraz",
        monthlyPrice: "4.99€",
        annualPrice: "47.90€",
        originalAnnualPrice: "59.88€",
        description: "El estándar para quien ama profundizar en sus lecturas y conectar con otros.",
        popular: true,
        features: [
            { text: "Todo lo del plan Gratuito", included: true },
            { text: "ADN Literario ilimitado", included: true },
            { text: "Mapas Emocionales de trama", included: true },
            { text: "Crear y moderar Clubes", included: true },
            { text: "Estadísticas Avanzadas", included: true },
            { text: "Sin publicidad", included: true },
            { text: "Asistente AI Personal", included: false },
            { text: "Guías de discusión AI", included: false },
        ]
    },
    {
        name: "Bibliófilo AI",
        monthlyPrice: "9.99€",
        annualPrice: "95.90€",
        originalAnnualPrice: "119.88€",
        description: "Para el usuario que quiere la máxima potencia tecnológica y social.",
        features: [
            { text: "Todo lo del plan Premium", included: true },
            { text: "Asistente AI Personal (Chat con libros)", included: true },
            { text: "Guías de discusión AI automáticas", included: true },
            { text: "Destaque en perfil y badges", included: true },
            { text: "Acceso anticipado a novedades", included: true },
            { text: "Soporte prioritario", included: true },
        ]
    }
];

export function Pricing() {
    const [isAnnual, setIsAnnual] = useState(false);

    return (
        <Section className="py-24 bg-[#FFFAEF]">
            <div className="max-w-[1248px] mx-auto px-6 md:px-8">

                {/* Header Section */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-[family-name:var(--font-dancing)] text-teal mb-6">
                        Elige tu camino de lectura
                    </h2>
                    <p className="text-grey mb-8">
                        Escala a tu ritmo. Desde el lector casual hasta el bibliófilo más voraz.
                    </p>

                    {/* Toggle Switch */}
                    <div className="flex items-center justify-center gap-4 text-sm font-medium">
                        <span className={`transition-colors ${!isAnnual ? 'text-teal-dark font-bold' : 'text-grey/60'}`}>Mensual</span>
                        <button
                            className={`relative flex items-center w-14 h-7 rounded-full p-1 transition-colors duration-300 focus:outline-none cursor-pointer ${isAnnual ? 'bg-teal' : 'bg-grey/20'}`}
                            onClick={() => setIsAnnual(!isAnnual)}
                            aria-label="Toggle annual pricing"
                        >
                            <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-sm ${isAnnual ? 'translate-x-7' : 'translate-x-0'}`} />
                        </button>
                        <span className={`transition-colors ${isAnnual ? 'text-teal-dark font-bold' : 'text-grey/60'}`}>
                            Anual <span className="text-coral ml-1">-20%</span>
                        </span>
                    </div>
                </div>

                {/* Pricing Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`relative bg-white rounded-3xl p-8 flex flex-col h-full 
                                ${plan.popular
                                    ? 'border-2 border-coral shadow-xl shadow-coral/10 md:-translate-y-4'
                                    : 'border border-teal/10 shadow-sm'}`}
                        >

                            {/* Popular Badge */}
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-coral text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg">
                                    Más popular
                                </div>
                            )}

                            {/* Card Header */}
                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-teal-dark mb-4">{plan.name}</h3>

                                {/* Price Display Area */}
                                <div className="mb-4 h-16 flex flex-col justify-end">
                                    {isAnnual && plan.originalAnnualPrice && (
                                        <div className="text-sm text-grey/40 line-through mb-1 animate-fade-in">
                                            {plan.originalAnnualPrice}
                                        </div>
                                    )}
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-grey-dark transition-all duration-300">
                                            {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                                        </span>
                                        {(isAnnual ? plan.annualPrice !== "0€" : plan.monthlyPrice !== "0€") && (
                                            <span className="text-sm text-grey/60 transition-all duration-300">
                                                {isAnnual ? '/año' : '/mes'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <p className="text-sm text-grey/80 min-h-[60px]">
                                    {plan.description}
                                </p>
                            </div>

                            {/* Features List */}
                            <ul className="space-y-4 mb-8 flex-grow">
                                {plan.features.map((feature, fIndex) => (
                                    <li key={fIndex} className="flex items-start gap-3">
                                        <div className="mt-0.5 shrink-0">
                                            {feature.included ? (
                                                <div className="bg-teal/10 rounded-full p-1">
                                                    <Check className="w-3 h-3 text-teal" />
                                                </div>
                                            ) : (
                                                <div className="bg-grey/5 rounded-full p-1">
                                                    <X className="w-3 h-3 text-grey/40" />
                                                </div>
                                            )}
                                        </div>
                                        <span className={`text-sm ${feature.included ? 'text-grey' : 'text-grey/40 line-through'}`}>
                                            {feature.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA Button */}
                            <Button
                                variant={plan.popular ? 'primary' : 'outline'}
                                className={`w-full justify-center ${plan.popular ? 'bg-coral hover:bg-coral/90 border-coral' : ''}`}
                            >
                                {plan.monthlyPrice === "0€" ? "Empezar gratis" : "Seleccionar plan"}
                            </Button>
                        </div>
                    ))}
                </div>

                {/* B2B / Education Callout */}
                <div className="mt-12 bg-white rounded-3xl p-8 md:p-12 border border-teal/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-2xl text-center md:text-left">
                        <h3 className="text-2xl font-bold text-teal-dark mb-3">¿Eres un Club de lectura, Librería o Institución Educativa?</h3>
                        <p className="text-grey/80">
                            Wordelia tiene herramientas específicas para gestión de grandes grupos, analítica de aprendizaje y marca blanca. Habla con nuestro equipo para diseñar un plan a medida.
                        </p>
                    </div>
                    <div className="shrink-0 w-full md:w-auto">
                        <Button
                            variant="outline"
                            className="w-full md:w-auto px-8 border-teal/30 text-teal hover:bg-teal hover:text-white transition-colors"
                            onClick={() => window.location.href = '/contacto'}
                        >
                            Contactar con ventas
                        </Button>
                    </div>
                </div>
            </div>
        </Section>
    );
}
