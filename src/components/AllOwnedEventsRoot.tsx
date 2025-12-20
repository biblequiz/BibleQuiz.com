import { useEffect, useRef, useState } from "react";
import { AuthManager } from "types/AuthManager";
import type { EventInfo } from "types/EventTypes";
import type { DistrictInfo, RegionInfo } from "types/RegionAndDistricts";
import { AstroEventsService } from "types/services/AstroEventsService";
import EventListFilters, { matchesFilter } from "./EventListFilters";
import { $eventFilters } from "utils/SharedState";
import FontAwesomeIcon from "./FontAwesomeIcon";
import EventCard from "./apps/liveAndUpcoming/EventCard";
import { useStore } from "@nanostores/react";
import { NEW_ID_PLACEHOLDER } from "./apps/event/EventProvider";

interface Props {
    regions: RegionInfo[];
    districts: DistrictInfo[];
    seasons: number[];
    loadingElementId: string;
}

interface ResolvedEventInfo extends EventInfo {
    type: string;
    urlSlug: string;
}

const SEASONS_SEPARATOR = "/seasons/";

export default function AllOwnedEventsRoot({
    regions,
    districts,
    seasons,
    loadingElementId }: Props) {
    const auth = AuthManager.useNanoStore();

    const [season, setSeason] = useState<number>(seasons[1]);
    const [events, setEvents] = useState<ResolvedEventInfo[] | undefined>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const eventFilters = useStore($eventFilters);

    useEffect(() => {
        if (!events || season != eventFilters.season) {

            const newSeason = eventFilters.season || seasons[1];
            if (events && newSeason === season) {
                return;
            }

            setIsLoading(true);
            AstroEventsService.getOwnedEvents(auth, newSeason)
                .then(fetchedEvents => {

                    const resolvedEvents = fetchedEvents.map(
                        event => {
                            const typeSeparator = event.Url.indexOf('/');
                            const type = event.Url.substring(0, typeSeparator).toLowerCase();

                            const slugStart = event.Url.indexOf(
                                '/',
                                event.Url.indexOf(SEASONS_SEPARATOR, typeSeparator) + SEASONS_SEPARATOR.length);
                            const slug = event.Url.substring(slugStart + 1);
                            return {
                                ...event.Event,
                                type: type,
                                urlSlug: slug
                            };
                        });

                    setEvents(resolvedEvents.reverse());
                    setSeason(newSeason);
                    setIsLoading(false);
                    setError(null);
                })
                .catch(err => {
                    setError(err);
                    setIsLoading(false);
                });
        }
    }, [auth, eventFilters])

    const eventListRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fallback = document.getElementById(loadingElementId);
        if (fallback) {
            fallback.style.display = isLoading ? "" : "none";
            if (eventListRef.current) {
                eventListRef.current.style.display = isLoading ? "none" : "";
            }
        }
    }, [isLoading]);

    if (isLoading || !events) {
        return null;
    }
    else if (error) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <FontAwesomeIcon icon="fas faTriangleExclamation" />
                            <span className="ml-4">Error</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            {error}
                        </p>
                    </div>
                </div>
            </div>);
    }

    const filteredEvents = eventFilters
        ? events.filter(event => matchesFilter(eventFilters, event.urlSlug, event, event.type, true))
        : events;

    return (
        <div ref={eventListRef} style={{ display: "none" }}>
            <EventListFilters
                regions={regions}
                districts={districts}
                seasons={seasons}
                allowTypeFilter={true}
            />
            {auth.userProfile?.canCreateEvents && (
                <div>
                    <a
                        type="button"
                        className="btn btn-primary mt-0"
                        href={`/manage-events/event/#/${NEW_ID_PLACEHOLDER}/registration/general`}>
                        <FontAwesomeIcon icon="fas faPlus" />&nbsp;Add New Event
                    </a>
                </div>)}
            <div className="mt-4">
                {events.length > 0 && (
                    <div className="flex flex-wrap gap-4">
                        {filteredEvents.map(event => {
                            return (
                                <EventCard
                                    key={event.id}
                                    info={{
                                        type: event.type,
                                        urlSlug: event.urlSlug,
                                        event: event,
                                        isNationals: false,
                                        isRegistrationOpen: false
                                    }}
                                    isLive={true}
                                    showLiveBadge={false}
                                    showHiddenBadge={!event.isVisible}
                                    urlFormatter={e => `event/#/${e.id}/dashboard`}
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
            </div>
        </div>);
}