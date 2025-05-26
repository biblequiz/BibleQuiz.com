import React from 'react';

interface EventFilterOptions {
    showNation: boolean;
    showRegion: boolean;
    showDistrict: boolean;

    regionId: string | null;
    districtId: string | null;

    competitionType: string | null;
};

interface EventFiltersProps {
    filters: EventFilterOptions;
    setFilters: React.Dispatch<React.SetStateAction<EventFilterOptions>>;
}

export default function EventListTable({ filters, setFilters }: EventFiltersProps) {

    const handleTypeFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters((prev: any) => ({ ...prev, competitionType: e.target.value }));
    };

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
                <div class="tab-content border-base-300 bg-base-100 p-10">Tab content 1</div>

                <input
                    type="radio"
                    name="competitionType_filter"
                    value="tbq"
                    class="tab"
                    aria-label="Teen Bible Quiz (TBQ)"
                    onChange={handleTypeFilter}
                    defaultChecked={filters.competitionType == "tbq"} />
                <div class="tab-content border-base-300 bg-base-100 p-10">Tab content 2</div>
            </div>
            <p>Region: {filters.regionId}</p>
            <p>District: {filters.districtId}</p>
            <p>Include Nation: {filters.showNation.toString()}</p>
            <p>Include Region: {filters.showRegion.toString()}</p>
            <p>Include District: {filters.showDistrict.toString()}</p>
        </div >
    );
}