import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from "@nanostores/react";
import { $eventFilters, EventInfoTypeFilter, type EventFilterConfiguration } from "utils/SharedState";
import FontAwesomeIcon from './FontAwesomeIcon';

import type { RegionInfo, DistrictInfo } from 'types/RegionAndDistricts';
import { DataTypeHelpers } from 'utils/DataTypeHelpers.ts';
import type { EventInfo } from 'types/EventTypes';
import EventListFiltersDefaultDialog, { getDefaultRegionAndDistrict, type DefaultRegionAndDistrict } from './EventListFiltersDefaultDialog';

interface Props {
  regions: RegionInfo[];
  districts: DistrictInfo[];
  seasons?: number[];
  allowTypeFilter?: boolean;
  hideScopeLabel?: boolean;
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
 * @param urlSlug The URL slug of the event.
 * @param event The event to check against the filter.
 * @param type The type of the event.
 * @param includeHidden Whether to include hidden events in the match check.
 *
 * @returns True if the event matches the filter; otherwise, false.
 */
export function matchesFilter(
  filter: EventFilterConfiguration,
  urlSlug: string,
  event: EventInfo,
  type: string,
  includeHidden?: boolean): boolean {

  if (!event.isVisible && !includeHidden) {
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

  if (filter.urlPrefix && !urlSlug.toLowerCase().startsWith(filter.urlPrefix)) {
    return false;
  }

  switch (filter.infoTypeFilter) {
    case EventInfoTypeFilter.None:
      break;
    case EventInfoTypeFilter.EventsOnly:
      if (event.isReport) {
        return false;
      }

      break;
    case EventInfoTypeFilter.ReportsOnly:
      if (!event.isReport) {
        return false;
      }

      break;
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

const getKeyFromLocation = (location?: DefaultRegionAndDistrict): string | undefined => {
  if (location?.districtId) {
    return `${location.regionId}_${location.districtId}`;
  }
  else if (location?.regionId) {
    return location.regionId;
  }
  else {
    return undefined;
  }
}

export default function EventListFilters({
  regions,
  districts,
  allowTypeFilter,
  seasons,
  hideScopeLabel = false }: Props) {

  const currentEventFilters = useStore($eventFilters);

  const [searchText, setSearchText] = useState<string | undefined>(currentEventFilters?.searchText);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(currentEventFilters?.typeFilter);
  const [scope, setScope] = useState<string | undefined>(() => getKeyFromLocation({
    regionId: currentEventFilters?.regionId,
    districtId: currentEventFilters?.districtId
  }));
  const [typeFilterOverride, setTypeFilterOverride] = useState<string | undefined>(currentEventFilters?.typeFilterOverride);
  const [urlPrefix, setUrlPrefix] = useState<string | undefined>(currentEventFilters?.urlPrefix);
  const [season, setSeason] = useState<number | undefined>(seasons ? (currentEventFilters?.season ?? seasons[1]) : undefined);
  const [infoTypeFilter, setInfoTypeFilter] = useState<EventInfoTypeFilter>(currentEventFilters?.infoTypeFilter ?? EventInfoTypeFilter.None);
  const [showDefaultDialog, setShowDefaultDialog] = useState<boolean>(() => !getDefaultRegionAndDistrict());

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
        setTypeFilterOverride(newTypeFilterOverride);
        setUrlPrefix(deserialized.urlPrefix);
        setInfoTypeFilter(deserialized.infoTypeFilter ?? EventInfoTypeFilter.None);

        // NOTE: Season is intentionally excluded from being persisted as it is only
        //       used on the All Events page.
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
    const newSeason = DataTypeHelpers.isNullOrEmpty(selectedValue)
      ? undefined
      : parseInt(selectedValue);

    setSeason(newSeason);

    setSharedStateAndPersist({
      ...currentEventFilters,
      season: newSeason
    });
  };

  const handleUrlPrefixChanged = (e: React.ChangeEvent<HTMLSelectElement>) => {

    const selectedValue = e.target.value;
    const newFilter = DataTypeHelpers.isNullOrEmpty(selectedValue)
      ? undefined
      : selectedValue.toLowerCase();

    setUrlPrefix(newFilter);

    setSharedStateAndPersist({
      ...currentEventFilters,
      urlPrefix: newFilter
    });
  };

  const handleInfoTypeChanged = (e: React.ChangeEvent<HTMLSelectElement>) => {

    const selectedValue = e.target.value;
    const newFilter = DataTypeHelpers.isNullOrEmpty(selectedValue)
      ? EventInfoTypeFilter.None
      : EventInfoTypeFilter[selectedValue as keyof typeof EventInfoTypeFilter];

    setInfoTypeFilter(newFilter);

    setSharedStateAndPersist({
      ...currentEventFilters,
      infoTypeFilter: newFilter
    });
  };

  const hasDefaultFilters = useMemo(() => {
    return getKeyFromLocation(getDefaultRegionAndDistrict()) === scope;
  }, [scope]);

  const handleClearFilters = () => {
    setSearchText(undefined);
    setTypeFilter(undefined);
    setUrlPrefix(undefined);
    setInfoTypeFilter(EventInfoTypeFilter.None);
    setSeason(seasons ? seasons[1] : undefined);

    const defaultLocation = getDefaultRegionAndDistrict();
    setScope(getKeyFromLocation(defaultLocation));

    setSharedStateAndPersist({
      isLoaded: true,
      searchText: undefined,
      regionId: defaultLocation?.regionId,
      districtId: defaultLocation?.districtId,
      typeFilter: undefined,
      urlPrefix: undefined,
      infoTypeFilter: EventInfoTypeFilter.None,
    } as EventFilterConfiguration);
  };

  const hasFilters = (searchText || !hasDefaultFilters || typeFilter || !!urlPrefix || (seasons && season != seasons[1]) || infoTypeFilter !== EventInfoTypeFilter.None);

  return (
    <>
      <fieldset className="fieldset bg-base-100 border-base-300 rounded-box border p-2 pt-0">
        <legend className="fieldset-legend ml-2">
          <FontAwesomeIcon icon="fas faSearch" />
          Filter Events
        </legend>
        <div className="flex flex-wrap gap-2 mt-0 mb-0">
          <label className="input input-sm mt-0 max-w-2xl">
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
          <div className={`flex items-center gap-2 rounded-box border border-neutral-color p-0 ${hideScopeLabel ? "pl-0" : "pl-2"} mb-0 mt-0`}>
            {!hideScopeLabel && "Teams in"}
            <select
              className="select select-sm mt-0 w-auto"
              onChange={handleScopeChanged}
              value={scope ?? ""}>
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
          {!typeFilterOverride && allowTypeFilter && (
            <select
              className="select select-sm mt-0 w-auto"
              onChange={handleTypeChanged}
              value={typeFilter ?? ""}>
              <option value="">
                JBQ &amp; TBQ
              </option>
              <option value="jbq">JBQ Only</option>
              <option value="tbq">TBQ Only</option>
            </select>)}
          {seasons && (
            <select
              className="select select-sm mt-0 w-auto"
              onChange={handleSeasonChanged}
              value={season ?? ""}>
              {seasons.map(seasonOption => (
                <option key={`season-${seasonOption}`} value={seasonOption}>
                  {seasonOption}
                </option>
              ))}
            </select>)}
          <select
            className="select select-sm mt-0 w-auto"
            onChange={handleUrlPrefixChanged}
            value={urlPrefix ?? ""}>
            <option value="">
              All
            </option>
            <option value="nationals/">Nationals</option>
            <option value="regionals/">Regionals</option>
            <option value="districts/">Districts</option>
            <option value="tournaments/">Tournaments</option>
            <option value="other/">Local</option>
          </select>
          <select
            className="select select-sm mt-0 w-auto"
            onChange={handleInfoTypeChanged}
            value={infoTypeFilter ?? ""}>
            <option value={EventInfoTypeFilter.None}>
              Events & Reports
            </option>
            <option value={EventInfoTypeFilter.EventsOnly}>Events Only</option>
            <option value={EventInfoTypeFilter.ReportsOnly}>Reports Only</option>
          </select>
          {!hasFilters && (
            <div className="mt-0">
              <button
                type="button"
                className="btn btn-sm btn-outline mt-0"
                onClick={() => setShowDefaultDialog(true)}>
                <FontAwesomeIcon icon={`fas faHouse`} />
                Set Default Location
              </button>
            </div>
          )}
          {hasFilters && (
            <div className="mt-0">
              <button
                type="button"
                className="btn btn-sm btn-outline mt-0"
                onClick={handleClearFilters}>
                <FontAwesomeIcon icon={`fas faFilterCircleXmark`} />
                Reset Search Filters
              </button>
            </div>)}
        </div>
      </fieldset>
      {showDefaultDialog && (
        <EventListFiltersDefaultDialog
          regions={regions}
          districts={districts}
          onClose={newLocation => {
            setShowDefaultDialog(false);

            if (newLocation) {
              setScope(getKeyFromLocation(newLocation));

              setSharedStateAndPersist({
                ...currentEventFilters,
                regionId: newLocation.regionId,
                districtId: newLocation.districtId,
              });
            }
          }} />)
      }
    </>);
}