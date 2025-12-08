import React, { useMemo, useRef, useState } from 'react';
import { $eventFilters, type EventFilterConfiguration } from "utils/SharedState";
import FontAwesomeIcon from './FontAwesomeIcon';

import type { RegionInfo, DistrictInfo } from 'types/RegionAndDistricts';

interface Props {
  regions: RegionInfo[];
  districts: DistrictInfo[];
  onClose(newLocation?: DefaultRegionAndDistrict): void;
}

const DEFAULT_LOCATION_STORAGE_KEY = "event-list-filters-defaults--";

/**
 * Default region and district selection.
 */
export interface DefaultRegionAndDistrict {

  /**
   * Selected state.
   */
  state?: string;

  /**
   * Region id.
   */
  regionId?: string;

  /**
   * District id.
   */
  districtId?: string;
}

/**
 * Retrieves the current default region and district.
 * @returns Default region and district or undefined (if not set).
 */
export const getDefaultRegionAndDistrict = () => {
  const serialized = localStorage.getItem(DEFAULT_LOCATION_STORAGE_KEY);
  if (serialized) {
    return JSON.parse(serialized) as DefaultRegionAndDistrict ?? undefined;
  }

  return undefined;
};

interface RegionWithDistricts {
  districts: string[];
  info: RegionInfo;
}

const setSharedStateAndPersist = (newValues: DefaultRegionAndDistrict) => {
  $eventFilters.set({
    ...newValues,
    regionId: newValues.regionId,
    districtId: newValues.districtId,
  } as EventFilterConfiguration);

  const serialized = JSON.stringify(newValues);
  localStorage.setItem(DEFAULT_LOCATION_STORAGE_KEY, serialized);
};

export default function EventListFiltersDefaultDialog({
  regions,
  districts,
  onClose }: Props) {

  const [state, setState] = useState<string | undefined>(undefined);
  const [regionOrDistrict, setRegionOrDistrict] = useState<string | undefined>(undefined);

  const setStateAndDefaultDistrict = (
    newState: string,
    regionsAndDistricts?: { regions: RegionWithDistricts[], districts: DistrictInfo[] }) => {

    setState(newState);

    regionsAndDistricts ??= stateToRegionAndDistricts.get(newState);
    if (regionsAndDistricts) {
      const selectDistrict = regionsAndDistricts.districts[0];
      setRegionOrDistrict(`${selectDistrict.regionId}_${selectDistrict.id}`);
    }
    else {
      setRegionOrDistrict(undefined);
    }
  };

  const stateToRegionAndDistricts = useMemo(
    () => {
      const indexedRegions: Map<string, RegionWithDistricts> = new Map();
      for (const region of regions) {
        indexedRegions.set(region.id, { info: region, districts: [] });
      }

      const allStates: Map<string, { regions: Set<string>; districts: DistrictInfo[] }> = new Map();
      for (const district of districts) {
        const region = indexedRegions.get(district.regionId);
        if (region) {
          region.districts.push(district.name);
        }
        else {
          continue;
        }

        for (const state of district.states) {

          let stateEntry = allStates.get(state);
          if (!stateEntry) {
            stateEntry = { regions: new Set<string>(), districts: [] };
            allStates.set(state, stateEntry);
          }

          stateEntry.districts.push(district);
          stateEntry.regions.add(district.regionId);
        }
      }

      // Sort the Map alphabetically by state keys
      const sortedStateKeys = Array.from(allStates.keys())
        .sort((a, b) => a.localeCompare(b));

      const sortedStates = new Map<string, {
        regions: RegionWithDistricts[],
        districts: DistrictInfo[]
      }>();

      for (const key of sortedStateKeys) {
        const entry = allStates.get(key);
        if (entry) {
          const sortedRegions = Array.from(entry.regions.entries())
            .map(([regionId]) => indexedRegions.get(regionId)!)
            .sort((a, b) => a.info.name.localeCompare(b.info.name));

          sortedStates.set(key, { regions: sortedRegions, districts: entry.districts });
        }
      }

      const currentDefault = getDefaultRegionAndDistrict();
      const currentDefaultEntry = allStates.get(currentDefault?.state ?? "");
      if (currentDefaultEntry) {
        setState(currentDefault!.state);
        if (currentDefault!.districtId) {
          setRegionOrDistrict(`${currentDefault!.regionId}_${currentDefault!.districtId}`);
        }
        else {
          setRegionOrDistrict(currentDefault!.regionId);
        }
      }
      else {
        setStateAndDefaultDistrict(sortedStateKeys[0], sortedStates.get(sortedStateKeys[0]));
      }

      return sortedStates;
    }, [regions, districts]);

  const dialogRef = useRef<HTMLDialogElement>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {

    if (!regionOrDistrict) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    const key = regionOrDistrict.split('_');
    const newValues: DefaultRegionAndDistrict = {
      state: state,
      regionId: key.length > 0 ? key[0] : undefined,
      districtId: key.length > 1 ? key[1] : undefined,
    };
    setSharedStateAndPersist(newValues);

    dialogRef.current?.close();
    onClose(newValues);
  };

  return (
    <dialog ref={dialogRef} className="modal" open>
      <div className="modal-box w-11/12 max-w-full md:w-3/4 lg:w-1/2">
        <h3 className="font-bold text-lg">Set Default Location</h3>
        <p className="mt-0">
          Choose your location to see relevant events and teams in your area. You only need to do
          this once.
        </p>
        <form method="dialog gap-2" onSubmit={handleSubmit}>
          <div className="w-full">
            <label className="label">
              <span className="label-text font-medium">State</span>
              <span className="label-text-alt text-error">*</span>
            </label>
            <div className="mt-0">
              <select
                className="select select-bordered w-full"
                value={state}
                onChange={e => setStateAndDefaultDistrict(e.target.value)}
                required
              >
                {Array.from(stateToRegionAndDistricts.keys()).map(state => (
                  <option key={`state_${state}`} value={state}>
                    {state}
                  </option>))}
              </select>
            </div>
          </div>
          <div className="w-full">
            <label className="label">
              <span className="label-text font-medium">Show Events and Teams in:</span>
              <span className="label-text-alt text-error">*</span>
            </label>
            <div className="mt-0">
              <select
                className="select select-sm mt-0 w-full"
                onChange={e => setRegionOrDistrict(e.target.value)}
                value={regionOrDistrict ?? ""}>
                <option value="">
                  All Districts
                </option>
                {state && (
                  <>
                    {stateToRegionAndDistricts.get(state)!.regions.map(region => (
                      <option key={`reg_${region.info.id}`} value={region.info.id}>
                        {region.info.name} Region ({region.districts.join(", ")})
                      </option>
                    ))}
                    {stateToRegionAndDistricts.get(state)!.districts.map(district => (
                      <option key={`dis_${district.id}`} value={`${district.regionId}_${district.id}`}>
                        {district.name} District
                      </option>
                    ))}
                  </>)}
              </select>
            </div>
          </div>
          <div className="mt-4 text-right">
            <button
              className="btn btn-primary mr-2 mt-0"
              type="submit"
              tabIndex={1}>
              <FontAwesomeIcon icon="fas faCheck" />
              Set Defaults
            </button>
            <button
              className="btn btn-error mr-2 mt-0"
              type="button"
              tabIndex={1}
              onClick={() => {
                dialogRef.current?.close();
                onClose();
              }}>
              <FontAwesomeIcon icon="fas faMinusCircle" />
              Cancel
            </button>
          </div>
        </form>
      </div>
    </dialog>);
}