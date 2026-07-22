import { CreateClubClient } from "@/app/app/clubs/crear/CreateClubClient";

// El alta de clubs oficiales reutiliza el MISMO asistente que el alta de usuario,
// en modo oficial (mismos pasos + extras de escaparate). El backend reverifica el rol.
export default function CreateOriginalPage() {
    return <CreateClubClient official />;
}
