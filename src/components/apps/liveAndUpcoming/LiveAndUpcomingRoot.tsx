import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useEffect, useMemo, useRef, useState } from "react";
import type { EventInfo, EventTypeList } from "types/EventTypes";
import { DataTypeHelpers } from "utils/DataTypeHelpers";
import EventStatusCard, { type EventStatus } from "./EventStatusCard";
import EventListFilters, { matchesFilter } from "components/EventListFilters";
import type { RegionInfo, DistrictInfo } from "types/RegionAndDistricts";
import { $eventFilters } from "utils/SharedState";
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
    openEvents: EventItem[];
    upcomingEvents: EventItem[];
    recentEvents: EventItem[];
}

interface EventItem {
    info: EventInfo;
    type: string;
    urlSlug: string;
    sortDate: Date;
    status: EventStatus;
}

interface EventSection {
    id: string;
    title: string;
    icon: string;
    events: EventItem[];
}

/**
 * Renders one section of the Event List, its heading showing how many events it holds (D18, D30).
 */
function renderEventSection(section: EventSection, today: Date) {
    return (
        <section key={section.id} id={section.id} className="bq-event-section">
            <h2>
                <FontAwesomeIcon icon={`fas ${section.icon}`} />
                {section.title} <span className="bq-count">({section.events.length})</span>
            </h2>
            <div className="bq-event-grid">
                {section.events.map(event => (
                    <EventStatusCard
                        key={event.info.id}
                        type={event.type}
                        urlSlug={event.urlSlug}
                        event={event.info}
                        status={event.status}
                        today={today}
                    />))}
            </div>
        </section>);
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

    const { today, liveEvents, openEvents, upcomingEvents, recentEvents } = useMemo(
        () => {
            const today: Date = new Date();
            today.setHours(0, 0, 0, 0);

            const liveEvents: EventItem[] = [];
            const openEvents: EventItem[] = [];
            const upcomingEvents: EventItem[] = [];
            const recentEvents: EventItem[] = [];

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
                        const isNationals = urlSlug === "nationals/results/";
                        const isLive = startDate <= today && endDate >= today;

                        const eventItem: EventItem = {
                            info: event,
                            sortDate: startDate,
                            type: type,
                            urlSlug: urlSlug,
                            status: "live",
                        };

                        // TBQ has a special landing page for Nationals. If the date is in the future,
                        // redirect to the special landing page.
                        if (isNationals && startDate > today && type === "tbq") {
                            eventItem.urlSlug = "nationals/";
                        }

                        if (isLive) {
                            liveEvents.push(eventItem);
                        }
                        else if (startDate > today) {
                            // Nationals registration doesn't go through the Event List.
                            const registrationEnd = isNationals
                                ? null
                                : DataTypeHelpers.parseDateOnly(event.registrationEndDate);

                            // Registration stays open through the end of the closing day.
                            if (registrationEnd && registrationEnd >= today) {
                                eventItem.status = "registrationOpen";
                                openEvents.push(eventItem);
                            }
                            else {
                                eventItem.status = "upcoming";
                                upcomingEvents.push(eventItem);
                            }
                        }
                        else if (endDate >= recentCutoff && endDate < today) {
                            eventItem.status = "finished";
                            recentEvents.push(eventItem);
                        }
                    }
                }
            }

            const byDate = (a: EventItem, b: EventItem) => a.sortDate.getTime() - b.sortDate.getTime();
            return {
                today,
                liveEvents: liveEvents.sort(byDate),
                openEvents: openEvents.sort(byDate),
                upcomingEvents: upcomingEvents.sort(byDate),
                recentEvents: recentEvents.sort((a, b) => byDate(b, a)),
            } as ProcessedEvents & { today: Date };
        }, [futureEvents, recentSeasonEvents]);

    const applyFilters = (events: EventItem[]) => eventFilters
        ? events.filter(event => matchesFilter(eventFilters, event.urlSlug, event.info, event.type, false, urlType))
        : events;

    const seasonLink = urlType ? currentSeasonLinks[urlType] : undefined;
    const sections: EventSection[] = [
        { id: "live-now", title: "Live now", icon: "faTowerBroadcast", events: applyFilters(liveEvents) },
        { id: "registration-open", title: "Registration open", icon: "faPenToSquare", events: applyFilters(openEvents) },
        { id: "coming-up", title: "Coming up", icon: "faCalendarDays", events: applyFilters(upcomingEvents) },
        { id: "recently-finished", title: "Recently finished", icon: "faFlagCheckered", events: applyFilters(recentEvents) },
    ];

    const totalEvents = liveEvents.length + openEvents.length + upcomingEvents.length + recentEvents.length;
    const shownSections = sections.filter(section => section.events.length > 0);

    const eventListRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fallback = document.getElementById(loadingElementId);
        if (fallback) {
            fallback.style.display = "none";
            eventListRef.current!.style.display = "";
        }
    }, [loadingElementId]);

    const handleTypeSwitch = (newType: string) => {
        const params = new URLSearchParams(window.location.search);
        params.set('type', newType);
        window.history.pushState({}, '', `?${params.toString()}`);
        setUrlParameters(params);
        // Dispatch custom event so the page title updates
        window.dispatchEvent(new CustomEvent('typeChanged', { detail: { type: newType } }));
    };

    return (
        <div ref={eventListRef} style={{ display: "none" }}>
            {urlType && (
                <div className="mb-4 flex items-center justify-between">
                    <div className="join">
                        <button
                            className={`join-item btn btn-sm ${urlType === 'jbq' ? 'btn-primary' : ''}`}
                            onClick={() => handleTypeSwitch('jbq')}>
                            JBQ
                        </button>
                        <button
                            className={`join-item btn btn-sm ${urlType === 'tbq' ? 'btn-primary' : ''}`}
                            onClick={() => handleTypeSwitch('tbq')}>
                            TBQ
                        </button>
                    </div>
                </div>
            )}
            <EventListFilters
                regions={regions}
                districts={districts}
                allowTypeFilter={!urlType}
            />
            {shownSections.length > 0 && (
                <nav className="bq-jump bq-event-jump" aria-label="On this page">
                    {shownSections.map(section => (
                        <a key={section.id} href={`#${section.id}`}>
                            <FontAwesomeIcon icon={`fas ${section.icon}`} />
                            {section.title} ({section.events.length})
                        </a>))}
                </nav>)}
            {shownSections.map(section => renderEventSection(section, today))}
            {shownSections.length === 0 && totalEvents > 0 && (
                <div role="alert" className="alert alert-info alert-outline mt-4">
                    <FontAwesomeIcon icon="far faLightbulb" />
                    <span className="text-base-content">
                        No events match your filters. Use
                        <span className="border-1 p-1 rounded-md inline-block ml-1 mr-1">
                            <FontAwesomeIcon icon="fas faFilterCircleXmark" />&nbsp;
                            Reset Search Filters</span> above
                        to see every event{urlType && ", or switch between JBQ and TBQ at the top"}.
                    </span>
                </div>)}
            {totalEvents === 0 && (
                <p className="mt-4">There are no live or upcoming events right now. Check back soon.</p>)}
            {seasonLink && (
                <a className="bq-event-more" href={seasonLink}>
                    All {urlType?.toUpperCase()} events from the {currentSeason} season
                    <FontAwesomeIcon icon="fas faArrowRight" classNames={["rtl:flip"]} />
                </a>)}
        </div>);
}