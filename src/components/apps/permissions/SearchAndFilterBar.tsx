import { useEffect, useState } from 'react';
import { PersonPermissionScope } from 'types/services/PermissionsService';
import regionsData from 'data/regions.json';
import districtsData from 'data/districts.json';
import FontAwesomeIcon from 'components/FontAwesomeIcon';

interface Region {
    id: string;
    name: string;
    states: string[];
}

interface District {
    id: string;
    name: string;
    states: string[];
    regionId: string;
}

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
    const [intermediateSearchText, setIntermediateSearchText] = useState<string>(searchText);
    const [regions, setRegions] = useState<Region[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [allDistricts, setAllDistricts] = useState<District[]>([]);

    const isDistrictScope = currentScope === PersonPermissionScope.District;
    const isRegionScope = currentScope === PersonPermissionScope.Region;

    useEffect(() => {
        // Load all regions and districts
        setRegions(regionsData as Region[]);
        setAllDistricts(districtsData as District[]);
    }, []);

    useEffect(() => {
        // Filter districts by selected region (for Church scope)
        if (selectedRegion && !isDistrictScope) {
            const filtered = (districtsData as District[]).filter(d => d.regionId === selectedRegion);
            setDistricts(filtered);
        } else {
            setDistricts([]);
        }
    }, [selectedRegion, isDistrictScope]);

    const showDistrictControls = currentScope === PersonPermissionScope.Church ||
        currentScope === PersonPermissionScope.Region ||
        currentScope === PersonPermissionScope.District ||
        currentScope === null;

    const showCheckboxes = currentScope === PersonPermissionScope.Church || currentScope === null;

    return (
        <div className="space-y-4 bg-base-200 p-4 rounded-lg">
            <div className="join w-full mt-0 mb-0">
                <input
                    type="text"
                    className="input input-bordered join-item w-full"
                    value={intermediateSearchText}
                    onChange={e => setIntermediateSearchText(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            onSearchChange(intermediateSearchText);
                        }
                    }}
                    placeholder="Search by name or location"
                />
                <button
                    type="button"
                    className="btn btn-info join-item mt-0"
                    onClick={() => onSearchChange(intermediateSearchText)}>
                    <FontAwesomeIcon icon="fas faMagnifyingGlass" />
                    Find
                </button>
            </div>

            {/* Region and District Selection */}
            {showDistrictControls && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Region dropdown - hidden for District scope and People scope */}
                    {!isDistrictScope && currentScope !== null && (
                        <label className="form-control">
                            <div className="label">
                                <span className="label-text">Region</span>
                                {isRegionScope && <span className="label-text-alt text-error">*</span>}
                            </div>
                            <select
                                className="select select-bordered"
                                value={selectedRegion || ''}
                                onChange={(e) => {
                                    onRegionChange(e.target.value || undefined);
                                    onDistrictChange(undefined);
                                }}
                                required={isRegionScope}
                            >
                                {regions.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </label>
                    )}

                    {/* District dropdown - shown for Church, District, and People scopes */}
                    {!isRegionScope && (
                        <label className="form-control">
                            <div className="label">
                                <span className="label-text">District</span>
                                {isDistrictScope && <span className="label-text-alt text-error">*</span>}
                            </div>
                            <select
                                className="select select-bordered"
                                value={selectedDistrict || ''}
                                onChange={(e) => onDistrictChange(e.target.value || undefined)}
                                disabled={checkboxStates.allDistricts && !isDistrictScope}
                                required={isDistrictScope}
                            >
                                {isDistrictScope || currentScope === null ? (
                                    allDistricts.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))
                                ) : (
                                    <>
                                        <option value="">All Districts</option>
                                        {districts.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </>
                                )}
                            </select>
                        </label>
                    )}
                </div>
            )}

            {/* Checkboxes */}
            {showCheckboxes && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-0 mb-0">
                    {currentScope === PersonPermissionScope.Church && (
                        <>
                            <label className="label cursor-pointer gap-2">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm"
                                    checked={checkboxStates.allDistricts}
                                    onChange={() => onCheckboxChange('allDistricts')}
                                />
                                <span className="label-text text-sm">Search in all districts</span>
                            </label>
                            <label className="label cursor-pointer gap-2">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm"
                                    checked={checkboxStates.potentialDuplicates}
                                    onChange={() => onCheckboxChange('potentialDuplicates')}
                                />
                                <span className="label-text text-sm">Potential duplicates</span>
                            </label>
                            <label className="label cursor-pointer gap-2">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm"
                                    checked={checkboxStates.manuallyAdded}
                                    onChange={() => onCheckboxChange('manuallyAdded')}
                                />
                                <span className="label-text text-sm">Non-AG Churches</span>
                            </label>
                        </>
                    )}

                    {currentScope === null && (
                        <>
                            <label className="label cursor-pointer gap-2">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm"
                                    checked={checkboxStates.allDistricts}
                                    onChange={() => onCheckboxChange('allDistricts')}
                                />
                                <span className="label-text text-sm">Search in all districts</span>
                            </label>
                            <label className="label cursor-pointer gap-2">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm"
                                    checked={checkboxStates.potentialDuplicates}
                                    onChange={() => onCheckboxChange('potentialDuplicates')}
                                />
                                <span className="label-text text-sm">Potential duplicates</span>
                            </label>
                            <label className="label cursor-pointer gap-2">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm"
                                    checked={checkboxStates.usersOnly}
                                    onChange={() => onCheckboxChange('usersOnly')}
                                />
                                <span className="label-text text-sm">Users only</span>
                            </label>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
