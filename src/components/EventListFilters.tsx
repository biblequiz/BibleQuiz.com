import React, { useEffect, useState } from 'react';
import { useStore } from "@nanostores/react";
import { $eventFilters, type EventFilterConfiguration } from "utils/SharedState";
import EventScopeBadge from './EventScopeBadge.tsx';
import FontAwesomeIcon from './FontAwesomeIcon';

import type { RegionInfo, DistrictInfo } from 'types/RegionAndDistricts';
import FilterDropdownButton from './FilterDropdownButton.tsx';
import { DataTypeHelpers } from 'utils/DataTypeHelpers.ts';
import { set } from 'date-fns';

interface Props {
  regions: RegionInfo[];
  districts: DistrictInfo[];
}

const FILTERS_STORAGE_KEY = "event-list-filters--";

interface ScopeAndLabel {
  scope: string;
  label: string;
}

export default function EventListFilters({ regions, districts }: Props) {

  const currentEventFilters = useStore($eventFilters);

  const [scope, setScope] = useState<ScopeAndLabel | undefined>();

  useEffect(() => {
    if (!currentEventFilters.isLoaded) {

      // Read the serialized instance.
      const serialized = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (serialized) {
        const deserialized = JSON.parse(serialized) as EventFilterConfiguration;
        if (deserialized) {
          $eventFilters.set(deserialized);

          // Set the scope data based on the loaded filters.
          if (deserialized.districtId) {
            const { regionId, districtId } = deserialized;
            setScope({
              scope: `${regionId}_${districtId}`,
              label: districts.find(d => d.id == districtId)?.name ?? "District"
            });
          }
          else if (deserialized.regionId) {
            const regionId = deserialized.regionId;
            setScope({
              scope: regionId,
              label: regions.find(r => r.id == regionId)?.name ?? "Region"
            });
          }
          else {
            setScope(undefined);
          }
        }
      }

      // Mark the in-memory state as loaded.
      $eventFilters.setKey("isLoaded", true);

      // Listen for changes to the filter state and persist them.
      $eventFilters.listen(
        newFilters => {
          const serialized = JSON.stringify(newFilters);
          localStorage.setItem(FILTERS_STORAGE_KEY, serialized);
        });
    }
  }, []);

  const handleScopeChanged = (e: React.ChangeEvent<HTMLSelectElement>) => {

    const selectedValue = e.target.value;

    let newRegionId: string | undefined = undefined;
    let newDistrictId: string | undefined = undefined;
    if (selectedValue) {
      const parts: string[] = selectedValue.split('_');
      if (parts.length > 0) {
        newRegionId = parts[0];
      }

      if (parts.length > 1) {
        newDistrictId = parts[1];
      }
    }
    
    const newScope = newRegionId || newDistrictId
      ? { scope: selectedValue, label: e.target.options[e.target.selectedIndex].text }
      : undefined;

    setScope(newScope);

    $eventFilters.set({
      ...currentEventFilters,
      regionId: newRegionId,
      districtId: newDistrictId,
    });
  };

  const handleTypeChanged = (e: React.ChangeEvent<HTMLSelectElement>) => {

    const selectedValue = e.target.value;
    const newTypeFilter = DataTypeHelpers.isNullOrEmpty(selectedValue)
      ? undefined
      : selectedValue.toLowerCase() as "jbq" | "tbq";

    $eventFilters.set({
      ...currentEventFilters,
      typeFilter: newTypeFilter
    });
  };

  const handleClearFilters = (e: React.MouseEvent<HTMLButtonElement>) => {
    setScope(undefined);
    $eventFilters.set({
      isLoaded: true
    } as EventFilterConfiguration);
  };

  const { searchText, typeFilter } = currentEventFilters;

  return (
    <fieldset className="fieldset bg-base-100 border-base-300 rounded-box border p-4 pb-2 pt-0">
      <legend className="fieldset-legend">Event Search Criteria</legend>
      <div className="mt-2">
        <label className="input w-lg mt-0">
          <FontAwesomeIcon icon="fas faSearch" classNames={["h-[1em]", "opacity-50"]} />
          <input
            type="text"
            className="grow"
            placeholder="Name or Location"
            value={searchText}
            onChange={e => {
              const currentValue = e.target.value;
              const newText = DataTypeHelpers.isNullOrEmpty(currentValue)
                ? undefined
                : currentValue;
              $eventFilters.setKey("searchText", newText);
            }} />
          {(searchText?.length ?? 0) > 0 && (
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => $eventFilters.setKey("searchText", undefined)}>
              <FontAwesomeIcon icon="fas faCircleXmark" />
            </button>)}
        </label>
      </div>
      <div className="flex flex-wrap gap-2 mt-0 mb-0">
        <FilterDropdownButton
          id="event-list-filters-who"
          label={`Who: Teams in ${scope?.label ?? "All Districts"}`}
          buttons={false}
        >
          <div>
            <span>Display Teams in any of these:</span>
            <div className="form-control">
              <select
                className="select select-sm"
                onChange={handleScopeChanged}
                value={scope?.scope}>
                <option value="">
                  All Districts
                </option>
                <option value="" disabled>
                  ----------------------
                </option>
                {regions.map((region) => (
                  <option key={`reg_${region.id}`} value={region.id}>
                    {region.name} Region
                  </option>
                ))}
                <option value="" disabled>
                  ----------------------
                </option>
                {districts.map((district) => (
                  <option key={`dis_${district.id}`} value={`${district.regionId}_${district.id}`}>
                    {district.name} District
                  </option>
                ))}
              </select>
            </div>
          </div>
        </FilterDropdownButton>
        <FilterDropdownButton
          id="event-list-filters-what"
          label={`What: ${typeFilter ? `${typeFilter.toUpperCase()} Events Only` : "JBQ or TBQ Events"}`}
          buttons={false}
        >
          <div>
            <div className="form-control">
              <select
                className="select select-sm"
                onChange={handleTypeChanged}
                value={typeFilter}>
                <option value="">
                  JBQ and TBQ Events
                </option>
                <option value="jbq">JBQ Events Only</option>
                <option value="tbq">TBQ Events Only</option>
              </select>
            </div>
          </div>
        </FilterDropdownButton>
        {(searchText || scope || typeFilter) && (
          <button
            type="button"
            className="btn btn-sm btn-outline mt-2"
            onClick={handleClearFilters}>
            <FontAwesomeIcon icon={`fas faFilterCircleXmark`} />
            Clear Filters
          </button>)}
      </div>
    </fieldset>);
}