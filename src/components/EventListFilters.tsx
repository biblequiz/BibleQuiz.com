import React, { useEffect, useState } from 'react';
import { useStore } from "@nanostores/react";
import { $eventFilters, type EventFilterConfiguration } from "utils/SharedState";
import FontAwesomeIcon from './FontAwesomeIcon';

import type { RegionInfo, DistrictInfo } from 'types/RegionAndDistricts';
import { DataTypeHelpers } from 'utils/DataTypeHelpers.ts';
import type { EventInfo } from 'types/EventTypes';

interface Props {
  regions: RegionInfo[];
  districts: DistrictInfo[];
  seasons?: number[];
  allowTypeFilter?: boolean;
}

const FILTERS_STORAGE_KEY = "event-list-filters--";

const setSharedStateAndPersist = (newFilters: EventFilterConfiguration) => {
  $eventFilters.set(newFilters);

  const serialized = JSON.stringify(newFilters);
  localStorage.setItem(FILTERS_STORAGE_KEY, serialized);
};

/**
 * Determines whether the given event matches the provided filter configuration.
 *
 * @param filter The filter configuration to apply.
 * @param event The event to check against the filter.
 * @returns True if the event matches the filter; otherwise, false.
 */
export function matchesFilter(filter: EventFilterConfiguration, event: EventInfo, type: string): boolean {
  if (!event.isVisible) {
    return false;
  }
  else if (!filter) {
    return true;
  }

  const requireType = filter.typeFilterOverride ?? filter.typeFilter;
  if (requireType && requireType !== type) {
    return false;
  }

  if (filter.searchText) {
    const searchText = filter.searchText.toLocaleLowerCase();
    if (!event.name.toLocaleLowerCase().includes(searchText) &&
      !event.locationName?.toLocaleLowerCase().includes(searchText) &&
      !event.locationCity?.toLocaleLowerCase().includes(searchText)) {
      return false;
    }
  }

  switch (event.scope) {
    case "region":
      if (filter.regionId && filter.regionId != event.regionId) {
        return false; // Region-level events must match the selected region since the filter includes one.
      }
      break;
    case "district":
      if (
        (filter.regionId && filter.regionId != event.regionId) ||
        (filter.districtId && filter.districtId != event.districtId)) {

        // District-level events must match the selected district OR be part of the selected
        // region.
        return false;
      }
      break;
  }

  return true;
}

