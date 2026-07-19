import EventScopeBadge from "components/EventScopeBadge";
import type { EventInfo } from "types/EventTypes";

interface Props {
    info: EventWrapper;
    isLive: boolean;
    showLiveBadge?: boolean;
    showHiddenBadge?: boolean;
    urlFormatter?: (event: EventInfo) => string;
}

interface EventWrapper {
    type: string;
    urlSlug: string;
    event: EventInfo;
    isNationals: boolean;
    isRegistrationOpen: boolean;
}

export default function EventCard({
    info,
    isLive,
    showLiveBadge = false,
    showHiddenBadge = false,
    urlFormatter }: Props) {

    const publicEventLink =
        `/${info.type}/seasons/${info.event.season}/${info.urlSlug}`;
    const primaryLink = urlFormatter
        ? urlFormatter(info.event)
        : publicEventLink;
    const primaryLabel = urlFormatter
        ? info.event.isReport
            ? "Manage Report"
            : "Manage Event"
        : isLive
            ? "View Live Scores"
            : "View Event";
    const registrationLink = `/register/#/${info.event.id}`;

    let locationLabel: string | null = null;
    if (info && info.event) {
        if (info.event.locationName || info.event.locationCity) {
            if (info.event.locationName && info.event.locationCity) {
                locationLabel = `${info.event.locationName}, ${info.event.locationCity}`;
            }
            else if (info.event.locationName) {
                locationLabel = info.event.locationName;
            }
            else {
                locationLabel = info.event.locationCity;
            }
        }
    }

    return (
        <article
            className="card live-events-card w-90 card-sm shadow-sm border-2 border-solid mt-0 relative">
            <div className="card-body p-2 pl-4">
                {info && (
                    <div className="flex items-start gap-4">
                        <img
                            src={`/assets/logos/${info.type}/${info.type}-logo.png`}
                            alt={`${info.type.toUpperCase()} Logo`}
                            className="w-20 h-20 flex-shrink-0 mt-2"
                        />
                        <div className="flex-1 pr-6 mt-2">
                            {isLive && showLiveBadge && (
                                <span className="badge badge-info mr-1">LIVE</span>
                            )}
                            {showHiddenBadge && (
                                <span className="badge badge-error mr-1">HIDDEN</span>
                            )}
                            <EventScopeBadge scope={info.event.scope} label={info.event.scopeLabel ?? ""} />
                            {info.isRegistrationOpen && (
                                <span className="badge badge-warning">Registration Open</span>
                            )}
                            <h2 className="card-title mb-0 mt-1">
                                {info.event.name}
                            </h2>
                            <p className="mt-0">{info.event.dates}</p>
                            {locationLabel && <p className="text-gray-500 italic m-0">{locationLabel}</p>}
                        </div>
                    </div>)}
                <div className="card-actions mt-3 justify-end">
                    <a className="btn btn-outline btn-sm" href={primaryLink}>
                        {primaryLabel}
                    </a>
                    {!urlFormatter && info.isRegistrationOpen && (
                        <a className="btn btn-primary btn-sm" href={registrationLink}>
                            Register
                        </a>
                    )}
                </div>
            </div>
        </article>);
}