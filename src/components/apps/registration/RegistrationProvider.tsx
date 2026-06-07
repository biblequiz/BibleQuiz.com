import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { AuthManager } from "types/AuthManager";
import { Church, ChurchesService } from "types/services/ChurchesService";
import { EventInfo, EventsService } from "types/services/EventsService";
import { Registration, RegistrationService } from "types/services/RegistrationService";

interface Props {
}

/**
 * Context exposed by the RegistrationProvider through `useOutletContext`.
 */
export interface RegistrationProviderContext {
    /** Authentication manager. */
    auth: AuthManager;

    /** Id of the event the user is registering for. */
    eventId: string;

    /** Loaded event metadata. */
    event: EventInfo;

    /** Currently-selected church, or null if none has been picked yet. */
    church: Church | null;

    /** Setter to change the currently-selected church (also updates URL). */
    setChurch: (church: Church | null) => void;

    /** Existing registration for the selected church, or null if not yet registered. */
    registration: Registration | null;

    /** Setter to update the current registration (after a save). */
    setRegistration: (registration: Registration | null) => void;

    /**
     * Forces the church + registration to be reloaded from the server.
     * Useful after saving a sub-entity (team, person, etc.) so the totals refresh.
     */
    reloadRegistration: () => Promise<void>;
}

export default function RegistrationProvider({ }: Props) {

    const auth = AuthManager.useNanoStore();
    const urlParameters = useParams();
    const eventId = urlParameters.eventId || null;
    const churchIdFromUrl = urlParameters.churchId || null;

    const [isLoadingEvent, setIsLoadingEvent] = useState<boolean>(true);
    const [loadingError, setLoadingError] = useState<string | null>(null);
    const [event, setEvent] = useState<EventInfo | null>(null);

    const [church, setChurchState] = useState<Church | null>(null);
    const [isLoadingChurch, setIsLoadingChurch] = useState<boolean>(churchIdFromUrl !== null);

    const [registration, setRegistration] = useState<Registration | null>(null);
    const [isLoadingRegistration, setIsLoadingRegistration] = useState<boolean>(false);

    // Load the event.
    useEffect(() => {
        if (!eventId) {
            setIsLoadingEvent(false);
            setLoadingError("No event identifier was provided in the URL.");
            return;
        }

        setIsLoadingEvent(true);
        EventsService.getEvent(auth, eventId)
            .then(loadedEvent => {
                setEvent(loadedEvent);
                setIsLoadingEvent(false);
                setLoadingError(null);
            })
            .catch(error => {
                setIsLoadingEvent(false);
                if (error?.statusCode === 404) {
                    setLoadingError("The event could not be found.");
                }
                else {
                    setLoadingError(error?.message || "An error occurred while loading the event.");
                }
            });
    }, [eventId, auth]);

    // Load the church from the URL parameter (if any).
    useEffect(() => {
        if (!churchIdFromUrl) {
            setChurchState(null);
            setIsLoadingChurch(false);
            return;
        }

        // Avoid reloading if we already have this church.
        if (church && church.Id === churchIdFromUrl) {
            return;
        }

        setIsLoadingChurch(true);
        ChurchesService.getChurch(auth, churchIdFromUrl)
            .then(loadedChurch => {
                setChurchState(loadedChurch);
                setIsLoadingChurch(false);
            })
            .catch(error => {
                setIsLoadingChurch(false);
                setLoadingError(error?.message || "An error occurred while loading the church.");
            });
    }, [churchIdFromUrl, auth]);

    // Setter that also updates the URL so the church is sticky.
    const setChurch = (newChurch: Church | null): void => {
        setChurchState(newChurch);

        if (!eventId) {
            return;
        }

        const newHash = newChurch?.Id
            ? `#/${eventId}/${newChurch.Id}`
            : `#/${eventId}`;

        if (window.location.hash !== newHash) {
            window.location.hash = newHash;
        }
    };

    // Load the registration whenever the church changes.
    const reloadRegistration = async (): Promise<void> => {
        if (!eventId || !church?.Id) {
            setRegistration(null);
            return;
        }

        setIsLoadingRegistration(true);

        try {
            const loadedRegistration = await RegistrationService
                .getRegistrationByChurchId(auth, eventId, church.Id);

            setRegistration(loadedRegistration);
        }
        catch (error: any) {
            if (error?.statusCode === 404) {
                setRegistration(null);
            }
            else {
                setLoadingError(error?.message || "An error occurred while loading the registration.");
            }
        }
        finally {
            setIsLoadingRegistration(false);
        }
    };

    useEffect(() => {
        reloadRegistration();
    }, [eventId, church?.Id]);

    const isLoading = isLoadingEvent || isLoadingChurch || isLoadingRegistration;

    if (isLoading) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <span className="loading loading-spinner loading-lg"></span>
                            <span className="ml-4">
                                {isLoadingEvent
                                    ? "Loading Event ..."
                                    : isLoadingChurch
                                        ? "Loading Church ..."
                                        : "Loading Registration ..."}
                            </span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            This should just take a second or two ...
                        </p>
                    </div>
                </div>
            </div>);
    }

    if (loadingError) {
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

    if (!event) {
        return null;
    }

    const context: RegistrationProviderContext = {
        auth,
        eventId: eventId!,
        event,
        church,
        setChurch,
        registration,
        setRegistration,
        reloadRegistration,
    };

    return <Outlet context={context} />;
}