import { useEffect, useState } from "react";
import { Outlet, useOutletContext, useParams } from "react-router-dom";
import { AuthManager } from "types/AuthManager";
import type { EventProviderContext } from "./EventProvider";

interface Props {
}

export interface ScoringDatabaseProviderContext {
    auth: AuthManager;
    rootUrl: string;
    databaseId: string | null;
    breadcrumbRef: React.RefObject<HTMLLIElement>;
}

export default function ScoringDatabaseProvider({ }: Props) {

    const [randomState, setRandomState] = useState(() => Math.random());;

    const context = useOutletContext<EventProviderContext>();
    const auth = context.auth;

    const urlParameters = useParams();
    const databaseId = urlParameters.databaseId || null;
    const rootUrl = `${context.rootUrl}/scoring/databases/${databaseId || ""}`;

    useEffect(() => {
        setRandomState(Math.random());
    }, [databaseId]);

    return (
        <>
            <div>
                <b>Scoring Database Page | {randomState}</b>
            </div>
            <Outlet context={{
                auth: auth,
                rootUrl: rootUrl,
                databaseId: databaseId,
            } as ScoringDatabaseProviderContext} />
        </>);
}