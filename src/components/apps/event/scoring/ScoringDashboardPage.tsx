import type { ScoringDatabaseProviderContext } from "./ScoringDatabaseProvider";
import { useOutletContext } from "react-router-dom";

interface Props {
}

export default function ScoringDashboardPage({ }: Props) {
    const context = useOutletContext<ScoringDatabaseProviderContext>();
    const auth = context.auth;

    return (
        <>
            <div>
                <b>Scoring Dashboard</b>
            </div>
            <p>
                This page includes the following:
            </p>
            <ul>
                <li>Ability to see the current state of the database.</li>
                <li>Stats about the current scoring.</li>
                <li>Cards and links to other sections.</li>
            </ul>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}