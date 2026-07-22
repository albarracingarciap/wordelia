import { adminListEvents } from "./actions";
import { EventsAdminClient } from "./EventsAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
    const events = await adminListEvents();
    return (
        <div className="p-6 md:p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground">Eventos Wordelia</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Encuentros organizados por Wordelia. Los lectores consiguen su entrada gastando monedas.
                </p>
            </div>
            <EventsAdminClient initial={events} />
        </div>
    );
}
