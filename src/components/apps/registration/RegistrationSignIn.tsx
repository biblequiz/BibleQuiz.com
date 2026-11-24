import { useLocation } from "react-router-dom";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import AuthButton, { AuthButtonType } from "components/auth/AuthButton";

/**
 * Public details of an event, embedded in the register page at build time.
 */
export interface PublicEventSummary {
    name: string;
    type: string;
    dates: string | null;
    location: string | null;
}

/** Id of the JSON element the register page writes the public event details into. */
export const PUBLIC_EVENTS_ELEMENT_ID = "bq-register-events";

function getPublicEvent(eventId: string): PublicEventSummary | null {
    try {
        const element = document.getElementById(PUBLIC_EVENTS_ELEMENT_ID);
        const events = element?.textContent ? JSON.parse(element.textContent) as Record<string, PublicEventSummary> : {};
        return events[eventId] ?? null;
    }
    catch {
        return null;
    }
}

/**
 * Shown instead of a bare sign-in prompt when someone opens Register while signed out (R2): the event they chose,
 * then "Sign in to register". Cost isn't shown, because the registration API answers only signed-in requests.
 */
export default function RegistrationSignIn() {
    const location = useLocation();
    const eventId = location.pathname.split("/").filter(Boolean)[0] ?? "";
    const event = eventId ? getPublicEvent(eventId) : null;

    return (
        <div className="bq-reg-signin">
            {event && (
                <div className="bq-event bq-reg-signin-event">
                    <div className="bq-event-top">
                        <h2 className="bq-event-name">{event.name}</h2>
                        <img
                            src={`/assets/logos/${event.type}/${event.type}-logo.png`}
                            alt={event.type.toUpperCase()}
                            className="bq-event-logo"
                        />
                    </div>
                    {event.dates && (
                        <p className="bq-event-meta">
                            <FontAwesomeIcon icon="far faCalendar" />
                            <span>{event.dates}</span>
                        </p>)}
                    {event.location && (
                        <p className="bq-event-meta">
                            <FontAwesomeIcon icon="fas faLocationDot" />
                            <span>{event.location}</span>
                        </p>)}
                </div>)}
            <div className="bq-reg-signin-body">
                <h2>
                    <FontAwesomeIcon icon="fas faLock" />
                    Sign in to register
                </h2>
                <p>
                    Registering needs a free BibleQuiz.com account. If you've signed in on registration.biblequiz.com
                    before, it's the same account.
                </p>
                <AuthButton type={AuthButtonType.ProtectedRoute} />
            </div>
        </div>);
}
