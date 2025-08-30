import { useStore } from "@nanostores/react";
import EventScopeBadge from './EventScopeBadge.tsx';
import { sharedEventListFilter, type EventListFilterConfiguration } from 'utils/SharedState.ts';
import type { EventInfo, EventList } from 'types/EventTypes.ts';
import FontAwesomeIcon from './FontAwesomeIcon.js';

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
    const eventRows = Object.keys(events).map((urlSlug: string, index: number) => {
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
            Date.parse(event.registrationEndDate) >= today.getTime()) {
            showRegistration = true;
        }

        let isPastEvent: boolean = false;
        let showScores: boolean = false;
        if (event.endDate) {
            const parsedDate = Date.parse(event.endDate);
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
            <tr key={`eventrow_${event.id}`}>
                <td>
                    <EventScopeBadge scope={event.scope} label={event.scopeLabel ?? ""} />
                    <div className="m-0 flex">
                        {isLiveEvent && <div className="badge badge-primary mr-2">LIVE</div>}
                        <p className="text-lg font-bold m-0">{event.name}</p>
                    </div>
                    {locationLabel && <p className="text-gray-500 italic m-0">{locationLabel}</p>}
                </td>
                <td className="text-right">{event.dates}</td>
                <td className="text-right">
                    {showRegistration &&
                        <a
                            className="btn btn-secondary btn-sm mr-2"
                            href={`https://registration.biblequiz.com/#/Registration/${event.id}`}>
                            <FontAwesomeIcon icon="fas faPenToSquare" />&nbsp;Register
                        </a>}
                    {showScores && (
                        <a
                            className="btn btn-primary btn-sm m-0"
                            href={`/${type}/seasons/${event.season}/${urlSlug}`}>
                            <FontAwesomeIcon icon="fas faSquarePollVertical" />&nbsp;Scores
                        </a>)}
                </td>
            </tr>);
    });

    document.getElementById(badgeId)!.innerText = eventCount.toString();

    return (
        <table className="table table-s table-nowrap">
            <thead>
                <tr>
                    <th>Event</th>
                    <th className="text-right">Date(s)</th>
                    <th>&nbsp;</th>
                </tr>
            </thead>
            <tbody>
                {eventRows}
                {eventCount === 0 && (
                    <tr>
                        <td colSpan={3} className="text-center italic">
                            No events found matching the current filters.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>);
}