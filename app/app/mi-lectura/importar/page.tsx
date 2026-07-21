import { ImportClient } from "./ImportClient";

export const dynamic = "force-dynamic";

export default function ImportarBibliotecaPage() {
    return (
        <div className="mx-auto max-w-2xl py-6">
            <ImportClient />
        </div>
    );
}
