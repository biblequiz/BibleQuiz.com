import { Outlet, useOutletContext } from "react-router-dom";
import { AuthManager } from "types/AuthManager";
import type { EventProviderContext } from "./EventProvider";
import { useEffect, useState } from "react";

interface Props {
}

export interface RegistrationProviderContext {
    auth: AuthManager;
}

export default function RegistrationProvider({ }: Props) {
    const context = useOutletContext<EventProviderContext>();
    const auth = context.auth;
    const eventId = context.eventId;

    const [randomState, setRandomState] = useState(() => Math.random());
    useEffect(() => {
        setRandomState(Math.random());
    }, [eventId]);

    return (
        <>
            <div>
                <b>Registration Page | {randomState}</b>
            </div>
            <Outlet context={{ auth: auth } as RegistrationProviderContext} />
        </>);
}