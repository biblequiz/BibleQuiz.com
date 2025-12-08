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
    futureEvents: EventTypeList | null;
    loadingElementId: string;
    containerElementId: string;
    excludeMissingDates: boolean;
}

interface EventItem {
    info: EventInfo;
    type: string;
    urlSlug: string;
    sortDate?: Date;
    isNationals: boolean;
}

export default function EventListContent({
    events,
    futureEvents,
    loadingElementId,
    containerElementId,
    excludeMissingDates }: Props) {

    const eventFilters = useStore($eventFilters);

    const { mergedEvents, mergedLiveEvents } = useMemo(
        () => {
            // Collect all the events.
            const today: Date = new Date();
            today.setHours(0, 0, 0, 0);

            const allEvents: EventItem[] = [];
            if (events) {
                for (const type in events) {
                    const typeEvents = events[type];
                    for (const urlSlug in typeEvents) {
                        const event = typeEvents[urlSlug];
                        if (!event.isVisible) {
                            continue;
                        }

                        if (excludeMissingDates && (!event.startDate || !event.endDate)) {
                            continue;
                        }

                        allEvents.push({
                            info: event,
                            sortDate: excludeMissingDates
                                ? DataTypeHelpers.parseDateOnly(event.startDate)!
                                : undefined,
                            type: type,
                            urlSlug: urlSlug,
                            isNationals: urlSlug === "nationals/results/",
                        } as EventItem);
                    }
                }
            }

            const liveEvents: EventItem[] = [];
            if (futureEvents) {
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

                        const startDate = DataTypeHelpers.parseDateOnly(event.startDate)!;
                        const endDate = DataTypeHelpers.parseDateOnly(event.endDate)!;

                        const isLive = startDate <= today && endDate >= today;
                        if (!isLive) {
                            continue;
                        }

                        liveEvents.push({
                            info: event,
                            sortDate: startDate,
                            type: type,
                            urlSlug: urlSlug,
                            isNationals: urlSlug === "nationals/results/",
                        } as EventItem);
                    }
                }
            }

            const sortedLiveEvents = liveEvents
                .sort((a, b) => b.sortDate!.getTime() - a.sortDate!.getTime());

            if (excludeMissingDates) {
                return {
                    mergedEvents: allEvents.sort((a, b) => b.sortDate!.getTime() - a.sortDate!.getTime()),
                    mergedLiveEvents: sortedLiveEvents,
                };
            }

            return { mergedEvents: allEvents, mergedLiveEvents: sortedLiveEvents };
        }, [events, futureEvents, excludeMissingDates]);

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

    const filteredLiveEvents = eventFilters
        ? mergedLiveEvents.filter(event => matchesFilter(eventFilters, event.urlSlug, event.info, event.type))
        : mergedLiveEvents;

    const filteredEvents = eventFilters
        ? mergedEvents.filter(event => matchesFilter(eventFilters, event.urlSlug, event.info, event.type))
        : mergedEvents;

    const pastEventsSection = filteredEvents.length === 0
        ? (
            <div role="alert" className="alert alert-info alert-outline">
                <FontAwesomeIcon icon="far faLightbulb" />
                <span className="text-base-content">
                    No events match your filter criteria. Click the
                    <div className="border-1 p-1 rounded-md inline-block ml-1 mr-1">
                        <FontAwesomeIcon icon="fas faFilterCircleXmark" />&nbsp;
                        Reset Search Filters</div> button above
                    to clear all filters.
                </span>
            </div>)
        : (
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

    return (
        <>
            {filteredLiveEvents.length > 0 && (
                <>
                    <div className="mt-0">
                        <div className="badge badge-success text-md p-4 mt-0">
                            <FontAwesomeIcon icon="fas faTowerBroadcast" />
                            <span className="font-bold">LIVE EVENTS</span>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            {filteredLiveEvents.map(event => {
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
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="badge badge-info text-md p-4 mt-0">
                            <FontAwesomeIcon icon="fas faClockRotateLeft" />
                            <span className="font-bold">PAST EVENTS</span>
                        </div>
                        {pastEventsSection}
                    </div>
                </>)}
            {filteredLiveEvents.length === 0 && pastEventsSection}
        </>);
}