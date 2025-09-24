import type { ScoringDatabaseProviderContext } from "./ScoringDatabaseProvider";
import { useOutletContext } from "react-router-dom";

interface Props {
}

export default function ScoringDatabaseGeneralPage({ }: Props) {
    const context = useOutletContext<ScoringDatabaseProviderContext>();
    const auth = context.auth;

    return (
        <>
            <div>
                <b>General Section</b>
            </div>
            <p>
                This page includes the following:
            </p>
            <ul>
                <li>Name the database.</li>
                <li>Hide the database.</li>
                <li>Delete the database.</li>
            </ul>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}