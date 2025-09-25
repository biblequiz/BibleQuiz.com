import { useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { AuthManager } from "types/AuthManager";

interface Props {
}

export interface EventProviderContext {
    auth: AuthManager;
    eventId: string;
    rootUrl: string;
}

export default function EventProvider({ }: Props) {
    const auth = AuthManager.useNanoStore();
    const urlParameters = useParams();
    const eventId = urlParameters.eventId || null;

    const [randomState, setRandomState] = useState(() => Math.random());
    useEffect(() => {
        setRandomState(Math.random());
    }, [eventId]);

    return (
        <>
            <div>
                <b>Event | {eventId || "New Event"} | {randomState}</b>
            </div>
            <Outlet context={{
                auth: auth,
                eventId: eventId,
                rootUrl: eventId ? `/${eventId}` : ""
            } as EventProviderContext} />
        </>);
}