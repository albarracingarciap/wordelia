/**
 * Redimensiona una imagen (en el navegador) a un ancho máximo y la devuelve como
 * Blob JPEG, para subirla a storage sin gastar ancho de banda ni espacio de más.
 * Las fotos de móvil pueden pesar varios MB; esto las deja en unos pocos KB.
 */
export async function resizeImageToBlob(
    file: File,
    maxWidth = 640,
    quality = 0.82,
): Promise<Blob> {
    if (!file.type.startsWith("image/")) {
        throw new Error("El archivo no es una imagen.");
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("No hemos podido leer la imagen."));
        reader.readAsDataURL(file);
    });

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("No hemos podido procesar la imagen."));
        img.src = dataUrl;
    });

    const scale = Math.min(1, maxWidth / image.width);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No hemos podido preparar la imagen.");
    context.drawImage(image, 0, 0, width, height);

    return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("No hemos podido generar la imagen."))),
            "image/jpeg",
            quality,
        );
    });
}
