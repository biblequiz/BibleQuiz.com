import { useMemo } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import { FILTERS_STORAGE_KEY, matchesFilter } from "components/EventListFilters";
import type { EventInfo, EventTypeList } from "types/EventTypes";
import { DataTypeHelpers } from "utils/DataTypeHelpers";
import type { EventFilterConfiguration } from "utils/SharedState";

interface Props {
    futureEvents: EventTypeList | null;
    recentSeasonEvents: EventTypeList | null;
}

interface LiveEvent {
    info: EventInfo;
    type: string;
    urlSlug: string;
}

/**
 * Happening Now (D4, D16): a one-line shortcut on the Task Chooser to the scores of events that are
 * live today. It uses the Event List's "live" rule and, when the visitor has saved Event List
 * filters, counts only the live events matching them, saying so with an icon and text.
 */
export default function HappeningNow({ futureEvents, recentSeasonEvents }: Props) {

    const liveEvents = useMemo(() => findLiveEvents([futureEvents, recentSeasonEvents]), [futureEvents, recentSeasonEvents]);
    const savedFilter = useMemo(readSavedFilter, []);

    if (liveEvents.length === 0) {
        return null;
    }

    const filterLabel = savedFilter ? describeFilter(savedFilter) : null;
    const matching = savedFilter
        ? liveEvents.filter(e => matchesFilter(savedFilter, e.urlSlug, e.info, e.type))
        : liveEvents;

    let href: string;
    let text: string;
    let action: string;
    if (matching.length === 1) {
        const event = matching[0];
        href = `/${event.type}/seasons/${event.info.season}/${event.urlSlug}`;
        text = `Live now: ${event.info.name}`;
        action = "View scores";
    }
    else if (matching.length > 1) {
        href = "/events/#live";
        text = `${matching.length} events live now`;
        action = "See them";
    }
    else {
        href = "/events/#live";
        text = "No live events in your area";
        action = `${liveEvents.length} live elsewhere`;
    }

    return (
        <a href={href} className="bq-happening-now">
            <span aria-hidden="true" className="bq-happening-dot" />
            <span className="bq-happening-text">{text}</span>
            {filterLabel && matching.length > 0 && (
                <span className="bq-happening-filter" title="Counting only events that match your saved Event List filters">
                    <FontAwesomeIcon icon="fas faFilter" />
                    {filterLabel}
                </span>
            )}
            <span className="bq-happening-action">
                {action}
                <FontAwesomeIcon icon="fas faChevronRight" />
            </span>
        </a>);
}

function findLiveEvents(lists: (EventTypeList | null)[]): LiveEvent[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const seen = new Set<string>();
    const result: LiveEvent[] = [];
    for (const list of lists) {
        if (!list) {
            continue;
        }

        for (const type in list) {
            for (const urlSlug in list[type]) {
                const info = list[type][urlSlug];
                if (!info.isVisible || info.isReport || !info.startDate || !info.endDate || seen.has(info.id)) {
                    continue;
                }

                // Same rule as the Event List: live while today is between the start and end dates.
                const start = DataTypeHelpers.parseDateOnly(info.startDate)!;
                const end = DataTypeHelpers.parseDateOnly(info.endDate)!;
                if (start <= today && end >= today) {
                    seen.add(info.id);
                    result.push({ info, type, urlSlug });
                }
            }
        }
    }

    return result.sort((a, b) => a.info.name.localeCompare(b.info.name));
}

/**
 * Reads the visitor's saved Event List filters, keeping only region, district and Program. Search
 * text is a one-off lookup, so it doesn't narrow Happening Now.
 */
function readSavedFilter(): EventFilterConfiguration | null {
    try {
        const serialized = localStorage.getItem(FILTERS_STORAGE_KEY);
        const saved = serialized ? JSON.parse(serialized) as EventFilterConfiguration : null;
        if (!saved || (!saved.regionId && !saved.districtId && !saved.typeFilter)) {
            return null;
        }

        return {
            isLoaded: true,
            regionId: saved.regionId,
            districtId: saved.districtId,
            typeFilter: saved.typeFilter,
        } as EventFilterConfiguration;
    }
    catch {
        return null;
    }
}

function describeFilter(filter: EventFilterConfiguration): string {
    const program = filter.typeFilter ? `${filter.typeFilter.toUpperCase()} ` : "";
    if (filter.districtId) {
        return `${program}in your district`;
    }
    else if (filter.regionId) {
        return `${program}in your region`;
    }

    return `${program}only`;
}
