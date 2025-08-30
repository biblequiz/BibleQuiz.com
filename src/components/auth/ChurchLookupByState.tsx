import { useState } from "react";
import ChurchLookup, { ChurchSearchTips, type AddChurchConfig, type SelectedChurch } from "../ChurchLookup";
import stateRegionAndDistricts from "../../data/stateRegionsAndDistricts.json";
import type { StateRegionAndDistricts } from "../../types/RegionAndDistricts";

interface Props {
    allowAdd?: AddChurchConfig;
    disabled?: boolean;
    onSelect: (church: SelectedChurch) => void;
}

interface StateScopes {
    state: string;
    label: string;
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
    for (const state of (stateRegionAndDistricts as any as StateRegionAndDistricts[])) {

        const stateInfo: StateScopes = {
            state: state.code,
            label: state.label,
            scopes: {},
            regions: [],
            districts: []
        };

        for (const region of state.regions) {
            const scopeInfo: SelectedScopeInfo = {
                key: `reg_${region.id}`,
                name: region.name,
                regionId: region.id,
                districtId: null
            };

            stateInfo.scopes[scopeInfo.key] = scopeInfo;
            stateInfo.regions.push(scopeInfo);
        }

        for (const district of state.districts) {
            const scopeInfo: SelectedScopeInfo = {
                key: `dis_${district.id}`,
                name: district.name,
                regionId: district.regionId,
                districtId: district.id
            };

            stateInfo.scopes[scopeInfo.key] = scopeInfo;
            stateInfo.districts.push(scopeInfo);
        }

        SCOPES_BY_STATE[state.code] = stateInfo;
    }
}

export default function ChurchLookupByState({ disabled = false, allowAdd, onSelect }: Props) {

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
                        onChange={e => {
                            const newScope = SCOPES_BY_STATE[e.target.value];
                            setStateScope(newScope);

                            if (newScope.districts.length === 1) {
                                setChurchScope(newScope.districts[0]);
                            }
                            else {
                                setChurchScope(null);
                            }
                        }}
                        disabled={disabled}
                        required
                    >
                        <option value="" disabled>
                            Select State
                        </option>
                        {Object.keys(SCOPES_BY_STATE).map((stateKey) => (
                            <option key={`state_${stateKey}`} value={stateKey}>
                                {SCOPES_BY_STATE[stateKey].label}
                            </option>))}
                    </select>
                </div>
            </div>
            {stateScope && stateScope.districts.length > 1 && (
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
                                {stateScope.regions.length > 1 ? "Select Region or District" : "Select District"}
                            </option>
                            {stateScope.regions.length > 1 && stateScope.regions.map((scope) => (
                                <option key={scope.key} value={scope.key}>
                                    {scope.name}
                                </option>
                            ))}
                            {stateScope.regions.length > 1 && (
                                <option value="" disabled>
                                    ----------------------
                                </option>)}
                            {stateScope.districts.map((scope) => (
                                <option key={scope.key} value={scope.key}>
                                    {scope.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <p className="text-sm italic mt-1">
                        If you can't find your church, try changing the Location to another
                        {stateScope.regions.length > 1 ? " Region/District" : " District"} and
                        try again.
                    </p>
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
                        allowAdd={allowAdd
                            ? {
                                ...allowAdd,
                                state: stateScope?.state ?? undefined
                            }
                            : undefined}
                        showTips={(stateScope?.districts.length ?? 0) > 1 ? ChurchSearchTips.BasicWithDistrictChange : ChurchSearchTips.Basic}
                        onSelect={church => onSelect(church)}
                        disabled={disabled}
                        required
                    />
                </div>)}
        </>);
}