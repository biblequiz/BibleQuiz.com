import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { EventInfo } from "types/EventTypes";

interface Props {
    info?: EventWrapper;
    isLive: boolean;
}

interface EventWrapper {
    type: string;
    urlSlug: string;
    event: EventInfo;
    isNationals: boolean;
    isRegistrationOpen: boolean;
}

export default function EventCard({ info, isLive }: Props) {

    const cardLink = info
        ? ((isLive || info.isNationals || !info.isRegistrationOpen)
            ? `/${info.type}/seasons/${info.event.season}/${info.urlSlug}`
            : `https://registration.biblequiz.com/#/Registration/${info.event.id}`)
        : "/upcoming-events/";

    return (
        <a
            className="card live-events-card w-96 card-sm shadow-sm border-2 border-solid mt-0 relative"
            href={cardLink}
            target={cardLink.startsWith("http") ? "_blank" : "_self"}>
            <div className="card-body">
                {info && (
                    <div className="flex items-start gap-4">
                        <img
                            src={`/assets/logos/${info.type}/${info.type}-logo.png`}
                            alt={`${info.type.toUpperCase()} Logo`}
                            className="w-20 h-20 flex-shrink-0 mt-2"
                        />
                        <div className="flex-1 pr-4">
                            <h2 className="card-title mb-0">
                                {info.event.name}
                            </h2>
                            <p className="mt-0">{info.event.dates}</p>
                            {info.isRegistrationOpen && (
                                <span className="badge badge-neutral">Registration Available</span>
                            )}
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