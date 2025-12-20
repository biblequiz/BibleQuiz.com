import type { EventProviderContext } from "../EventProvider";
import { useOutletContext } from "react-router-dom";

interface Props {
}

export default function ScoringSettingsPage({ }: Props) {
    const context = useOutletContext<EventProviderContext>();
    const auth = context.auth;

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
            </ul>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}