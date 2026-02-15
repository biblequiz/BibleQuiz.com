import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useEffect, useMemo, useRef, useState } from "react";
import type { EventInfo, EventTypeList } from "types/EventTypes";
import { DataTypeHelpers } from "utils/DataTypeHelpers";
import EventCard from "./EventCard";
import EventListFilters, { matchesFilter } from "components/EventListFilters";
import type { RegionInfo, DistrictInfo } from "types/RegionAndDistricts";
import { $eventFilters, type EventFilterConfiguration } from "utils/SharedState";
import { useStore } from "@nanostores/react";

interface Props {
    regions: RegionInfo[];
    districts: DistrictInfo[];
    currentSeason: number;
    currentSeasonLinks: Record<string, string | undefined>;
    recentSeasonEvents: EventTypeList | null;
    futureEvents: EventTypeList | null;
    loadingElementId: string;
}

interface ProcessedEvents {
    liveEvents: EventItem[];
    upcomingEvents: EventItem[];
    recentEvents: EventItem[];
}

interface EventItem {
    info: EventInfo;
    type: string;
    urlSlug: string;
    sortDate: Date;
    isNationals: boolean;
    isRegistrationOpen: boolean;
}

function renderEventSection(
    title: string,
    titleClass: string,
    icon: string,
    events: EventItem[],
    eventFilters: EventFilterConfiguration,
    typeFilterOverride: string | undefined,
    isLive: boolean,
    currentSeason?: number,
    seasonLink?: string) {

    if (events.length === 0) {
        return null;
    }

    const filteredEvents = eventFilters
        ? events.filter(event => matchesFilter(eventFilters, event.urlSlug, event.info, event.type, false, typeFilterOverride))
        : events;

    return (
        <div className="mt-4">
            <div className={`badge badge-${titleClass} text-md p-4 mt-0`}>
                <FontAwesomeIcon icon={`fas ${icon}`} />
                <span className="font-bold">{title}</span>
            </div>
            {seasonLink && (
                <a
                    className="card live-events-card w-90 card-sm shadow-sm border-2 border-solid mt-4 relative"
                    href={seasonLink}
                    target="_self">
                    <div className="card-body p-2 pl-4">
                        <div className="mt-3">
                            <h2 className="card-title">
                                Past {typeFilterOverride?.toUpperCase()} Events for {currentSeason} Season
                            </h2>
                            <p className="text-base mt-1">
                                Search through the full list of past events across the current season.
                            </p>
                        </div>
                        <FontAwesomeIcon
                            icon="fas faArrowRight"
                            classNames={["icon text-lg rtl:flip absolute top-4 right-4"]}
                        />
                    </div>
                </a>)}
            {!seasonLink && (
                <>
                    {filteredEvents.length > 0 && (
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
                                            isRegistrationOpen: event.isRegistrationOpen
                                        }}
                                        isLive={isLive}
                                    />
                                );
                            })}
                        </div>)}
                    {filteredEvents.length === 0 && (
                        <div role="alert" className="alert alert-info alert-outline">
                            <FontAwesomeIcon icon="far faLightbulb" />
                            <span className="text-base-content">
                                No events match your filter criteria. Click the
                                <div className="border-1 p-1 rounded-md inline-block ml-1 mr-1">
                                    <FontAwesomeIcon icon="fas faFilterCircleXmark" />&nbsp;
                                    Reset Search Filters</div> button above
                                to clear all filters.
                            </span>
                        </div>)}
                </>)}
        </div>);
}

export default function LiveAndUpcomingRoot({
    regions,
    districts,
    currentSeason,
    currentSeasonLinks,
    recentSeasonEvents,
    futureEvents,
    loadingElementId }: Props) {

    const eventFilters = useStore($eventFilters);
    const [urlParameters, setUrlParameters] = useState(() => new URLSearchParams(window.location.search));

    useEffect(() => {
        const handleUrlChange = () => {
            setUrlParameters(new URLSearchParams(window.location.search));
        };

        window.addEventListener('popstate', handleUrlChange);
        return () => window.removeEventListener('popstate', handleUrlChange);
    }, []);

    // Parse the parameter you need
    const urlType = useMemo(() => {
        return urlParameters.get('type') || undefined;
    }, [urlParameters]);

    const { liveEvents, upcomingEvents, recentEvents } = useMemo(
        () => {
            if (!futureEvents && !recentSeasonEvents) {
                return { liveEvents: [], upcomingEvents: [], recentEvents: [] } as ProcessedEvents;
            }

            const liveEvents: EventItem[] = [];
            const upcomingEvents: EventItem[] = [];
            const recentEvents: EventItem[] = [];

            // Collect all the events.
            const today: Date = new Date();
            today.setHours(0, 0, 0, 0);

            const recentCutoff: Date = new Date(today.getTime());
            recentCutoff.setDate(today.getDate() - 10);

            const listCollection = [futureEvents, recentSeasonEvents];
            for (const events of listCollection) {
                if (!events) {
                    continue;
                }

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
                            urlSlug: urlSlug,
                            isNationals: urlSlug === "nationals/results/",
                            isRegistrationOpen: false
                        };

                        // TBQ has a special landing page for Nationals. If the date is in the future,
                        // redirect to the special landing page.
                        const isLive = startDate <= today && endDate >= today;
                        if (eventItem.isNationals && !isLive && type === "tbq") {
                            eventItem.urlSlug = "nationals/";
                        }

                        if (isLive) {
                            liveEvents.push(eventItem);
                        } else {
                            let isUpcoming = false;
                            if (eventItem.isNationals && startDate > today) {
                                isUpcoming = true;
                            }
                            else {
                                isUpcoming = startDate > today;
                                if (event.registrationEndDate) {
                                    const date = DataTypeHelpers.parseDateOnly(event.registrationEndDate)!;
                                    eventItem.isRegistrationOpen = date > today;
                                }
                            }

                            if (isUpcoming) {
                                upcomingEvents.push(eventItem);
                            }
                            else if (endDate >= recentCutoff && endDate < today) {
                                recentEvents.push(eventItem);
                            }
                        }
                    }
                }
            }

            // Sort the lists.
            const sortedLive = liveEvents.sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());
            const sortedRecent = recentEvents.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());
            const sortedUpcoming = upcomingEvents.sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());

            return { liveEvents: sortedLive, upcomingEvents: sortedUpcoming, recentEvents: sortedRecent };
        }, [futureEvents, recentSeasonEvents]);

    const eventListRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fallback = document.getElementById(loadingElementId);
        if (fallback) {
            fallback.style.display = "none";
            eventListRef.current!.style.display = "";
        }
    }, [loadingElementId]);

    return (
        <div ref={eventListRef} style={{ display: "none" }}>
            <EventListFilters
                regions={regions}
                districts={districts}
                allowTypeFilter={!urlType}
            />
            {renderEventSection(
                "LIVE EVENTS",
                "success",
                "faTowerBroadcast",
                liveEvents,
                eventFilters,
                urlType,
                true)}
            {renderEventSection(
                "JUST HAPPENED",
                "info",
                "faClockRotateLeft",
                recentEvents,
                eventFilters,
                urlType,
                true,
                currentSeason,
                urlType ? currentSeasonLinks[urlType] : undefined)}
            {renderEventSection(
                "COMING UP",
                "primary",
                "faCalendarDays",
                upcomingEvents,
                eventFilters,
                urlType,
                false)}
        </div>);
}