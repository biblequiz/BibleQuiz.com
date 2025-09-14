import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useEffect, useMemo } from "react";
import type { EventInfo, EventTypeList } from "types/EventTypes";

interface Props {
    events: EventTypeList | null;
    loadingElementId: string;
}

interface ProcessedEvents {
    liveEvents: EventInfo[];
    upcomingEvents: EventInfo[];
}

export default function LiveAndUpcomingRoot({ events, loadingElementId }: Props) {

    const { liveEvents, upcomingEvents } = useMemo(
        () => {
            if (!events) {
                return { liveEvents: [], upcomingEvents: [] } as ProcessedEvents;
            }

            const liveEvents: EventInfo[] = [];
            const upcomingEvents: EventInfo[] = [];

            for (const type in events) {
                const typeEvents = events[type];
                for (const urlSlug in typeEvents) {
                    const event = typeEvents[urlSlug];
                    if (!event.isVisible || !event.isReport) {
                        continue;
                    }

                    if (event.isLive) {
                        liveEvents.push(event);
                    } else {
                        upcomingEvents.push(event);
                    }
                }
            }

            return { liveEvents, upcomingEvents };
        }, [events]);

    useEffect(() => {
        const fallback = document.getElementById(loadingElementId);
        if (fallback) fallback.style.display = "none";
    }, [loadingElementId]);

    return (
        <>
            <div className="badge badge-primary badge-danger text-lg p-4 mt-0">
                <FontAwesomeIcon icon="fas faTowerBroadcast" />
                <span className="font-bold">LIVE EVENTS</span>
            </div>
            <div className="flex flex-wrap gap-4">
                <a className="card live-events-card w-96 card-sm shadow-sm border-2 border-solid mt-0" href="/">
                    <div className="card-body">
                        <div className="flex items-start gap-4">
                            <img
                                src="/assets/logos/tbq/tbq-logo.png"
                                alt="TBQ Logo"
                                className="w-20 h-20 flex-shrink-0 mt-2"
                            />
                            <div>
                                <h2 className="card-title mb-0">
                                    West Texas & Plains/West Texas Meet 1 in Amarillo
                                </h2>
                                <p className="mt-0">Sep 13, 2025</p>
                            </div>
                            <FontAwesomeIcon
                                icon="fas faArrowRight"
                                classNames={["icon text-2xl rtl:flip"]}
                            />
                        </div>
                    </div>
                </a>
                <div
                    className="card w-96 bg-base-200 card-sm shadow-sm border-2 border-solid mt-0"
                >
                    <div className="card-body">
                        <div className="flex items-start gap-4">
                            <img
                                src="/assets/logos/jbq/jbq-logo.png"
                                alt="JBQ Logo"
                                className="w-20 h-20 flex-shrink-0 mt-2"
                            />
                            <div>
                                <h2 className="card-title mb-0">
                                    West Texas & Plains/West Texas Meet 1 in Amarillo
                                </h2>
                                <p className="mt-0">Sep 13, 2025</p>
                            </div>
                            <FontAwesomeIcon
                                icon="fas faArrowRight"
                                classNames={["text-2xl rtl:flip"]}
                            />
                        </div>
                    </div>
                </div>
                <div
                    className="card w-96 bg-base-200 card-sm shadow-sm border-2 border-solid mt-0"
                >
                    <div className="card-body">
                        <div className="flex items-start gap-4">
                            <img
                                src="/assets/logos/tbq/tbq-logo.png"
                                alt="TBQ Logo"
                                className="w-20 h-20 flex-shrink-0 mt-2"
                            />
                            <div>
                                <h2 className="card-title mb-0">
                                    West Texas & Plains/West Texas Meet 1 in Amarillo
                                </h2>
                                <p className="mt-0">Sep 13, 2025</p>
                            </div>
                            <FontAwesomeIcon
                                icon="fas faArrowRight"
                                classNames={["text-2xl rtl:flip"]}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>);
}