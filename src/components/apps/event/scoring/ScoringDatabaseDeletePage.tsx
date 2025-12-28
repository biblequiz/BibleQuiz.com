import type { ScoringDatabaseProviderContext } from "./ScoringDatabaseProvider";
import { useOutletContext } from "react-router-dom";

interface Props {
}

export default function ScoringDatabaseDeletePage({ }: Props) {
    const context = useOutletContext<ScoringDatabaseProviderContext>();
    const auth = context.auth;

    return (
        <>
            <div>
                <b>Delete Database Page</b>
            </div>
            <p>
                This page allows you to delete the database.
            </p>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}