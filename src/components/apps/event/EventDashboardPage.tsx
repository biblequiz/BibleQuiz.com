import { useOutletContext } from "react-router-dom";
import type { EventProviderContext } from "./EventProvider";

interface Props {
}

export default function EventDashboardPage({ }: Props) {
    const {
        auth,
        eventId,
        eventResultsUrl,
        registrations,
        payments
    } = useOutletContext<EventProviderContext>();

    return (
        <>
            <div>
                <b>Event Dashboard</b>
            </div>
            <p>
                Results URL: {eventResultsUrl}
            </p>
            <p>
                Registrations: {JSON.stringify(registrations)}
            </p>
            <p>
                Payments: {JSON.stringify(payments)}
            </p>
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