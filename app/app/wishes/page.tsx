'use client';

import { useState } from "react";
import { WishlistCard } from "@/components/wishes/WishlistCard";
import { PersonCard } from "@/components/gifts/PersonCard";
import { MOCK_WISHLISTS, MOCK_RECIPIENTS } from "@/lib/mock-data";

export default function WishesDashboard() {
    const [activeTab, setActiveTab] = useState<'wishes' | 'gifts'>('wishes');

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="font-serif text-3xl md:text-4xl text-teal mb-2">Lista de Deseos ✨</h1>
                        <p className="text-grey text-lg max-w-xl">
                            Gestiona tus sueños y los regalos para tus seres queridos.
                        </p>
                    </div>

                    {/* Primary Action Button (Changes based on tab) */}
                    {activeTab === 'wishes' ? (
                        <button className="bg-coral text-white px-6 py-2 rounded-full font-medium hover:bg-opacity-90 transition-all shadow-sm flex items-center gap-2">
                            <span>＋</span> Crear Nueva Lista
                        </button>
                    ) : (
                        <button className="bg-teal text-white px-6 py-2 rounded-full font-medium hover:bg-teal-dark transition-all shadow-sm flex items-center gap-2">
                            <span>👤</span> Añadir Persona
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-grey/10">
                    <button
                        onClick={() => setActiveTab('wishes')}
                        className={`px-6 py-3 font-medium text-sm transition-all relative ${activeTab === 'wishes' ? 'text-teal' : 'text-grey/60 hover:text-grey'}`}
                    >
                        Mis Deseos
                        {activeTab === 'wishes' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-teal rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('gifts')}
                        className={`px-6 py-3 font-medium text-sm transition-all relative ${activeTab === 'gifts' ? 'text-teal' : 'text-grey/60 hover:text-grey'}`}
                    >
                        Mis Regalos
                        {activeTab === 'gifts' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-teal rounded-t-full" />}
                    </button>
                </div>
            </div>

            {/* Content - Wishes */}
            {activeTab === 'wishes' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {MOCK_WISHLISTS.map((list) => (
                        <WishlistCard key={list.id} wishlist={list} />
                    ))}

                    {/* "Add New" Card Placeholder */}
                    <button className="group border-2 border-dashed border-teal/20 rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:border-teal/50 hover:bg-teal/5 transition-all min-h-[300px] text-grey/60 hover:text-teal">
                        <div className="w-16 h-16 rounded-full bg-teal/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
                            ＋
                        </div>
                        <span className="font-medium text-lg">Crear otra lista</span>
                    </button>
                </div>
            )}

            {/* Content - Gifts */}
            {activeTab === 'gifts' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                    {/* Warning/Notification Area */}
                    <div className="bg-white border-l-4 border-coral p-4 rounded-r-xl shadow-sm flex items-start gap-3">
                        <span className="text-2xl">💡</span>
                        <div>
                            <h4 className="font-bold text-teal text-sm">Recordatorio Inteligente</h4>
                            <p className="text-grey text-xs mt-1">
                                Se acerca el aniversario de <span className="font-bold">Clara</span> (5 días). Tienes 4 ideas guardadas. ¿Repasamos?
                            </p>
                        </div>
                        <button className="ml-auto text-xs font-bold text-coral underline hover:text-coral-dark">Ver ideas</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {MOCK_RECIPIENTS.map((person) => (
                            <PersonCard key={person.id} recipient={person} />
                        ))}

                        {/* "Add Friend" Card Placeholder */}
                        <button className="group border-2 border-dashed border-teal/20 rounded-xl p-6 flex items-center justify-center gap-4 hover:border-teal/50 hover:bg-teal/5 transition-all text-grey/60 hover:text-teal h-[120px]">
                            <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">
                                ＋
                            </div>
                            <span className="font-medium">Añadir nuevo perfil</span>
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}
