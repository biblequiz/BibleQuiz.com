import React from 'react';
import { useStore } from "@nanostores/react";
import EventScopeBadge from './EventScopeBadge.tsx';
import { sharedEventListFilter, type EventListFilterConfiguration } from "../utils/SharedState";
import type { EventInfo, EventList } from '../types/EventTypes.ts';

export interface EventListTab {
    label: string;
    type: string;
    events: EventList;
};

interface Props {
    tabs: EventListTab[];
}

function getEventCard(today: Date, event: EventInfo, urlSlug: string, type: string) {

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

    return (<div key={`event_${event.id}`} className="card shadow-sm">
        <div className="card-body">
            <EventScopeBadge scope={event.scope} label={event.scopeLabel ?? ""} />
            <div className="mt-0 flex justify-between">
                <h2 className="text-xl font-bold">{event.name}</h2>
            </div>
            <div className="mt-0 flex flex-col gap-2 text-s">
                <span className="text-700 font-bold">{event.dates}</span>
                {locationLabel && <span className="text-gray-500">{locationLabel}</span>}
            </div>
            <div className="mt-4">
                {registrationLink &&
                    <a
                        className="btn btn-secondary btn-block no-underline mb-4"
                        href={registrationLink}>
                        {registrationButtonText}
                    </a>}
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
            </div>
        </div>
    </div >);
}

export default function EventListTabs({ tabs }: Props) {

    const eventFilters: EventListFilterConfiguration = useStore(sharedEventListFilter as any);

    const today: Date = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        <div className="tabs tabs-border tabs-lift">
            {tabs.map((tab, index) => {

                const handleTabChange = (e: React.ChangeEvent<HTMLInputElement>) => {

                    sharedEventListFilter!.set({
                        searchText: eventFilters?.searchText ?? null,
                        showNation: eventFilters?.showNation ?? true,
                        showRegion: eventFilters?.showRegion ?? true,
                        showDistrict: eventFilters?.showDistrict ?? true,

                        regionId: eventFilters?.regionId ?? null,
                        districtId: eventFilters?.districtId ?? null,

                        selectedTab: tab.label
                    });
                };

                const isTabSelected = (!eventFilters && index === 0) ||
                    eventFilters?.selectedTab === tab.label;

                const filteredEventCards = Object.keys(tab.events).map((urlSlug: string) => {

                    const event = tab.events[urlSlug];
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
                                else if (eventFilters.regionId && eventFilters.regionId != eventFilters.regionId) {
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
                                    (eventFilters.regionId && eventFilters.regionId != eventFilters.regionId) ||
                                    (eventFilters.districtId && eventFilters.districtId != eventFilters.districtId)) {

                                    // District-level events must match the selected district OR be part of the selected
                                    // region.
                                    return null;
                                }
                            }
                    }

                    return getEventCard(today, event, urlSlug, tab.type);
                });

                return (
                    <div key={`eventtab_${index}`} className="mt-0">
                        <label className="tab mt-0">
                            <input
                                type="radio"
                                name="event-list"
                                className="tab"
                                onChange={handleTabChange}
                                checked={isTabSelected} />
                            {tab.label}
                            <span className="badge badge-secondary badge-sm ml-2">{filteredEventCards.length}</span>
                        </label>
                        <div className="tab-content border-base-300 bg-base-100">
                            {filteredEventCards.length > 0 && filteredEventCards}
                            {filteredEventCards.length === 0 && (
                                <div className="text-center text-gray-500">
                                    No events match the filters.
                                </div>)}
                        </div>
                    </div>);
            }
            )}
        </div>
    );
}