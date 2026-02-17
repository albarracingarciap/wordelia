"use client";

import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useEffect } from "react";

interface DiscussionGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
    pdfUrl: string;
    bookTitle: string;
}

export function DiscussionGuideModal({ isOpen, onClose, pdfUrl, bookTitle }: DiscussionGuideModalProps) {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
                onClick={onClose}
            />

            {/* Modal - Full screen */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 pointer-events-none">
                <div
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col pointer-events-auto animate-scale-in"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header - Ultra compact single line */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-grey/10 bg-gradient-to-r from-grey/5 to-transparent">
                        <h2 className="text-sm font-semibold text-grey truncate flex-1 mr-4">
                            Guía: {bookTitle}
                        </h2>

                        <div className="flex items-center gap-2 shrink-0">
                            {/* Register CTA */}
                            <Link href="/register">
                                <Button size="sm" className="bg-coral hover:bg-coral/90 text-white font-semibold text-xs px-3 h-7">
                                    Únete
                                </Button>
                            </Link>

                            {/* Download Button */}
                            <a
                                href={pdfUrl}
                                download
                                className="flex items-center gap-1.5 px-2.5 h-7 bg-teal hover:bg-teal-dark text-white rounded-md transition-colors font-semibold text-xs"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">PDF</span>
                            </a>

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="h-7 w-7 rounded-md bg-grey/10 hover:bg-grey/20 transition-colors flex items-center justify-center"
                            >
                                <X className="w-4 h-4 text-grey" />
                            </button>
                        </div>
                    </div>

                    {/* PDF Viewer - Maximum vertical space */}
                    <div className="flex-1 overflow-hidden bg-grey/5">
                        <iframe
                            src={`${pdfUrl}#view=FitH&toolbar=1&navpanes=0&zoom=page-width`}
                            className="w-full h-full"
                            title="Guía de Discusión"
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
