import { useStore } from "@nanostores/react";
import EventScopeBadge from './EventScopeBadge.tsx';
import { sharedEventListFilter, type EventListFilterConfiguration } from 'utils/SharedState.ts';
import type { EventInfo, EventList } from 'types/EventTypes.ts';
import FontAwesomeIcon from './FontAwesomeIcon.js';
import { DataTypeHelpers } from "utils/DataTypeHelpers.ts";

interface Props {
    badgeId: string;
    events: EventList;
    type: string;
}

export default function EventListTabContent({ badgeId, events, type }: Props) {

    const eventFilters: EventListFilterConfiguration = useStore(sharedEventListFilter as any);

    const today: Date = new Date();
    today.setHours(0, 0, 0, 0);

    // Look two weeks into the future.
    const scoresCutoff: Date = new Date(today.getTime());
    scoresCutoff.setDate(today.getDate() + 14);

    let eventCount: number = 0;
    const eventRows = Object.keys(events).map((urlSlug: string) => {
        const event: EventInfo = events[urlSlug];
        if (!event.isVisible) {
            return null;
        }

        if (eventFilters?.searchText) {
            const searchText = eventFilters.searchText.toLocaleLowerCase();
            
            if (!event.name.toLocaleLowerCase().includes(searchText) &&
                !event.locationName?.toLocaleLowerCase().includes(searchText) &&
                !event.locationCity?.toLocaleLowerCase().includes(searchText)) {
                return null;
            }
        }

        switch (event.scope) {
            case "nation":
                if (eventFilters && !eventFilters.showNation) {
                    return null; // Nation-level events are not shown.
                }
                break;
            case "region":
                if (eventFilters) {
                    if (!eventFilters.showRegion) {
                        return null; // Region-level events are not shown.
                    }
                    else if (eventFilters.regionId && eventFilters.regionId != event.regionId) {
                        return null; // Region-level events must match the selected region since the filter includes one.
                    }
                }
                break;
            case "district":
                if (eventFilters) {
                    if (!eventFilters.showDistrict) {
                        return null; // District-level events are not shown.
                    }
                    else if (
                        (eventFilters.regionId && eventFilters.regionId != event.regionId) ||
                        (eventFilters.districtId && eventFilters.districtId != event.districtId)) {

                        // District-level events must match the selected district OR be part of the selected
                        // region.
                        return null;
                    }
                }
                break;
        }

        let showRegistration: boolean = false;
        if (event.registrationEndDate &&
            DataTypeHelpers.parseDateOnly(event.registrationEndDate)!.getTime() >= today.getTime()) {
            showRegistration = true;
        }

        let isPastEvent: boolean = false;
        let showScores: boolean = false;
        if (event.endDate) {
            const parsedDate = DataTypeHelpers.parseDateOnly(event.endDate)!.getTime();
            if (parsedDate < today.getTime()) {
                isPastEvent = true;
                showScores = true;
            }
            else if (parsedDate < scoresCutoff.getTime()) {
                showScores = true;
            }
        }
        else if (!event.startDate) {
            showScores = true;
        }

        let isLiveEvent: boolean = false;
        if (!isPastEvent && event.startDate &&
            Date.parse(event.startDate) <= today.getTime()) {
            isLiveEvent = true;
        }

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

        eventCount++;

        return (
            <div key={`eventrow_${event.id}`}>
                <div>
                    <EventScopeBadge scope={event.scope} label={event.scopeLabel ?? ""} />
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full">
                        <div className="flex-1 min-w-0">
                            <div className="m-0 flex items-center">
                                {isLiveEvent && <div className="badge badge-primary mr-2">LIVE</div>}
                                <p className="text-lg font-bold m-0 truncate">{event.name}</p>
                            </div>
                            {locationLabel && <p className="text-gray-500 italic m-0">{locationLabel}</p>}
                        </div>
                        <div className="text-sm text-gray-500 italic md:mx-4 md:text-right whitespace-nowrap">
                            {event.dates}
                        </div>
                        <div className="flex-shrink-0 mt-2 md:mt-0 flex gap-2">
                            {showRegistration && (
                                <a
                                    className="btn btn-secondary btn-sm"
                                    href={`https://registration.biblequiz.com/#/Registration/${event.id}`}>
                                    <FontAwesomeIcon icon="fas faPenToSquare" />&nbsp;Register
                                </a>
                            )}
                            {showScores && (
                                <a
                                    className="btn btn-primary btn-sm"
                                    href={`/${type}/seasons/${event.season}/${urlSlug}`}>
                                    <FontAwesomeIcon icon="fas faSquarePollVertical" />&nbsp;Scores
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>);
    });

    document.getElementById(badgeId)!.innerText = eventCount.toString();

    return (
        <div className="space-y-4">
                <div>
                    <div>
                        <div className="flex flex-row items-center w-full mb-2">
                            <div className="flex-1 min-w-0 font-semibold ">
                                Event
                            </div>
                            <div className="font-semibold min-w-0 text-right whitespace-nowrap flex-shrink-0" style={{ minWidth: 80 }}>
                                Dates
                            </div>
                        </div>
                        <hr className="my-2 border-t border-gray-300" />
                        {eventRows}
                        {eventCount === 0 && (
                        <div className="text-center italic py-4">
                            No events found matching the current filters.
                        </div>
                        )}
                    </div>
                </div>
        </div>);
}