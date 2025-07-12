import { useStore } from "@nanostores/react";
import EventScopeBadge from './EventScopeBadge.tsx';
import { sharedEventListFilter, type EventListFilterConfiguration } from "../utils/SharedState.ts";
import type { EventInfo, EventList } from '../types/EventTypes.ts';

interface Props {
    badgeId: string;
    events: EventList;
    type: string;
}

export default function EventListTabContent({ badgeId, events, type }: Props) {

    const eventFilters: EventListFilterConfiguration = useStore(sharedEventListFilter as any);

    const today: Date = new Date();
    today.setHours(0, 0, 0, 0);

    let eventCount: number = 0;
    const eventRows = Object.keys(events).map((urlSlug: string, index: number) => {
        const event: EventInfo = events[urlSlug];
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

        eventCount++;

        let isRegistrationOpen: boolean = false;
        let registrationButtonText: string | null = null;
        if (event.registrationEndDate &&
            Date.parse(event.registrationEndDate) >= today.getTime()) {
            isRegistrationOpen = true;
            registrationButtonText = `Register until ${event.registrationDates}`;
        }

        let isPastEvent: boolean = false;
        if (event.endDate &&
            Date.parse(event.endDate) < today.getTime()) {
            isPastEvent = true;
        }
        else {
            registrationButtonText = "View Event Info";
        }

        const registrationLink: string | null = registrationButtonText
            ? `https://registration.biblequiz.com/#/Registration/${event.id}`
            : null;

        let isLiveEvent: boolean = false;
        if (!isPastEvent && event.startDate &&
            Date.parse(event.startDate) <= today.getTime()) {
            isLiveEvent = true;
        }

        const statsLink: string | null = isLiveEvent
            ? `/${type}/seasons/${event.season}/${urlSlug}`
            : null;

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
            <tr key={`eventrow_${event.id}`}>
                <td>
                    <EventScopeBadge scope={event.scope} label={event.scopeLabel ?? ""} />
                </td>
                <td>
                    <h2 className="text-xl font-bold">{event.name}</h2>
                    {locationLabel && <span className="text-gray-500 italic">{locationLabel}</span>}
                </td>
                <td>
                    {registrationLink &&
                        <a
                            className="btn btn-secondary btn-block no-underline mb-4"
                            href={registrationLink}>
                            {registrationButtonText}
                        </a>}
                    {!registrationLink && (<span className="italic">Closed</span>)}
                </td>
                <td>{event.dates}</td>
                <td>
                    {statsLink &&
                        <a
                            className="btn btn-primary btn-block no-underline mb-4"
                            href={statsLink}>
                            <b><i>Live</i></b> Schedule & Scores
                        </a>}
                    {isPastEvent &&
                        <a className="btn btn-info btn-block no-underline mb-4" href={`/${type}/seasons/${event.season}/${url}`}>
                            Scores & Stats
                        </a>}
                </td>
            </tr>);
    });

    document.getElementById(badgeId)!.innerText = eventCount.toString();

    return (
        <table className="table table-s table-nowrap">
            <thead>
                <tr>
                    <th>Area</th>
                    <th>Event</th>
                    <th>Registration</th>
                    <th>Date(s)</th>
                    <th>&nbsp;</th>
                </tr>
            </thead>
            <tbody>
                {eventRows}
            </tbody>
        </table>);
}