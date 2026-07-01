import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useCallback, useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { AuthManager } from "types/AuthManager";
import { Church, ChurchesService, ChurchResultFilter } from "types/services/ChurchesService";
import { EventInfo, EventRegistrationStatus, EventsService, type EventRestrictions } from "types/services/EventsService";
import { Registration, RegistrationService } from "types/services/RegistrationService";
import { sharedDirtyWindowState } from "utils/SharedState";

interface Props {
}

/**
 * Per-section editability flags derived from event restrictions.
 */
export interface SectionEditability {
    teams: boolean;
    officials: boolean;
    attendees: boolean;
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

    /** Whether the current user is the event owner (server-computed). */
    isEventOwner: boolean;

    /** Currently-selected church, or null if none has been picked yet. */
    church: Church | null;

    /** Setter to change the currently-selected church (also updates URL). */
    setChurch: (church: Church | null) => void;

    /** List of churches the user administers (for quick-select). */
    userChurches: Church[];

    /** Add a church to the user's local list (after authorization). */
    addUserChurch: (church: Church) => void;

    /** Whether the user's churches are still loading. */
    isLoadingUserChurches: boolean;

    /** Existing registration for the selected church, or null if not yet registered. */
    registration: Registration | null;

    /** Setter to update the current registration (after a save). */
    setRegistration: (registration: Registration | null) => void;

    /** Current registration version for optimistic locking. */
    registrationVersion: number;

    /** Update the version after a team CUD operation. */
    setRegistrationVersion: (version: number) => void;

    /**
     * Forces the church + registration to be reloaded from the server.
     * Useful after saving a sub-entity (team, person, etc.) so the totals refresh.
     */
    reloadRegistration: () => Promise<void>;

    /** Whether registration is editable (not closed / not in past). */
    isEditable: boolean;

    /** Per-section editability flags. */
    sectionEditability: SectionEditability;

    /** Error message when loading the church's registration (e.g. permission denied). */
    churchPermissionError: string | null;

    /** Whether there are unsaved changes to people (officials/quizzers/attendees). */
    isDirty: boolean;

    /** Mark the registration as having unsaved people changes. */
    setDirty: (dirty: boolean) => void;

    /** Whether a save operation is in progress. */
    isSaving: boolean;

    /** Trigger a batch save for people (officials/individuals/attendees). */
    saveRegistration: () => Promise<void>;
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

    const [userChurches, setUserChurches] = useState<Church[]>([]);
    const [isLoadingUserChurches, setIsLoadingUserChurches] = useState<boolean>(true);

    const [registration, setRegistration] = useState<Registration | null>(null);
    const [registrationVersion, setRegistrationVersion] = useState<number>(0);
    const [isLoadingRegistration, setIsLoadingRegistration] = useState<boolean>(false);
    const [churchPermissionError, setChurchPermissionError] = useState<string | null>(null);

    const [isDirty, setDirtyState] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const setDirty = useCallback((dirty: boolean) => {
        setDirtyState(dirty);
        sharedDirtyWindowState.set(dirty);
    }, []);

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

    // Load the user's churches for quick-select.
    useEffect(() => {
        setIsLoadingUserChurches(true);
        ChurchesService.getChurches(
            auth,
            100,
            0,
            null,
            null,
            null,
            ChurchResultFilter.IncludeDirectAuthorized)
            .then(page => {
                setUserChurches(page.Items ?? []);
                setIsLoadingUserChurches(false);
            })
            .catch(() => {
                setIsLoadingUserChurches(false);
            });
    }, [auth]);

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
        setChurchPermissionError(null);

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
            setChurchPermissionError(null);
            return;
        }

        setIsLoadingRegistration(true);
        setChurchPermissionError(null);

        try {
            const loadedRegistration = await RegistrationService
                .getRegistrationByChurchId(auth, eventId, church.Id);

            setRegistration(loadedRegistration);
            setRegistrationVersion(loadedRegistration?.Version ?? 0);
        }
        catch (error: any) {
            if (error?.statusCode === 404) {
                setRegistration(null);
                setChurchPermissionError(
                    "You do not have permission to register for this church. " +
                    "Please select a different church or contact the event coordinator.");
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

    // Batch save for people (officials/individuals/attendees).
    const saveRegistration = async (): Promise<void> => {
        if (!registration || !eventId || !church?.Id) {
            return;
        }

        setIsSaving(true);
        try {
            registration.Attendees ??= [];

            const updatedRegistration = await RegistrationService.createOrUpdateChurch(auth, registration);

            // Preserve teams since they aren't included in this endpoint.
            (updatedRegistration as any).Teams = registration.Teams;

            setRegistration(updatedRegistration);
            setRegistrationVersion(updatedRegistration.Version);
            setDirty(false);
        }
        finally {
            setIsSaving(false);
        }
    };

    // Compute editability from event state.
    const computeEditability = (): { isEditable: boolean; sectionEditability: SectionEditability } => {
        if (!event) {
            return { isEditable: false, sectionEditability: { teams: false, officials: false, attendees: false } };
        }

        // Event owners bypass all restrictions.
        if (event.IsOwner) {
            return { isEditable: true, sectionEditability: { teams: true, officials: true, attendees: true } };
        }

        const status = event.RegistrationStatus;
        if (status === EventRegistrationStatus.AlreadyClosed) {
            return { isEditable: false, sectionEditability: { teams: false, officials: false, attendees: false } };
        }

        const restrictions: EventRestrictions | null = event.RegistrationRestrictions ?? null;
        return {
            isEditable: true,
            sectionEditability: {
                teams: restrictions?.CanTeamsChange !== false,
                officials: restrictions?.CanOfficialsChange !== false,
                attendees: restrictions?.CanAttendeesChange !== false,
            }
        };
    };

    const { isEditable, sectionEditability } = computeEditability();

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
        isEventOwner: event.IsOwner,
        church,
        setChurch,
        userChurches,
        addUserChurch: (newChurch: Church) => {
            setUserChurches(prev => prev.some(c => c.Id === newChurch.Id) ? prev : [...prev, newChurch]);
        },
        isLoadingUserChurches,
        registration,
        setRegistration,
        registrationVersion,
        setRegistrationVersion,
        reloadRegistration,
        isEditable,
        sectionEditability,
        churchPermissionError,
        isDirty,
        setDirty,
        isSaving,
        saveRegistration,
    };

    return <Outlet context={context} />;
}