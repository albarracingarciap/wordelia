import { CreateChallengeClient } from "./CreateChallengeClient";
import { getBadgesForSelect } from "./actions";

export const dynamic = "force-dynamic";

export default async function NewChallengePage() {
    const badges = await getBadgesForSelect();
    return <CreateChallengeClient badges={badges} />;
}
