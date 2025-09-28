import type { ScoringDatabaseProviderContext } from "./ScoringDatabaseProvider";
import { useOutletContext } from "react-router-dom";

interface Props {
}

export default function ScoringDatabasePlayoffsPage({ }: Props) {
    const auth = useOutletContext<ScoringDatabaseProviderContext>().auth;

    return (
        <>
            <div>
                <b>Playoffs Section</b>
            </div>
            <p>
                This page includes the following:
            </p>
            <ul>
                <li>Add and manage playoffs.</li>
                <li>Manually adjust rankings.</li>
            </ul>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}