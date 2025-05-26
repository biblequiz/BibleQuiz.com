import React, { useState } from 'react';
import EventListFilters from './EventListFilters.tsx';
import EventListTable from './EventListTable.tsx';
//import EventListTable from './EventListTable.tsx';

export default function EventList() {
    const [filters, setFilters] = useState({
        regionId: null,
        districtId: null,

        showNation: true,
        showRegion: true,
        showDistrict: true,
    });

    return (
        <div>
            <EventListFilters filters={filters} setFilters={setFilters} />
            <EventListTable filters={filters} />
        </div>
    );
}