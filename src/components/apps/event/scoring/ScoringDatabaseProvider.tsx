import { Outlet, useOutletContext, useParams } from "react-router-dom";
import { AuthManager } from "types/AuthManager";
import type { EventProviderContext } from "../EventProvider";
import { useEffect, useState } from "react";
import { AstroDatabasesService, type OnlineDatabaseSummary } from "types/services/AstroDatabasesService";
import FontAwesomeIcon from "components/FontAwesomeIcon";

interface Props {
}

export interface ScoringDatabaseProviderContext {
    auth: AuthManager;
    rootEventUrl: string;
    rootUrl: string;
    eventId: string;
    databaseId: string | null;

    currentDatabase: OnlineDatabaseSummary | null;
    setCurrentDatabase: (database: OnlineDatabaseSummary | null) => void;
}

export default function ScoringDatabaseProvider({ }: Props) {

    const urlParameters = useParams();

    const context = useOutletContext<EventProviderContext>();
    const auth = context.auth;
    const eventId = context.eventId;
    const databaseId = urlParameters.databaseId || null;
    const rootUrl = `${context.rootUrl}/scoring/databases/${databaseId || ""}`;

    const [isLoading, setIsLoading] = useState(false);
    const [loadingError, setLoadingError] = useState<string | null>(null);

    const [currentEventId, setCurrentEventId] = useState<string | null>(null);
    const [currentDatabase, setCurrentDatabase] = useState<OnlineDatabaseSummary | null>(null);

    useEffect(() => {
        if (!isLoading && (!currentDatabase || currentEventId !== eventId ||
            currentDatabase.Settings.DatabaseId !== databaseId)) {
            setIsLoading(true);
            setLoadingError(null);

            AstroDatabasesService.getDatabase(
                context.auth,
                context.eventId,
                databaseId!)
                .then(summary => {
                    setCurrentEventId(eventId);
                    setCurrentDatabase(summary);

                    setIsLoading(false);
                    setLoadingError(null);
                })
                .catch(error => {
                    setIsLoading(false);
                    if (error.statusCode === 404) {
                        setLoadingError("Cannot find the specified event or database.");
                    }
                    else {
                        setLoadingError(error.message || "An error occured while retrieving this event.");
                    }
                });
        }
    }, [context]);

    if (isLoading || (!loadingError && !currentDatabase)) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <span className="loading loading-spinner loading-lg"></span>
                            <span className="ml-4">Loading Database Summary ...</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            The database summary is being downloaded and prepared. This should just take a second or two ...
                        </p>
                    </div>
                </div>
            </div>);
    }
    else if (loadingError) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <FontAwesomeIcon icon="fas faTriangleExclamation" />
                            <span className="ml-4">Error</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            {loadingError}
                        </p>
                    </div>
                </div>
            </div>);
    }

    return (
        <Outlet context={{
            auth: auth,
            rootEventUrl: context.rootUrl,
            rootUrl: rootUrl,
            eventId: eventId,
            databaseId: databaseId,

            currentDatabase: currentDatabase,
            setCurrentDatabase: setCurrentDatabase
        } as ScoringDatabaseProviderContext} />);
}