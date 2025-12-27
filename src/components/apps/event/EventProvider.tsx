import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { AuthManager } from "types/AuthManager";
import { AstroEventsService } from "types/services/AstroEventsService";
import type { DatabaseSettings } from "types/services/DatabasesService";
import { EventInfo } from "types/services/EventsService";

interface Props {
}

export interface EventProviderContext {
    auth: AuthManager;
    eventId: string;
    eventResultsUrl: string | null;
    info: EventInfo | null;
    rootUrl: string;
    clonePermissionsFromEventId?: string;
    databases: DatabaseSettings[];
    registrations: EventRegistrationSummary;
    payments: EventPaymentSummary | null;

    setEventTitle: (title: string) => void;
    setEventType: (typeId: string) => void;
    setEventIsHidden: (isHidden: boolean) => void;
    setLatestEvent: (event: EventInfo | null) => void;
    setClonePermissionsFromEventId: (eventId: string | undefined) => void;
}

/**
 * Summary of the event's registrations.
 */
export class EventRegistrationSummary {

    /**
     * Initializes a new instance of the EventRegistrationSummary class.
     * 
     * @param churches Number of churches that have registered.
     * @param teams Number of teams that have registered.
     * @param coaches Number of coaches that have registered.
     * @param quizzers Number of quizzers that have registered.
     * @param officials Number of officials that have registered.
     * @param attendees Number of attendees that have registered.
     */
    constructor(
        churches: number,
        teams: number,
        coaches: number,
        quizzers: number,
        officials: number,
        attendees: number) {

        this.Churches = churches;
        this.Teams = teams;
        this.Coaches = coaches;
        this.Quizzers = quizzers;
        this.Officials = officials;
        this.Attendees = attendees;
    }

    /**
     * Number of churches that have registered.
     */
    public readonly Churches: number;

    /**
     * Number of teams that have registered.
     */
    public readonly Teams: number;

    /**
     * Number of coaches that have registered.
     */
    public readonly Coaches: number;

    /**
     * Number of quizzers that have registered.
     */
    public readonly Quizzers: number;

    /**
     * Number of officials that have registered.
     */
    public readonly Officials: number;

    /**
     * Number of attendees that have registered.
     */
    public readonly Attendees: number;
}

/**
 * Summary of the event's payments.
 */
export class EventPaymentSummary {

    /**
     * Initializes a new instance of the EventPaymentSummary class.
     * 
     * @param amountDue Total amount due for the event.
     * @param amountPaid Total amount paid for the event.
     * @param amountPending Total amount pending for the event as part of credit card processing.
     * @param payoutDue Total amount due for payout.
     * @param payoutPaid Total amount paid to the payee.
     */
    constructor(
        amountDue: number,
        amountPaid: number,
        amountPending: number,
        payoutDue: number,
        payoutPaid: number) {

        this.AmountDue = amountDue;
        this.AmountPaid = amountPaid;
        this.AmountPending = amountPending;
        this.PayoutDue = payoutDue;
        this.PayoutPaid = payoutPaid;
    }

    /**
     * Total amount due for the event.
     */
    public readonly AmountDue: number;

    /**
     * Total amount paid for the event.
     */
    public readonly AmountPaid: number;

    /**
     * Total amount pending for the event as part of credit card processing.
     */
    public readonly AmountPending: number;

    /**
     * Total amount due for payout.
     */
    public readonly PayoutDue: number;

    /**
     * Total amount paid to the payee.
     */
    public readonly PayoutPaid: number;
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
    const [currentEventResultsUrl, setCurrentEventResultsUrl] = useState<string | null>(null);
    const [currentEvent, setCurrentEvent] = useState<EventInfo | null>(null);
    const [databases, setDatabases] = useState<DatabaseSettings[]>([]);
    const [registrations, setRegistrations] = useState<EventRegistrationSummary>(() => new EventRegistrationSummary(0, 0, 0, 0, 0, 0));
    const [payments, setPayments] = useState<EventPaymentSummary | null>(null);
    const [eventTitle, setEventTitle] = useState<string>("Untitled Event");
    const [eventTypeId, setEventTypeId] = useState<string>("agjbq");
    const [eventIsHidden, setEventIsHidden] = useState<boolean>(false);
    const [clonePermissionsFromEventId, setClonePermissionsFromEventId] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (eventId && eventId != NEW_ID_PLACEHOLDER) {
            setIsLoading(true);

            AstroEventsService
                .getEventWithSummary(auth, eventId)
                .then(summary => {
                    setCurrentEvent(summary.Event);
                    setCurrentEventResultsUrl(summary.FullUrl);
                    setDatabases(summary.Databases);
                    setRegistrations(new EventRegistrationSummary(
                        summary.RegisteredChurches,
                        summary.RegisteredTeams,
                        summary.RegisteredCoaches,
                        summary.RegisteredQuizzers,
                        summary.RegisteredOfficials,
                        summary.RegisteredAttendees));

                    if (summary.Event.CalculatePayment) {
                        setPayments(new EventPaymentSummary(
                            summary.AmountDue,
                            summary.AmountPaid,
                            summary.AmountPending,
                            summary.PayoutDue,
                            summary.PayoutPaid));
                    }
                    else {
                        setPayments(null);
                    }

                    setIsLoading(false);
                    setLoadingError(null);
                    setEventTitle(summary.Event.Name);
                    setEventTypeId(summary.Event.TypeId);
                    setClonePermissionsFromEventId(undefined);
                    setEventIsHidden(summary.Event.IsHidden && summary.Event.IsHiddenFromLiveEvents);
                })
                .catch(error => {
                    setIsLoading(false);
                    setClonePermissionsFromEventId(undefined);
                    if (error.statusCode === 404) {
                        setLoadingError("Cannot find the specified event.");
                    }
                    else {
                        setLoadingError(error.message || "An error occured while retrieving this event.");
                    }
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
                {eventIsHidden && <span className="badge badge-error mr-1 text-nowrap">HIDDEN</span>}
            </h1>
            <Outlet context={{
                auth: auth,
                eventId: eventId,
                clonePermissionsFromEventId: clonePermissionsFromEventId,
                eventResultsUrl: currentEventResultsUrl,
                info: currentEvent,
                databases: databases,
                registrations: registrations,
                payments: payments,
                rootUrl: eventId ? `/${eventId}` : `/${NEW_ID_PLACEHOLDER}`,
                setEventTitle: newTitle => setEventTitle(
                    newTitle.trim().length > 0
                        ? newTitle.trim()
                        : "Untitled Event"),
                setEventType: setEventTypeId,
                setEventIsHidden: setEventIsHidden,
                setLatestEvent: setCurrentEvent,
                setClonePermissionsFromEventId: setClonePermissionsFromEventId
            } as EventProviderContext} />
        </>);
}