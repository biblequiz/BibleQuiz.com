import type { ScoringDatabaseProviderContext } from "./ScoringDatabaseProvider";
import { useOutletContext } from "react-router-dom";

interface Props {
}

export default function ScoringDatabaseAppsPage({ }: Props) {
    const context = useOutletContext<ScoringDatabaseProviderContext>();
    const auth = context.auth;

    return (
        <>
            <div>
                <b>Scoring Apps Page</b>
            </div>
            <p>
                This page includes the following:
            </p>
            <ul>
                <li>List of apps connecting for the event.</li>
                <li>Stats about each device, its current room, and the last time it connected.</li>
            </ul>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}