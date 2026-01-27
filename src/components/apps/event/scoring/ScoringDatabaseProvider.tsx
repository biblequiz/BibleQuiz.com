import { Outlet, useOutletContext, useParams } from "react-router-dom";
import { AuthManager } from "types/AuthManager";
import type { EventProviderContext } from "../EventProvider";

interface Props {
}

export interface ScoringDatabaseProviderContext {
    auth: AuthManager;
    rootUrl: string;
    eventId: string;
    databaseId: string | null;
}

export default function ScoringDatabaseProvider({ }: Props) {

    const context = useOutletContext<EventProviderContext>();
    const auth = context.auth;

    const urlParameters = useParams();
    const eventId = context.eventId;
    const databaseId = urlParameters.databaseId || null;
    const rootUrl = `${context.rootUrl}/scoring/databases/${databaseId || ""}`;

    return (
        <Outlet context={{
            auth: auth,
            rootUrl: rootUrl,
            eventId: eventId,
            databaseId: databaseId,
        } as ScoringDatabaseProviderContext} />);
}