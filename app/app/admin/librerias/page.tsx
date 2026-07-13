import { adminListOrganizations } from "./actions";
import { AdminLibreriasClient } from "./AdminLibreriasClient";

export const dynamic = "force-dynamic";

export default async function AdminLibreriasPage() {
    const organizations = await adminListOrganizations();
    return (
        <div className="mx-auto max-w-4xl p-6">
            <h1 className="mb-1 text-2xl font-bold text-teal-dark">Librerías</h1>
            <p className="mb-6 text-sm text-grey">Activa o desactiva el plan Pro de cada librería.</p>
            <AdminLibreriasClient organizations={organizations} />
        </div>
    );
}
