import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useEffect, useState } from "react";
import { Outlet, useOutletContext } from "react-router-dom";
import { EventsService, EventSummary } from "types/services/EventsService";
import type { EventProviderContext } from "./EventProvider";

interface Props {
}

export interface EventSummaryProviderContext {
    context: EventProviderContext;
    summary: EventSummary;
}

export default function EventSummaryProvider({ }: Props) {
    const context = useOutletContext<EventProviderContext>();

    const [isLoading, setIsLoading] = useState(false);
    const [loadingError, setLoadingError] = useState<string | null>(null);
    const [eventSummary, setEventSummary] = useState<EventSummary | null>(null);

    useEffect(() => {
        if (!isLoading && !eventSummary) {
            setIsLoading(true);

            EventsService.getEventSummary(
                context.auth,
                context.eventId)
                .then(summary => {
                    setEventSummary(summary);
                    setIsLoading(false);
                    setLoadingError(null);
                })
                .catch(error => {
                    setIsLoading(false);
                    if (error.statusCode === 404) {
                        setLoadingError("Cannot find the specified event.");
                    }
                    else {
                        setLoadingError(error.message || "An error occured while retrieving this event.");
                    }
                });
        }
    }, [context]);

    if (isLoading) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <span className="loading loading-spinner loading-lg"></span>
                            <span className="ml-4">Loading Event Summary ...</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            The event summary is being downloaded and prepared. This should just take a second or two ...
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
            context: context,
            summary: eventSummary!
        } as EventSummaryProviderContext} />);
}