export default function EventListFilters({ regions, districts, seasons, allowTypeFilter }: Props) {

  const currentEventFilters = useStore($eventFilters);

  const [searchText, setSearchText] = useState<string | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [scope, setScope] = useState<string | undefined>(undefined);
  const [seasonFilter, setSeasonFilter] = useState<number | undefined>(seasons ? seasons[1] : undefined);
  const [typeFilterOverride, setTypeFilterOverride] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!currentEventFilters.isLoaded) {

      // Read the serialized instance.
      const serialized = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (serialized) {
        const deserialized = JSON.parse(serialized) as EventFilterConfiguration ?? {};

        // Determine if there is an override specified in the URL.
        let newTypeFilterOverride: "jbq" | "tbq" | undefined = undefined;
        const urlParameters = new URLSearchParams(
          window.location.search,
        );
        const selectTypeFromUrl = urlParameters.get("type");
        if (selectTypeFromUrl && allowTypeFilter) {
          switch (selectTypeFromUrl.toLowerCase()) {
            case "jbq":
              newTypeFilterOverride = "jbq";
              break;
            case "tbq":
              newTypeFilterOverride = "tbq";
              break;
          }
        }

        // Always apply the current URL.
        deserialized.typeFilterOverride = newTypeFilterOverride;

        // Update the filters from the deserialized state.
        $eventFilters.set(deserialized);

        // Set the values from the deserialized instance.
        setSearchText(deserialized.searchText);
        setTypeFilter(deserialized.typeFilter);
        setSeasonFilter(deserialized.season);
        setTypeFilterOverride(newTypeFilterOverride);

        if (deserialized.districtId) {
          const { regionId, districtId } = deserialized;
          setScope(`${regionId}_${districtId}`);
        }
        else if (deserialized.regionId) {
          const regionId = deserialized.regionId;
          setScope(regionId);
        }
        else {
          setScope(undefined);
        }
      }
      else {
        $eventFilters.set({ isLoaded: true } as EventFilterConfiguration);
      }
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

    setScope(DataTypeHelpers.isNullOrEmpty(selectedValue) ? undefined : selectedValue);

    setSharedStateAndPersist({
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

    setTypeFilter(newTypeFilter);

    setSharedStateAndPersist({
      ...currentEventFilters,
      typeFilter: newTypeFilter
    });
  };

  const handleSeasonChanged = (e: React.ChangeEvent<HTMLSelectElement>) => {

    const selectedValue = e.target.value;
    const newSeasonFilter = DataTypeHelpers.isNullOrEmpty(selectedValue)
      ? undefined
      : parseInt(selectedValue);

    setSeasonFilter(newSeasonFilter);

    setSharedStateAndPersist({
      ...currentEventFilters,
      season: newSeasonFilter
    });
  };

  const handleClearFilters = () => {
    setSearchText(undefined);
    setTypeFilter(undefined);
    setScope(undefined);
    setSeasonFilter(seasons ? seasons[1] : undefined);
    setSharedStateAndPersist({
      isLoaded: true,
      searchText: undefined,
      regionId: undefined,
      districtId: undefined,
      typeFilter: undefined,
      season: seasons ? seasons[1] : undefined,
    } as EventFilterConfiguration);
  };

  const hasFilters = (searchText || scope || typeFilter || (seasons && seasonFilter != seasons[1]));

  return (
    <fieldset className="fieldset bg-base-100 border-base-300 rounded-box border p-2 pt-0">
      <legend className="fieldset-legend ml-2">
        <FontAwesomeIcon icon="fas faSearch" />
        Filter Events
      </legend>
      <div className="w-full mt-0">
        <label className="input input-sm mt-0 w-full max-w-2xl">
          <FontAwesomeIcon icon="fas faSearch" classNames={["h-[1em]", "opacity-50"]} />
          <input
            type="text"
            className="grow"
            placeholder="Name or Location"
            value={searchText ?? ""}
            onChange={e => {
              const currentValue = e.target.value;
              const newText = DataTypeHelpers.isNullOrEmpty(currentValue)
                ? undefined
                : currentValue;
              setSearchText(newText);
              setSharedStateAndPersist({
                ...currentEventFilters,
                searchText: newText
              });
            }} />
          {(searchText?.length ?? 0) > 0 && (
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => {
                setSearchText(undefined);
                setSharedStateAndPersist({
                  ...currentEventFilters,
                  searchText: undefined
                });
              }}>
              <FontAwesomeIcon icon="fas faCircleXmark" />
            </button>)}
        </label>
      </div>
      <div className="flex flex-wrap gap-2 mt-0 mb-0">
        <select
          className="select select-sm mt-0 w-auto"
          onChange={handleScopeChanged}
          value={scope ?? ""}>
          <option value="">
            Teams in All Districts
          </option>
          <option value="" disabled>
            ----------------------
          </option>
          {regions.map((region) => (
            <option key={`reg_${region.id}`} value={region.id}>
              Teams in {region.name} Region
            </option>
          ))}
          <option value="" disabled>
            ----------------------
          </option>
          {districts.map((district) => (
            <option key={`dis_${district.id}`} value={`${district.regionId}_${district.id}`}>
              Teams in {district.name} District
            </option>
          ))}
        </select>
        {!typeFilterOverride && allowTypeFilter && (
          <select
            className="select select-sm mt-0 w-auto"
            onChange={handleTypeChanged}
            value={typeFilter ?? ""}>
            <option value="">
              JBQ and TBQ Events
            </option>
            <option value="jbq">JBQ Events Only</option>
            <option value="tbq">TBQ Events Only</option>
          </select>)}
        {seasons && (
          <select
            className="select select-sm mt-0 w-auto"
            onChange={handleSeasonChanged}
            value={seasonFilter ?? ""}>
            {seasons.map((season) => (
              <option key={`season_${season}`} value={season}>
                {season} Season
              </option>
            ))}
          </select>)}
      </div>
      {hasFilters && (
        <div className="mt-0">
          <button
            type="button"
            className="btn btn-sm btn-outline mt-0"
            onClick={handleClearFilters}>
            <FontAwesomeIcon icon={`fas faFilterCircleXmark`} />
            Clear Search Filters
          </button>
        </div>)}
    </fieldset>);
}