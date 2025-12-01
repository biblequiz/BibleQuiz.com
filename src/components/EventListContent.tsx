import { useStore } from "@nanostores/react";
import type { EventInfo, EventTypeList } from 'types/EventTypes.ts';
import { DataTypeHelpers } from "utils/DataTypeHelpers.ts";
import EventCard from "./apps/liveAndUpcoming/EventCard.tsx";
import { $eventFilters } from "utils/SharedState.ts";
import { useEffect, useMemo } from "react";
import { matchesFilter } from "./EventListFilters.tsx";
import FontAwesomeIcon from "./FontAwesomeIcon.tsx";

interface Props {
    events: EventTypeList;
    loadingElementId: string;
    containerElementId: string;
}

interface EventItem {
    info: EventInfo;
    type: string;
    urlSlug: string;
    sortDate: Date;
    isNationals: boolean;
}

export default function EventListContent({ events, loadingElementId, containerElementId }: Props) {

    const eventFilters = useStore($eventFilters);

    const mergedEvents = useMemo(
        () => {
            if (!events) {
                return [];
            }

            const allEvents: EventItem[] = [];

            // Collect all the events.
            const today: Date = new Date();
            today.setHours(0, 0, 0, 0);

            for (const type in events) {
                const typeEvents = events[type];
                for (const urlSlug in typeEvents) {
                    const event = typeEvents[urlSlug];
                    if (!event.isVisible) {
                        continue;
                    }

                    if (!event.startDate || !event.endDate) {
                        continue;
                    }

                    allEvents.push({
                        info: event,
                        sortDate: DataTypeHelpers.parseDateOnly(event.startDate)!,
                        type: type,
                        urlSlug: urlSlug,
                        isNationals: urlSlug === "nationals/results/",
                    } as EventItem);
                }
            }

            // Sort the lists.
            return allEvents.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());
        }, [events]);

    // Hide the loading element once the page is loaded.
    useEffect(() => {
        const fallback = document.getElementById(loadingElementId);
        const container = document.getElementById(containerElementId);
        if (fallback && container) {
            fallback.style.display = "none";
            container.style.display = "";
        }
    }, [loadingElementId, containerElementId]);

    if (mergedEvents.length === 0) {
        return (
            <div className="text-center italic py-4">
                No events found for this season yet. Please check back later.
            </div>);
    }

    const filteredEvents = eventFilters
        ? mergedEvents.filter(event => matchesFilter(eventFilters, event.info, event.type))
        : mergedEvents;

    if (filteredEvents.length === 0) {
        return (
            <div role="alert" className="alert alert-info alert-outline">
                <FontAwesomeIcon icon="far faLightbulb" />
                <span className="text-base-content">
                    No events match your filter criteria. Click the
                    <div className="border-1 p-1 rounded-md inline-block ml-1 mr-1">
                        <FontAwesomeIcon icon="fas faFilterCircleXmark" />&nbsp;
                        Clear Search Filters</div> button above
                    to clear all filters.
                </span>
            </div>);
    }

    return (
        <div className="flex flex-wrap gap-4">
            {filteredEvents.map(event => {
                return (
                    <EventCard
                        key={event.info.id}
                        info={{
                            type: event.type,
                            urlSlug: event.urlSlug,
                            event: event.info,
                            isNationals: event.isNationals,
                            isRegistrationOpen: false
                        }}
                        isLive={true}
                    />
                );
            })}
        </div>);
}