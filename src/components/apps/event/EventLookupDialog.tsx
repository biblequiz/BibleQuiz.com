import { useEffect, useRef, useState } from "react";
import { AuthManager } from 'types/AuthManager';
import { DataTypeHelpers } from "utils/DataTypeHelpers";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import { AstroEventsService } from "types/services/AstroEventsService";
import type { EventInfo } from "types/EventTypes";

interface Props {
    season: number;
    regionId?: string;
    districtId?: string;
    onSelect: (event: EventInfo | null) => void;
    eventCache?: EventInfoCache;
    typeId?: string;
    requireDatabases?: boolean;
    excludeEventIds?: string[];
    allowBroaderScopes?: boolean;
}

export interface EventInfoCache {
    events: EventInfoWithTypeId[] | undefined;
    season: number | undefined;
}

export interface EventInfoWithTypeId extends EventInfo {
    typeId: string;
    searchableName: string;
    searchableLocation?: string;
}

export default function EventLookupDialog({
    season,
    regionId,
    districtId,
    onSelect,
    eventCache,
    excludeEventIds,
    typeId,
    requireDatabases = false,
    allowBroaderScopes = false }: Props) {

    const dialogRef = useRef<HTMLDialogElement>(null);

    const auth = AuthManager.useNanoStore();

    const [searchText, setSearchText] = useState<string | undefined>(undefined);
    const [allEvents, setAllEvents] = useState<EventInfoWithTypeId[] | undefined>(undefined);
    const [events, setEvents] = useState<EventInfoWithTypeId[] | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [loadingOrSavingError, setLoadingOrSavingError] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true);

        if (!isLoading && !isAssigning) {

            const excludeIds = new Set<string>(excludeEventIds ?? []);

            if (eventCache?.events && eventCache.season === season) {
                setAllEvents(eventCache!.events.filter(e => !excludeIds.has(e.id)));
            }
            else {
                AstroEventsService.getOwnedEvents(
                    auth,
                    season,
                    typeId,
                    requireDatabases)
                    .then(events => {
                        const formattedEvents = events.map(e => {
                            const formatted = e.Event as EventInfoWithTypeId;
                            formatted.typeId = e.Url.substring(0, 3);
                            formatted.searchableName = formatted.name.toLowerCase();
                            formatted.searchableLocation = formatted.locationName?.toLowerCase();
                            return formatted;
                        });

                        setAllEvents(formattedEvents.filter(e => !excludeIds.has(e.id)));
                        setLoadingOrSavingError(null);
                    })
                    .catch(err => {
                        setIsLoading(false);
                        setLoadingOrSavingError(err.message ?? "Unknown error");
                    });
            }
        }
    }, [auth, season, eventCache, requireDatabases]);

    useEffect(() => {
        if (!allEvents) {
            return;
        }

        const normalizedSearchText = searchText?.trim()?.toLowerCase();
        const filteredEvents: EventInfoWithTypeId[] = [];
        for (const event of allEvents) {
            if (regionId && event.regionId !== regionId) {
                if (!allowBroaderScopes || event.regionId) {
                    continue;
                }
            }
            else if (districtId && event.districtId !== districtId) {
                if (!allowBroaderScopes || event.districtId) {
                    continue;
                }
            }

            if (normalizedSearchText &&
                !event.searchableName.includes(normalizedSearchText) &&
                event.searchableLocation && !event.searchableLocation.includes(normalizedSearchText)) {
                continue;
            }

            filteredEvents.push(event);
        }

        setEvents(filteredEvents);
        setIsLoading(false);
    }, [allEvents, searchText, regionId, districtId]);

    return (
        <dialog ref={dialogRef} className="modal" open>
            <div className="modal-box w-full max-w-3xl">
                <h3 className="font-bold text-lg">Select an Event</h3>
                <button
                    type="button"
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    onClick={() => {
                        onSelect(null);
                        dialogRef.current?.close();
                    }}
                >✕</button>
                <div className="mt-4">
                    {loadingOrSavingError && (
                        <div role="alert" className="alert alert-error mt-2 mb-2 w-full">
                            <FontAwesomeIcon icon="fas faCircleExclamation" />
                            <div>
                                <b>Error: </b> {loadingOrSavingError}
                            </div>
                        </div>)}
                    <div className="w-full">
                        <label className="input input-sm mt-0 w-full">
                            <FontAwesomeIcon icon="fas faSearch" classNames={["h-[1em]", "opacity-50"]} />
                            <input
                                type="text"
                                className="grow"
                                placeholder="Name"
                                value={searchText ?? ""}
                                onChange={e => {
                                    const currentValue = e.target.value;
                                    const newText = DataTypeHelpers.isNullOrEmpty(currentValue)
                                        ? undefined
                                        : currentValue;
                                    setSearchText(newText);
                                }}
                                onBlur={() => setSearchText(searchText)}
                                disabled={isLoading || isAssigning} />
                            {(searchText?.length ?? 0) > 0 && (
                                <button
                                    className="btn btn-ghost btn-xs"
                                    onClick={() => {
                                        setSearchText(undefined);
                                    }}>
                                    <FontAwesomeIcon icon="fas faCircleXmark" />
                                </button>)}
                        </label>
                    </div>
                </div>
                {(isLoading || isAssigning) && (
                    <div className="flex justify-center items-center">
                        <span className="loading loading-spinner loading-xl"></span>&nbsp;
                        {isLoading ? "Loading events ..." : "Selecting event ..."}
                    </div>)}
                {(!isLoading && !isAssigning) && (
                    <>
                        <div className="mt-4">
                            {events && events.length > 0 && (
                                <div className="flex flex-wrap gap-4">
                                    {events.map(event => {

                                        let locationLabel: string | null = null;
                                        if (event.locationName || event.locationCity) {
                                            if (event.locationName && event.locationCity) {
                                                locationLabel = `${event.locationName}, ${event.locationCity}`;
                                            }
                                            else if (event.locationName) {
                                                locationLabel = event.locationName;
                                            }
                                            else {
                                                locationLabel = event.locationCity;
                                            }
                                        }

                                        return (
                                            <button
                                                key={`event-card-${event.id}`}
                                                type="button"
                                                className="card live-events-card w-85 card-sm shadow-sm border-2 border-solid mt-0 relative"
                                                onClick={() => {
                                                    onSelect(event);
                                                    dialogRef.current?.close();
                                                }}>
                                                <div className="card-body p-2 pl-4">
                                                    <div className="flex items-start gap-4">
                                                        <img
                                                            src={`/assets/logos/${event.typeId}/${event.typeId}-logo.png`}
                                                            alt={`${event.typeId.toUpperCase()} Logo`}
                                                            className="w-20 h-20 flex-shrink-0 mt-2"
                                                        />
                                                        <div className="flex-1 pr-6 mt-2">
                                                            <h2 className="card-title mb-0 mt-1">
                                                                {event.name}
                                                            </h2>
                                                            <p className="mt-0">{event.dates}</p>
                                                            {locationLabel && <p className="text-gray-500 italic m-0">{locationLabel}</p>}
                                                        </div>
                                                    </div>
                                                    <FontAwesomeIcon
                                                        icon="fas faArrowRight"
                                                        classNames={["icon text-lg rtl:flip absolute top-4 right-4"]}
                                                    />
                                                </div>
                                            </button>);
                                    })}
                                </div>)}
                            {!events || events.length === 0 && (
                                <div role="alert" className="alert alert-info alert-outline">
                                    <FontAwesomeIcon icon="far faLightbulb" />
                                    <span className="text-base-content">
                                        No events match your search criteria.
                                    </span>
                                </div>)}
                        </div>
                    </>)}
                <div className="mt-4 text-right">
                    <button
                        className="btn btn-warning mt-0"
                        type="button"
                        disabled={isLoading || isAssigning}
                        tabIndex={2}
                        onClick={() => {
                            setIsAssigning(true);
                            onSelect(null);
                            dialogRef.current?.close();
                        }}>
                        Close
                    </button>
                </div>
            </div>
        </dialog>);
}