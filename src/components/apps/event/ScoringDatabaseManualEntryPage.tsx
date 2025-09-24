import type { ScoringDatabaseProviderContext } from "./ScoringDatabaseProvider";
import { useOutletContext } from "react-router-dom";

interface Props {
}

export default function ScoringDatabaseMeetsPage({ }: Props) {
    const auth = useOutletContext<ScoringDatabaseProviderContext>().auth;

    return (
        <>
            <div>
                <b>Manual Entry Section</b>
            </div>
            <p>
                This page includes the following:
            </p>
            <ul>
                <li>Manually edit and correct scores.</li>
            </ul>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}