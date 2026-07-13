import { CreateClubClient } from "./CreateClubClient";

export default async function CreateClubPage({
    searchParams,
}: {
    searchParams: Promise<{ org?: string }>;
}) {
    const { org } = await searchParams;
    return <CreateClubClient organizationId={org} />;
}
