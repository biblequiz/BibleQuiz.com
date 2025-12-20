import type { ScoringDatabaseProviderContext } from "./ScoringDatabaseProvider";
import { useOutletContext } from "react-router-dom";

interface Props {
}

export default function ScoringDatabaseMeetsPage({ }: Props) {
    const context = useOutletContext<ScoringDatabaseProviderContext>();
    const auth = context.auth;

    return (
        <>
            <div>
                <b>Meets Section</b>
            </div>
            <p>
                This page includes the following:
            </p>
            <ul>
                <li>Ability to manage Meets, including the teams, schedule, rules, etc. like ScoreKeep allows today.</li>
            </ul>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}