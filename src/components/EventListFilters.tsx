import React from 'react';
import { useStore } from "@nanostores/react";
import { sharedEventListFilter, type EventListFilterConfiguration } from "@utils/SharedState";
import EventScopeBadge from './EventScopeBadge.tsx';
import FontAwesomeIcon from './FontAwesomeIcon';

import type { RegionInfo, DistrictInfo } from "../types/RegionAndDistricts";

interface Props {
  regions: RegionInfo[];
  districts: DistrictInfo[];
}

export default function EventListFilters({ regions, districts }: Props) {

  const eventFilters: EventListFilterConfiguration = useStore(sharedEventListFilter as any);

  const handleSearchTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    sharedEventListFilter.set({
      searchText: e.target.value ?? null,

      showNation: eventFilters?.showNation ?? true,
      showRegion: eventFilters?.showRegion ?? true,
      showDistrict: eventFilters?.showDistrict ?? true,

      regionId: eventFilters?.regionId ?? null,
      districtId: eventFilters?.districtId ?? null,
    });
  };

  const clearSearchText = (e: React.MouseEvent<HTMLButtonElement>) => {

    sharedEventListFilter.set({
      searchText: null,

      showNation: eventFilters?.showNation ?? true,
      showRegion: eventFilters?.showRegion ?? true,
      showDistrict: eventFilters?.showDistrict ?? true,

      regionId: eventFilters?.regionId ?? null,
      districtId: eventFilters?.districtId ?? null,
    });
  };

  const handleRegionOrDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {

    const selectedValue = e.target.value;

    let regionId: string | null = null;
    let districtId: string | null = null;
    if (selectedValue) {
      const parts: string[] = selectedValue.split('_');
      if (parts.length > 0) {
        regionId = parts[0];
      }

      if (parts.length > 1) {
        districtId = parts[1];
      }
    }

    sharedEventListFilter.set({
      searchText: eventFilters?.searchText ?? null,

      showNation: eventFilters?.showNation ?? true,
      showRegion: eventFilters?.showRegion ?? true,
      showDistrict: eventFilters?.showDistrict ?? true,

      regionId: regionId,
      districtId: districtId,
    });
  };

  const handleScopeChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    const isChecked = e.target.checked;
    const checkedValue = e.target.value;

    sharedEventListFilter.set({
      searchText: eventFilters?.searchText ?? null,

      showNation: checkedValue == "nation" ? isChecked : (eventFilters?.showNation ?? true),
      showRegion: checkedValue == "region" ? isChecked : (eventFilters?.showRegion ?? true),
      showDistrict: checkedValue == "district" ? isChecked : (eventFilters?.showDistrict ?? true),

      regionId: eventFilters?.regionId ?? null,
      districtId: eventFilters?.districtId ?? null,
    });
  };

  let selectedScope: string;
  if (eventFilters?.districtId) {
    selectedScope = `${eventFilters.regionId}_${eventFilters.districtId}`;
  }
  else if (eventFilters?.regionId) {
    selectedScope = eventFilters.regionId;
  }
  else {
    selectedScope = "";
  }

  return (
    <fieldset className="fieldset bg-base-100 border-base-300 rounded-box border p-4 pt-0">
      <legend className="fieldset-legend">Event Search Criteria</legend>
      <div>
        <label className="input w-lg mt-0">
          <FontAwesomeIcon icon="fas faSearch" classNames={["h-[1em]", "opacity-50"]} />
          <input
            type="text"
            className="grow"
            placeholder="Name or Location"
            value={eventFilters?.searchText ?? ""}
            onChange={handleSearchTextChange} />
          {eventFilters?.searchText && eventFilters.searchText.length > 0 && (
            <button className="btn btn-ghost btn-xs" onClick={clearSearchText}>
              <FontAwesomeIcon icon="fas faCircleXmark" />
            </button>)}
        </label>
      </div>
      <div>
        <label className="select">
          <span className="label">Scope</span>
          <select onChange={handleRegionOrDistrictChange} defaultValue={selectedScope}>
            <option value="">
              Any Region or District
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
        </label>
        <label className="ml-2">
          <input
            type="checkbox"
            checked={!eventFilters || eventFilters.showDistrict}
            className="checkbox checkbox-m"
            name="filterScope"
            value="district"
            onChange={handleScopeChange}
          />&nbsp;<EventScopeBadge scope="district" />
        </label>
        <label className="ml-2">
          <input
            type="checkbox"
            checked={!eventFilters || eventFilters.showRegion}
            className="checkbox checkbox-m"
            name="filterScope"
            value="region"
            onChange={handleScopeChange}
          />&nbsp;<EventScopeBadge scope="region" />
        </label>
        <label className="ml-2">
          <input
            type="checkbox"
            checked={!eventFilters || eventFilters.showNation}
            className="checkbox checkbox-m"
            name="filterScope"
            value="nation"
            onChange={handleScopeChange}
          />&nbsp;<EventScopeBadge scope="nation" />
        </label>
      </div>
    </fieldset>);
}