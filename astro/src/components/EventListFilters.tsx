import React from 'react';
import { useStore } from "@nanostores/react";
import type { EventListFilterConfiguration } from "../utils/SharedState";
import { sharedEventListFilter } from "@utils/SharedState";
import EventScopeBadge from './EventScopeBadge.tsx';

import type { RegionInfo, DistrictInfo } from "../types/RegionAndDistricts";

interface Props {
  regions: RegionInfo[];
  districts: DistrictInfo[];
}

export default function EventListFilters({ regions, districts }: Props) {

  const eventFilters: EventListFilterConfiguration = useStore(sharedEventListFilter as any);

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
      searchText: sharedEventListFilter?.searchText ?? null,
      showNation: sharedEventListFilter?.showNation ?? true,
      showRegion: sharedEventListFilter?.showRegion ?? true,
      showDistrict: sharedEventListFilter?.showDistrict ?? true,

      regionId: regionId,
      districtId: districtId,

      selectedTab: sharedEventListFilter?.selectedTab ?? null
    });
  };

  const handleScopeChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    const isChecked = e.target.checked;
    const checkedValue = e.target.value;

    sharedEventListFilter.set({
      searchText: sharedEventListFilter?.searchText ?? null,
      showNation: checkedValue == "nation" ? isChecked : (sharedEventListFilter?.showNation ?? true),
      showRegion: checkedValue == "region" ? isChecked : (sharedEventListFilter?.showRegion ?? true),
      showDistrict: checkedValue == "district" ? isChecked : (sharedEventListFilter?.showDistrict ?? true),

      regionId: sharedEventListFilter?.regionId ?? null,
      districtId: sharedEventListFilter?.districtId ?? null,

      selectedTab: sharedEventListFilter?.selectedTab ?? null
    });
  };

  return (
    <fieldset className="fieldset bg-base-100 border-base-300 rounded-box border p-4 pt-0">
      <legend className="fieldset-legend">Event Search Criteria</legend>
      <div>
        <label className="select">
          <span className="label">Filter</span>
          <select onChange={handleRegionOrDistrictChange}>
            <option value="" selected={!eventFilters || (!eventFilters.regionId && !eventFilters.districtId)}>
              Any Region or District
            </option>
            <option value="" disabled>
              ----------------------
            </option>
            {regions.map((region) => (
              <option key={`reg_${region.id}`} value={region.id} selected={eventFilters?.regionId == region.id}>
                {region.name} Region
              </option>
            ))}
            <option value="" disabled>
              ----------------------
            </option>
            {districts.map((district) => (
              <option key={`dis_${district.id}`} value={`${district.regionId}_${district.id}`} selected={eventFilters?.districtId == district.id}>
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