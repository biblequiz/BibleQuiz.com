import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useEffect, useMemo } from "react";
import type { EventInfo, EventTypeList } from "types/EventTypes";
import { DataTypeHelpers } from "utils/DataTypeHelpers";
import EventCard from "./EventCard";

interface Props {
    events: EventTypeList | null;
    loadingElementId: string;
}

interface ProcessedEvents {
    liveEvents: EventItem[];
    upcomingEvents: EventItem[];
}

interface EventItem {
    info: EventInfo;
    type: string;
    urlSlug: string;
    sortDate: Date;
}

export default function LiveAndUpcomingRoot({ events, loadingElementId }: Props) {

    const { liveEvents, upcomingEvents } = useMemo(
        () => {
            if (!events) {
                return { liveEvents: [], upcomingEvents: [] } as ProcessedEvents;
            }

            const liveEvents: EventItem[] = [];
            const upcomingEvents: EventItem[] = [];

            // Collect all the events.
            const today: Date = new Date();
            today.setHours(0, 0, 0, 0);

            const upcomingCutoff: Date = new Date(today.getTime());
            upcomingCutoff.setDate(today.getDate() + 14);

            for (const type in events) {
                const typeEvents = events[type];
                for (const urlSlug in typeEvents) {
                    const event = typeEvents[urlSlug];
                    if (!event.isVisible || event.isReport) {
                        continue;
                    }

                    if (!event.startDate || !event.endDate) {
                        continue;
                    }

                    const startDate = DataTypeHelpers.parseDateOnly(event.startDate)!;
                    const endDate = DataTypeHelpers.parseDateOnly(event.endDate)!;

                    const eventItem: EventItem = {
                        info: event,
                        sortDate: startDate,
                        type: type,
                        urlSlug: urlSlug
                    };

                    if (startDate <= today && endDate >= today) {
                        liveEvents.push(eventItem);
                    } else if (event.registrationEndDate) {
                        const date = DataTypeHelpers.parseDateOnly(event.registrationEndDate)!;
                        if (date > today && date <= upcomingCutoff) {
                            upcomingEvents.push(eventItem);
                        }
                    }
                }
            }

            // Sort the lists.
            const sortedLive = liveEvents.sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());
            const sortedUpcoming = upcomingEvents.sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());

            return { liveEvents: sortedLive, upcomingEvents: sortedUpcoming };
        }, [events]);

    useEffect(() => {
        const fallback = document.getElementById(loadingElementId);
        if (fallback) fallback.style.display = "none";
    }, [loadingElementId]);

    return (
        <>
            {liveEvents.length > 0 && (
                <>
                    <div className="badge badge-success badge-danger text-md p-4 mt-0">
                        <FontAwesomeIcon icon="fas faTowerBroadcast" />
                        <span className="font-bold">LIVE EVENTS</span>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        {liveEvents.map(event => (
                            <EventCard
                                key={event.info.id}
                                info={{ type: event.type, urlSlug: event.urlSlug, event: event.info }}
                                isLive={true}
                            />
                        ))}
                        <EventCard isLive={true} />
                    </div>
                </>)}
            {upcomingEvents.length > 0 && (
                <div className="mt-4">
                    <div className="badge badge-primary badge-danger text-md p-4 mt-0">
                        <FontAwesomeIcon icon="fas faCalendarDays" />
                        <span className="font-bold">NEXT 2 WEEKS</span>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        {upcomingEvents.map(event => (
                            <EventCard
                                key={event.info.id}
                                info={{ type: event.type, urlSlug: event.urlSlug, event: event.info }}
                                isLive={false}
                            />
                        ))}
                        <EventCard isLive={false} />
                    </div>
                </div>)}
        </>);
}