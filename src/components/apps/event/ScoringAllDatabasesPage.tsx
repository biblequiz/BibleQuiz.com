import { AuthManager } from "types/AuthManager";

interface Props {
}

export default function ScoringAllDatabasesPage({ }: Props) {
    const auth = AuthManager.useNanoStore();

    return (
        <>
            <div>
                <b>Scoring - All Databases</b>
            </div>
            <p>
                This page allows the user to:
            </p>
            <ul>
                <li>Add a new database.</li>
                <li>Edit an existing database.</li>
                <li>Download a database for use with ScoreKeep (useful during transition).</li>
                <li>Delete an unused database.</li>
            </ul>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}