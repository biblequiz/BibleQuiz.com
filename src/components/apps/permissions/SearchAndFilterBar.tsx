import { useState } from 'react';
import { PersonPermissionScope } from 'types/services/PermissionsService';
import regionsData from 'data/regions.json';
import districtsData from 'data/districts.json';
import FontAwesomeIcon from 'components/FontAwesomeIcon';
import type { DistrictInfo, RegionInfo } from 'types/RegionAndDistricts';

interface CheckboxStates {
    allDistricts: boolean;
    unapprovedOnly: boolean;
    potentialDuplicates: boolean;
    usersOnly: boolean;
    manuallyAdded: boolean;
}

interface Props {
    searchText: string;
    onSearchChange: (text: string) => void;
    selectedRegion: string | undefined;
    onRegionChange: (region: string | undefined) => void;
    selectedDistrict: string | undefined;
    onDistrictChange: (district: string | undefined) => void;
    checkboxStates: CheckboxStates;
    onCheckboxChange: (key: keyof CheckboxStates) => void;
    currentScope: PersonPermissionScope | null;
}

const ALL_REGIONS = regionsData as RegionInfo[];
const ALL_DISTRICTS = districtsData as DistrictInfo[];
export const DEFAULT_REGION_ID = ALL_REGIONS[0].id;
export const DEFAULT_DISTRICT_ID = ALL_DISTRICTS[0].id;

export default function SearchAndFilterBar({
    searchText,
    onSearchChange,
    selectedRegion,
    onRegionChange,
    selectedDistrict,
    onDistrictChange,
    checkboxStates,
    onCheckboxChange,
    currentScope
}: Props) {
    const [intermediateSearchText, setIntermediateSearchText] = useState<string | undefined>(searchText);

    const isRegionScope = currentScope === PersonPermissionScope.Region;

    const showDistrictControls = currentScope === PersonPermissionScope.Church ||
        currentScope === PersonPermissionScope.Region ||
        currentScope === PersonPermissionScope.District ||
        currentScope === null;

    const showCheckboxes = currentScope === PersonPermissionScope.Church || currentScope === null;

    return (
        <fieldset className="fieldset bg-base-100 border-base-300 rounded-box border p-2 pt-0">
            <legend className="fieldset-legend ml-2">
                <FontAwesomeIcon icon="fas faSearch" />
                Filter
            </legend>
            <div className="flex flex-wrap gap-2 mt-0 mb-0">
                <label className="input input-sm mt-0 max-w-2xl">
                    <FontAwesomeIcon icon="fas faSearch" classNames={["h-[1em]", "opacity-50"]} />
                    <input
                        type="text"
                        className="grow"
                        placeholder="Name or Location"
                        value={intermediateSearchText ?? ""}
                        onChange={e => setIntermediateSearchText(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                onSearchChange(intermediateSearchText ?? "");
                            }
                        }} />
                    {(intermediateSearchText?.length ?? 0) > 0 && (
                        <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => {
                                setIntermediateSearchText(undefined);
                                onSearchChange("");
                            }}>
                            <FontAwesomeIcon icon="fas faCircleXmark" />
                        </button>)}
                </label>
                {showDistrictControls && (
                    <select
                        className="select select-sm mt-0 w-auto"
                        onChange={e => {
                            if (isRegionScope && !selectedDistrict) {
                                onRegionChange(e.target.value || undefined);
                            }
                            else {
                                onDistrictChange(e.target.value || undefined);
                            }
                        }}
                        disabled={checkboxStates.allDistricts}
                        value={selectedDistrict ?? selectedRegion ?? (isRegionScope ? DEFAULT_REGION_ID : DEFAULT_DISTRICT_ID)}>
                        {isRegionScope && ALL_REGIONS.map((region) => (
                            <option key={`reg_${region.id}`} value={region.id}>
                                {region.name} Region
                            </option>
                        ))}
                        {!isRegionScope && ALL_DISTRICTS.map((district) => (
                            <option key={`dis_${district.id}`} value={district.id}>
                                {district.name} District
                            </option>
                        ))}
                    </select>)}
                {showCheckboxes && (
                    <>
                        {(currentScope === PersonPermissionScope.Church || currentScope === null) && (
                            <>
                                <label className="label mt-0 mb-0">
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-info"
                                        value="allDistricts"
                                        checked={checkboxStates.allDistricts}
                                        onChange={() => onCheckboxChange('allDistricts')} />
                                    <span className="text-sm">
                                        Search in All Districts
                                    </span>
                                </label>
                                <label className="label mt-0 mb-0">
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-info"
                                        value="potentialDuplicates"
                                        checked={checkboxStates.potentialDuplicates}
                                        onChange={() => onCheckboxChange('potentialDuplicates')} />
                                    <span className="text-sm">
                                        Potential Duplicates
                                    </span>
                                </label>
                            </>)}
                        {currentScope === PersonPermissionScope.Church && (
                            <label className="label mt-0 mb-0">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-info"
                                    value="manuallyAdded"
                                    checked={checkboxStates.manuallyAdded}
                                    onChange={() => onCheckboxChange('manuallyAdded')} />
                                <span className="text-sm">
                                    Non-AG Churches
                                </span>
                            </label>)}
                        {currentScope === null && (
                            <label className="label mt-0 mb-0">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-info"
                                    value="usersOnly"
                                    checked={checkboxStates.usersOnly}
                                    onChange={() => onCheckboxChange('usersOnly')} />
                                <span className="text-sm">
                                    Users Only
                                </span>
                            </label>)}
                    </>)}
            </div>
        </fieldset>);
}
