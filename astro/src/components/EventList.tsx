import React, { useState, useEffect } from 'react';
import futureEvents from '../data/generated/futureEvents.json';
import EventListFilters from './EventListFilters.tsx';
import EventListTable from './EventListTable.tsx';

interface EventListProps {
    persistenceKey: string;
};

export default function EventList({ persistenceKey }: EventListProps) {

    const [filters, setFilters] = useState(
        () => {

            const storedFilters: string | null = localStorage.getItem(persistenceKey);
            if (storedFilters) {
                try {
                    return JSON.parse(storedFilters);
                }
                catch {
                    // Ignore the exception and use the default.
                }
            }

            // Default filters if the storage cannot be used.
            return {
                regionId: null,
                districtId: null,

                showNation: true,
                showRegion: true,
                showDistrict: true,
            };
        }
    );

    useEffect(() => {
        localStorage.setItem(persistenceKey, JSON.stringify(filters));
    }, [filters]);

    return (
        <div>
            <EventListFilters filters={filters} setFilters={setFilters} />
            <EventListTable
                filters={filters}
                setFilters={setFilters}
                data={futureEvents} />
        </div>
    );
}