import { useState } from "react";
import ChurchLookup, { type SelectedChurch } from "../ChurchLookup";
import stateRegionAndDistricts from "../../data/stateRegionAndDistricts.json";
import type { StateRegionAndDistricts } from "../../types/RegionAndDistricts";

interface Props {
    disabled?: boolean;
    onSelect: (church: SelectedChurch) => void;
}

interface StateScopes {
    state: string;
    scopes: Record<string, SelectedScopeInfo>;
    regions: SelectedScopeInfo[];
    districts: SelectedScopeInfo[];
}

interface SelectedScopeInfo {
    key: string;
    name: string;
    regionId: string;
    districtId: string | null;
}

// Build a list of the scopes.
const SCOPES_BY_STATE: Record<string, StateScopes> = {};
{
    // Create the list of states.
    for (const state of stateRegionAndDistricts) {
        const stateInfo = {
            label: state.label,
            regions: state.regions,
            districts: state.districts
        };
    }

    for (const region of regions) {
        for (const state of region.states) {
            uniqueStates.add(state);
        }
    }

    for (const district of districts) {
        for (const state of district.states) {
            uniqueStates.add(state);
        }
    }

    // Sort the states.
    const sortedStates = Array.from(uniqueStates).sort();
    for (const state of sortedStates) {
        SCOPES_BY_STATE[state] = { state: state, scopes: {}, regions: [], districts: [] };
    }

    // Add regions and districts to the list of scopes by state.
    for (const region of regions) {
        const scopeInfo: SelectedScopeInfo = {
            key: `reg_${region.id}`,
            name: region.name,
            regionId: region.id,
            districtId: null
        };

        for (const state of region.states) {
            const stateScope = SCOPES_BY_STATE[state];
            stateScope.scopes[scopeInfo.key] = scopeInfo;
            stateScope.regions.push(scopeInfo);
        }
    }

    for (const district of districts) {
        const scopeInfo: SelectedScopeInfo = {
            key: `dis_${district.id}`,
            name: district.name,
            regionId: district.regionId,
            districtId: district.id
        };

        for (const state of district.states) {
            const stateScope = SCOPES_BY_STATE[state];
            stateScope.scopes[scopeInfo.key] = scopeInfo;
            stateScope.districts.push(scopeInfo);
        }
    }
}

export default function ChurchLookupByState({ disabled = false, onSelect }: Props) {

    const [stateScope, setStateScope] = useState<StateScopes | null>(null);
    const [churchScope, setChurchScope] = useState<SelectedScopeInfo | null>(null);

    return (
        <>
            <div className="w-full">
                <label className="label">
                    <span className="label-text font-medium">Church State</span>
                    <span className="label-text-alt text-error">*</span>
                </label>
                <div>
                    <select
                        className="select select-bordered w-full"
                        value={stateScope?.state || ""}
                        onChange={e => setStateScope(SCOPES_BY_STATE[e.target.value])}
                        disabled={disabled}
                        required
                    >
                        <option value="" disabled>
                            Select State
                        </option>
                        {Object.keys(SCOPES_BY_STATE).map((stateKey) => (
                            <option key={`state_${stateKey}`} value={stateKey}>
                                {stateKey}
                            </option>))}
                    </select>
                </div>
            </div>
            {stateScope && stateScope.districts.length > 0 && (
                <div className="w-full">
                    <label className="label">
                        <span className="label-text font-medium">Church Location</span>
                        <span className="label-text-alt text-error">*</span>
                    </label>
                    <div>
                        <select
                            className="select select-bordered w-full"
                            value={churchScope?.key || ""}
                            onChange={e => setChurchScope(stateScope.scopes[e.target.value])}
                            disabled={disabled}
                            required
                        >
                            <option value="" disabled>
                                Select Region or District by State
                            </option>
                            {stateScope.regions.map((scope) => (
                                <option key={scope.key} value={scope.key}>
                                    {scope.name}
                                </option>
                            ))}
                            <option value="" disabled>
                                ----------------------
                            </option>
                            {stateScope.districts.map((scope) => (
                                <option key={scope.key} value={scope.key}>
                                    {scope.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>)}
            {churchScope && (
                <div className="w-full">
                    <label className="label">
                        <span className="label-text font-medium">Church</span>
                        <span className="label-text-alt text-error">*</span>
                    </label>
                    <ChurchLookup
                        regionId={churchScope.regionId}
                        districtId={churchScope.districtId ?? undefined}
                        onSelect={church => onSelect(church)}
                        disabled={disabled}
                        required
                    />
                </div>)}
        </>);
}