import EventScopeBadge from "components/EventScopeBadge";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { EventInfo } from "types/EventTypes";

interface Props {
    info: EventWrapper;
    isLive: boolean;
    showLiveBadge?: boolean;
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
    urlFormatter }: Props) {

    const cardLink = urlFormatter ? urlFormatter(info.event) : (
        (isLive || info.isNationals || !info.isRegistrationOpen)
            ? `/${info.type}/seasons/${info.event.season}/${info.urlSlug}`
            : `https://registration.biblequiz.com/#/Registration/${info.event.id}`);

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
        <a
            className="card live-events-card w-90 card-sm shadow-sm border-2 border-solid mt-0 relative"
            href={cardLink}
            target={cardLink.startsWith("http") ? "_blank" : "_self"}>
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
                            <EventScopeBadge scope={info.event.scope} label={info.event.scopeLabel ?? ""} />
                            {info.isRegistrationOpen && (
                                <span className="badge badge-neutral">Registration</span>
                            )}
                            <h2 className="card-title mb-0 mt-1">
                                {info.event.name}
                            </h2>
                            <p className="mt-0">{info.event.dates}</p>
                            {locationLabel && <p className="text-gray-500 italic m-0">{locationLabel}</p>}
                        </div>
                    </div>)}
                {!info && (
                    <div className="mt-3">
                        <h2 className="card-title">
                            More Live & Upcoming Events
                        </h2>
                        <p className="text-base mt-1">
                            Search through the full list of live and upcoming events across Junior and Teen Bible Quiz.
                        </p>
                    </div>)}
                <FontAwesomeIcon
                    icon="fas faArrowRight"
                    classNames={["icon text-lg rtl:flip absolute top-4 right-4"]}
                />
            </div>
        </a>);
}