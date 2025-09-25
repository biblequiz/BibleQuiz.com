import type { ScoringDatabaseProviderContext } from "./ScoringDatabaseProvider";
import { useOutletContext } from "react-router-dom";

interface Props {
}

export default function ScoringDatabasePlayoffsPage({ }: Props) {
    const auth = useOutletContext<ScoringDatabaseProviderContext>().auth;

    return (
        <>
            <div>
                <b>Awards Section</b>
            </div>
            <p>
                This page includes the following:
            </p>
            <ul>
                <li>Generate Awards.</li>
            </ul>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}