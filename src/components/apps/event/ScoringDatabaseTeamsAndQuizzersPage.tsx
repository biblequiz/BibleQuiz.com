import type { ScoringDatabaseProviderContext } from "./ScoringDatabaseProvider";
import { useOutletContext } from "react-router-dom";

interface Props {
}

export default function ScoringDatabaseTeamsAndQuizzersPage({ }: Props) {
    const auth = useOutletContext<ScoringDatabaseProviderContext>().auth;

    return (
        <>
            <div>
                <b>Teams & Quizzers Section</b>
            </div>
            <p>
                This page includes the following:
            </p>
            <ul>
                <li>Manage Teams & Quizzers (like ScoreKeep).</li>
                <li>Import Teams & Quizzers from the Registration (including updates). The user should be able to specify how teams should be named.</li>
            </ul>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}