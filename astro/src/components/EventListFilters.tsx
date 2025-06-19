import React from 'react';
import regions from '../data/regions.json';
import districts from '../data/districts.json';
import EventScopeBadge from './EventScopeBadge.tsx';

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

export default function EventListFilters({ filters, setFilters }: EventFiltersProps) {

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

    setFilters((prev: any) => ({ ...prev, regionId: regionId, districtId: districtId }));
  };

  const handleScopeChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    const isChecked = e.target.checked;
    const checkedValue = e.target.value;
    const propertyName = `show${checkedValue.charAt(0).toUpperCase()}${checkedValue.substring(1)}`;

    setFilters(
      (prev: any) => {
        const updated = {...prev, foo: 'bar'};
        updated[propertyName] = isChecked;
        return updated;
      });
  };

  const selectedKey = filters.districtId
    ? `${filters.regionId}_${filters.districtId}`
    : (filters.regionId || '');

  return (
    <div>
      <label className="select">
        <span className="label">Filter</span>
        <select defaultValue={selectedKey} onChange={handleRegionOrDistrictChange}>
          <option value="">
            Any Region or District
          </option>
          <option value="" disabled>
            ----------------------
          </option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name} Region
            </option>
          ))}
          <option value="" disabled>
            ----------------------
          </option>
          {districts.map((district) => (
            <option key={district.id} value={`${district.regionId}_${district.id}`}>
              {district.name} District
            </option>
          ))}
        </select>
      </label>
      &nbsp;

      <label>
        <input
          type="checkbox"
          checked={filters.showDistrict}
          className="checkbox checkbox-m"
          name="filterScope"
          value="district"
          onChange={handleScopeChange}
        />&nbsp;<EventScopeBadge scope="district" label="District Finals" />
      </label>
      <label>
        <input
          type="checkbox"
          checked={filters.showRegion}
          className="checkbox checkbox-m"
          name="filterScope"
          value="region"
          onChange={handleScopeChange}
        />&nbsp;<EventScopeBadge scope="region" />
      </label>
      <label>
        <input
          type="checkbox"
          checked={filters.showNation}
          className="checkbox checkbox-m"
          name="filterScope"
          value="nation"
          onChange={handleScopeChange}
        />&nbsp;<EventScopeBadge scope="nation" />
      </label>
    </div>
  );
}