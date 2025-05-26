import React from 'react';
import regions from '../data/regions.json';
import districts from '../data/districts.json';
import EventScopeBadge from './EventScopeBadge.tsx';

export default function EventFilters() {
  return (
    <div>
      <label className="select" defaultValue={''}>
        <span className="label">Filter</span>
        <select className="filterScope">
          <option value="">
            Any Region or District
          </option>
          <option value="" disabled>
            ----------------------
          </option>
          {regions.map((region) => (
            <option key={region.id} value={`R${region.id}`}>
              {region.name} Region
            </option>
          ))}
          <option value="" disabled>
            ----------------------
          </option>
          {districts.map((district) => (
            <option key={district.id} value={`D${district.id}`}>
              {district.name} District
            </option>
          ))}
        </select>
      </label>
      &nbsp;

      <label>
        <input
          type="checkbox"
          defaultChecked
          className="checkbox checkbox-m"
          name="filterScope"
          value="district"
        />&nbsp;<EventScopeBadge scope="district" />
      </label>
      <label>
        <input
          type="checkbox"
          defaultChecked
          className="checkbox checkbox-m"
          name="filterScope"
          value="region"
        />&nbsp;<EventScopeBadge scope="region" />
      </label>
      <label>
        <input
          type="checkbox"
          defaultChecked
          className="checkbox checkbox-m"
          name="filterScope"
          value="nation"
        />&nbsp;<EventScopeBadge scope="nation" />
      </label>
    </div>
  );
}