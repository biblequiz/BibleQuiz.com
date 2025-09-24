import type { ScoringDatabaseProviderContext } from "./ScoringDatabaseProvider";
import { useOutletContext } from "react-router-dom";

interface Props {
}

export default function ScoringDatabaseNewPage({ }: Props) {
    const auth = useOutletContext<ScoringDatabaseProviderContext>().auth;

    return (
        <>
            <div>
                <b>New Database</b>
            </div>
            <p>
                This page allows the user to create a new database.
            </p>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}