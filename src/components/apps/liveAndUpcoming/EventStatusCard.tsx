import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { EventInfo } from "types/EventTypes";
import { DataTypeHelpers } from "utils/DataTypeHelpers";
import { getRegistrationPath } from "utils/RegistrationLinks";

/**
 * Where an event stands for a visitor, which sets its badge and buttons (D18).
 */
export type EventStatus = "live" | "registrationOpen" | "upcoming" | "finished";

interface Props {
    type: string;
    urlSlug: string;
    event: EventInfo;
    status: EventStatus;
    today: Date;
}

interface CardAction {
    label: string;
    icon: string;
    href: string;
}

/** Registration closing within this many days shows its closing day instead of "Registration open". */
const CLOSING_SOON_DAYS = 7;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Gets the badge for an event in the given status.
 */
function getBadge(status: EventStatus, event: EventInfo, today: Date): { label: string; className: string; icon: string } {
    switch (status) {
        case "live":
            return { label: "Live now", className: "bq-status--live", icon: "faTowerBroadcast" };
        case "finished":
            return { label: "Results posted", className: "bq-status--finished", icon: "faFlagCheckered" };
        case "upcoming":
            return { label: "Upcoming", className: "bq-status--upcoming", icon: "faCalendarDays" };
        case "registrationOpen": {
            const closes = DataTypeHelpers.parseDateOnly(event.registrationEndDate);
            if (closes) {
                const days = Math.round((closes.getTime() - today.getTime()) / MS_PER_DAY);
                if (days === 0) {
                    return { label: "Registration closes today", className: "bq-status--closing", icon: "faHourglassHalf" };
                }
                else if (days > 0 && days <= CLOSING_SOON_DAYS) {
                    const day = closes.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
                    return { label: `Registration closes ${day}`, className: "bq-status--closing", icon: "faHourglassHalf" };
                }
            }

            return { label: "Registration open", className: "bq-status--open", icon: "faPenToSquare" };
        }
    }
}

/**
 * Card for one event in the Event List: a status badge and labeled buttons for what the visitor can do, the most
 * important one filled (D18).
 */
export default function EventStatusCard({ type, urlSlug, event, status, today }: Props) {

    const eventPage = `/${type}/seasons/${event.season}/${urlSlug}`;
    const badge = getBadge(status, event, today);

    // The first action is the main one and is drawn filled.
    const actions: CardAction[] = [];
    switch (status) {
        case "live":
        case "finished":
            actions.push({ label: "View scores", icon: "faTrophy", href: eventPage });
            break;
        case "registrationOpen":
            actions.push({ label: "Register", icon: "faPenToSquare", href: getRegistrationPath(event.id) });
            actions.push({ label: "Event details", icon: "faCircleInfo", href: eventPage });
            break;
        case "upcoming":
            actions.push({ label: "Event details", icon: "faCircleInfo", href: eventPage });
            break;
    }

    let location: string | null = null;
    if (event.locationName && event.locationCity) {
        location = `${event.locationName}, ${event.locationCity}`;
    }
    else {
        location = event.locationName || event.locationCity;
    }

    return (
        <article className="bq-event">
            <div className="bq-event-top">
                <span className={`bq-status ${badge.className}`}>
                    <FontAwesomeIcon icon={`fas ${badge.icon}`} />
                    {badge.label}
                </span>
                <img
                    src={`/assets/logos/${type}/${type}-logo.png`}
                    alt={type.toUpperCase()}
                    className="bq-event-logo"
                />
            </div>
            <div className="bq-event-body">
                {event.scopeLabel && <p className="bq-event-scope">{event.scopeLabel}</p>}
                <h3 className="bq-event-name">{event.name}</h3>
                {event.dates && (
                    <p className="bq-event-meta">
                        <FontAwesomeIcon icon="far faCalendar" />
                        <span>{event.dates}</span>
                    </p>)}
                {location && (
                    <p className="bq-event-meta">
                        <FontAwesomeIcon icon="fas faLocationDot" />
                        <span>{location}</span>
                    </p>)}
            </div>
            <div className="bq-event-actions">
                {actions.map((action, index) => (
                    <a
                        key={action.label}
                        href={action.href}
                        className={`btn btn-sm ${index === 0 ? "btn-primary" : "btn-outline"}`}>
                        <FontAwesomeIcon icon={`fas ${action.icon}`} />
                        {action.label}
                    </a>))}
            </div>
        </article>);
}
