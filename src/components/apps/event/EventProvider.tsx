import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useEffect, useState } from "react";
import { Outlet, useLocation, useParams } from "react-router-dom";
import { AuthManager } from "types/AuthManager";
import { EventInfo, EventsService } from "types/services/EventsService";

interface Props {
}

export interface EventProviderContext {
    auth: AuthManager;
    eventId: string;
    info: EventInfo | null;
    rootUrl: string;

    setEventTitle: (title: string) => void;
    setEventType: (typeId: string) => void;
}

export const NEW_ID_PLACEHOLDER = "new";

export default function EventProvider({ }: Props) {
    const auth = AuthManager.useNanoStore();
    const urlParameters = useParams();
    const eventId = urlParameters.eventId === NEW_ID_PLACEHOLDER
        ? null
        : (urlParameters.eventId || null);

    const [isLoading, setIsLoading] = useState(eventId !== null);
    const [loadingError, setLoadingError] = useState<string | null>(null);
    const [currentEvent, setCurrentEvent] = useState<EventInfo | null>(null);
    const [eventTitle, setEventTitle] = useState<string>("Untitled Event");
    const [eventTypeId, setEventTypeId] = useState<string>("agjbq");

    useEffect(() => {
        if (eventId && eventId != NEW_ID_PLACEHOLDER) {
            setIsLoading(true);

            EventsService
                .getEvent(auth, eventId)
                .then(info => {
                    setCurrentEvent(info);
                    setIsLoading(false);
                    setLoadingError(null);
                    setEventTitle(info.Name);
                    setEventTypeId(info.TypeId);
                })
                .catch(error => {
                    setLoadingError(error.message || "An error occured while retrieving this event.");
                });
        }
    }, [eventId, auth]);

    if (isLoading) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <span className="loading loading-spinner loading-lg"></span>
                            <span className="ml-4">Loading Event ...</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            The event information is being downloaded and prepared. This should just take a second or two ...
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

    const eventType = eventTypeId.substring(2) || "jbq";

    return (
        <>
            <h1 className="page-title mt-0">
                {eventType && (
                    <img
                        src={`/assets/logos/${eventType}/${eventType}-logo.png`}
                        alt={eventType}
                        width="72"
                        height="72"
                        className="event-icon"
                    />
                )}
                <span className="event-title-text">{eventTitle}</span>
            </h1>
            <Outlet context={{
                auth: auth,
                eventId: eventId,
                info: currentEvent,
                rootUrl: eventId ? `/${eventId}` : `/${NEW_ID_PLACEHOLDER}`,
                setEventTitle: newTitle => setEventTitle(
                    newTitle.trim().length > 0
                        ? newTitle.trim()
                        : "Untitled Event"),
                setEventType: setEventTypeId,
            } as EventProviderContext} />
        </>);
}