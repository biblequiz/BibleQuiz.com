import type { ScoringDatabaseProviderContext } from "./ScoringDatabaseProvider";
import { useOutletContext } from "react-router-dom";

interface Props {
}

export default function ScoringDatabaseLiveScoresPage({ }: Props) {
    const auth = useOutletContext<ScoringDatabaseProviderContext>().auth;

    return (
        <>
            <div>
                <b>Live Scores Section</b>
            </div>
            <p>
                This page includes the following:
            </p>
            <ul>
                <li>Change settings for what is visible.</li>
                <li>View the live scores for a meet.</li>
            </ul>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}