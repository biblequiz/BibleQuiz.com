import React from 'react';
import EventScopeBadge from './EventScopeBadge.tsx';
import type { EventInfo } from "../types/EventTypes";

interface EventFilterOptions {
    showNation: boolean;
    showRegion: boolean;
    showDistrict: boolean;

    regionId: string | null;
    districtId: string | null;

    competitionType: string | null;
};

interface EventListTableProps {
    filters: EventFilterOptions;
    setFilters: React.Dispatch<React.SetStateAction<EventFilterOptions>>;

    data: { jbq: EventInfo[], tbq: EventInfo[] };
    linkToLiveEvents: boolean;
}

function getEventTableCardGrid(
    today: Date,
    filters: EventFilterOptions,
    items: EventInfo[]) {

    let hasAnyItems: boolean = false;
    let renderedItems: any[] = [];
    if (items) {
        renderedItems = items.map(
            (info: EventInfo) => {
                switch (info.scope) {
                    case "nation":
                        if (!filters.showNation) {
                            return null; // Nation-level events are not shown.
                        }
                        break;
                    case "region":
                        if (!filters.showRegion) {
                            return null; // Region-level events are not shown.
                        }
                        else if (filters.regionId && info.regionId != filters.regionId) {
                            return null; // Region-level events must match the selected region since the filter includes one.
                        }
                        break;
                    case "district":
                        if (!filters.showDistrict) {
                            return null; // District-level events are not shown.
                        }
                        else if (
                            (filters.regionId && info.regionId != filters.regionId) ||
                            (filters.districtId && info.districtId != filters.districtId)) {

                            // District-level events must match the selected district OR be part of the selected
                            // region.
                            return null;
                        }
                }

                hasAnyItems = true;

                let isRegistrationOpen: boolean = false;
                let registrationButtonText: string | null = null;
                if (info.registrationEndDate &&
                    Date.parse(info.registrationEndDate) >= today.getTime()) {
                    isRegistrationOpen = true;
                    registrationButtonText = `Register until ${info.registrationDates}`;
                }

                let isPastEvent: boolean = false;
                if (info.endDate &&
                    Date.parse(info.endDate) < today.getTime()) {
                    isPastEvent = true;
                }
                else {
                    registrationButtonText = "View Event Info";
                }

                const registrationLink: string | null = registrationButtonText
                    ? `https://registration.biblequiz.com/#/Registration/${info.id}`
                    : null;

                let isLiveEvent: boolean = false;
                if (!isPastEvent && info.startDate &&
                    Date.parse(info.startDate) <= today.getTime()) {
                    isLiveEvent = true;
                }

                const statsLink: string | null = isLiveEvent
                    ? `https://biblequiz.com/live-events/?eventId=${info.id}`
                    : null;

                let locationLabel: string | null = null;
                if (info.locationName || info.locationCity) {
                    if (info.locationName && info.locationCity) {
                        locationLabel = `${info.locationName}, ${info.locationCity}`;
                    }
                    else if (info.locationName) {
                        locationLabel = info.locationName;
                    }
                    else {
                        locationLabel = info.locationCity;
                    }
                }

                return (<div className="card shadow-sm">
                    <div className="card-body">
                        <EventScopeBadge scope={info.scope} label={info.scopeLabel ?? ""} />
                        <div className="mt-0 flex justify-between">
                            <h2 className="text-xl font-bold">{info.name}</h2>
                        </div>
                        <div className="mt-0 flex flex-col gap-2 text-s">
                            <span className="text-700 font-bold">{info.dates}</span>
                            {locationLabel && <span className="text-gray-500">{locationLabel}</span>}
                        </div>
                        <div className="mt-4">
                            {registrationButtonText &&
                                <a
                                    className="btn btn-secondary btn-block no-underline mb-4"
                                    href={registrationLink}>
                                    {registrationButtonText}
                                </a>}
                            {isLiveEvent &&
                                <a
                                    className="btn btn-primary btn-block no-underline mb-4"
                                    href={statsLink}>
                                    <b><i>Live</i></b> Schedule & Scores
                                </a>}
                            {isPastEvent &&
                                <a className="btn btn-info btn-block no-underline mb-4">
                                    Scores & Stats
                                </a>}
                        </div>
                    </div>
                </div >);
            });
    }

    if (hasAnyItems) {
        return (<div className="card-grid astro-zntqmydn">
            {renderedItems}
        </div>);
    }
    else {
        return (<div className="text-center text-gray-500">No events match the filters.</div>);
    }
}

export default function EventListTable({ filters, setFilters, data, linkToLiveEvents }: EventListTableProps) {

    const handleTypeFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters((prev: any) => ({ ...prev, competitionType: e.target.value }));
    };

    const today: Date = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        <div>
            <div class="tabs tabs-border">
                <input
                    type="radio"
                    name="competitionType_filter"
                    value="jbq"
                    class="tab"
                    aria-label="Junior Bible Quiz (JBQ)"
                    onChange={handleTypeFilter}
                    defaultChecked={filters.competitionType != "tbq"} />
                <div class="tab-content border-base-300 bg-base-100 p-10">
                    {getEventTableCardGrid(today, filters, data.jbq)}
                </div>

                <input
                    type="radio"
                    name="competitionType_filter"
                    value="tbq"
                    class="tab"
                    aria-label="Teen Bible Quiz (TBQ)"
                    onChange={handleTypeFilter}
                    defaultChecked={filters.competitionType == "tbq"} />
                <div class="tab-content border-base-300 bg-base-100 p-10">
                    {getEventTableCardGrid(today, filters, data.tbq)}
                </div>
            </div>
        </div >
    );
}