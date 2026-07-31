"use client";

import * as React from "react";
import type { IScannerControls } from "@zxing/browser";

// BarcodeDetector no está en los tipos DOM. Definimos lo mínimo que usamos.
interface DetectedBarcode {
    rawValue: string;
}
interface BarcodeDetectorInstance {
    detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
}
interface BarcodeDetectorCtor {
    new (opts?: { formats?: string[] }): BarcodeDetectorInstance;
}

/**
 * Motor de escaneo de códigos de barras reutilizable (PWA Fase 0.4).
 * Camino nativo `BarcodeDetector` (Android/Chrome) con fallback `@zxing/browser`
 * (iOS/Safari, Firefox) cargado en lazy solo cuando hace falta. Gestiona cámara y
 * limpieza; llama a `onDetect(rawValue)` por cada código leído (el caller valida).
 */
export function useBarcodeScanner(
    videoRef: React.RefObject<HTMLVideoElement | null>,
    onDetect: (rawValue: string) => void,
): { error: string; loading: boolean } {
    const [error, setError] = React.useState("");
    const [loading, setLoading] = React.useState(true);
    const onDetectRef = React.useRef(onDetect);
    onDetectRef.current = onDetect;

    React.useEffect(() => {
        let active = true;
        let stream: MediaStream | null = null;
        let controls: IScannerControls | null = null;
        let raf: number | null = null;

        const cleanup = () => {
            active = false;
            if (raf) cancelAnimationFrame(raf);
            controls?.stop();
            stream?.getTracks().forEach((t) => t.stop());
        };

        const start = async () => {
            try {
                const BarcodeDetector = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;

                if (BarcodeDetector) {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: { ideal: "environment" } },
                        audio: false,
                    });
                    if (!videoRef.current) return;
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                    setLoading(false);

                    const detector = new BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a"] });
                    const tick = async () => {
                        if (!active || !videoRef.current) return;
                        try {
                            const codes = await detector.detect(videoRef.current);
                            if (codes[0]?.rawValue) onDetectRef.current(codes[0].rawValue);
                        } catch {
                            /* frame no decodable: seguimos */
                        }
                        raf = requestAnimationFrame(tick);
                    };
                    raf = requestAnimationFrame(tick);
                } else {
                    const { BrowserMultiFormatReader } = await import("@zxing/browser");
                    const reader = new BrowserMultiFormatReader();
                    if (!videoRef.current) return;
                    setLoading(false);
                    controls = await reader.decodeFromConstraints(
                        { video: { facingMode: { ideal: "environment" } }, audio: false },
                        videoRef.current,
                        (result) => {
                            if (result) onDetectRef.current(result.getText());
                        },
                    );
                }
            } catch (e) {
                const name = (e as { name?: string })?.name;
                setLoading(false);
                if (name === "NotAllowedError" || name === "SecurityError") {
                    setError("No has dado permiso para usar la cámara. Actívalo en el navegador e inténtalo de nuevo.");
                } else if (name === "NotFoundError") {
                    setError("No hemos encontrado ninguna cámara en este dispositivo.");
                } else {
                    setError("No hemos podido abrir la cámara.");
                }
            }
        };

        void start();
        return cleanup;
    }, [videoRef]);

    return { error, loading };
}
