import { AuthManager } from "types/AuthManager";

interface Props {
}

export default function ScoringSettingsPage({ }: Props) {
    const auth = AuthManager.useNanoStore();

    return (
        <>
            <div>
                <b>Scoring - General Settings</b>
            </div>
            <p>
                This page includes the following:
            </p>
            <ul>
                <li>Enable electronic scoring</li>
                <li>Set the EZScore code.</li>
                <li>Show the Scores in Live & Upcoming Events</li>
                <li>Show the Scores in BibleQuiz.com Archive</li>
                <li>List of databases</li>
                <li>Button to add database.</li>
            </ul>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}