import { AuthManager } from "types/AuthManager";

interface Props {
}

export default function ScoringPage({ }: Props) {
    const auth = AuthManager.useNanoStore();

    return (
        <>
            <div>
                <b>Scoring Page</b>
            </div>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}