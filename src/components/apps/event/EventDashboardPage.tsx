import { AuthManager } from "types/AuthManager";

interface Props {
}

export default function EventDashboardPage({ }: Props) {
    const auth = AuthManager.useNanoStore();

    return (
        <>
            <div>
                <b>Event Dashboard</b>
            </div>
            <p>
                This is a landing page for the event. It will include:
            </p>
            <ul>
                <li>Summary of registrations and databases.</li>
                <li>Links to common tasks (edit registration, download reports, manage databases).</li>
            </ul>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}