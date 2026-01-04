import type { AuthManager } from "./AuthManager";

export interface StateRegionAndDistricts {
    code: string;
    label: string;
    regions: RegionInfo[];
    districts: DistrictInfo[];
}
export interface RegionInfo {
    id: string;
    name: string;
    states: string[];
}

export interface DistrictInfo {
    id: string;
    name: string;
    states: string[];
    regionId: string;
}

/**
 * Filters the list of regions to only those the user is authorized to access.
 * 
 * @param auth Manager for auth.
 * @param regions List of all regions.
 * @param eventType Type of event for the region.
 * @param includeId Id to include regardless of permissions.
 * @returns Filtered list of regions.
 */
export function filterToAuthorizedRegions(
    auth: AuthManager,
    regions: RegionInfo[],
    eventType?: string,
    includeId?: string | null): RegionInfo[] {

    const filtered: RegionInfo[] = [];
    for (const region of regions) {
        if (includeId === region.id ||
            (auth.userProfile &&
                auth.userProfile.hasRegionPermission(region.id, eventType ?? null))) {
            filtered.push(region);
        }
    }

    return filtered;
}

/**
 * Filters the list of districts to only those the user is authorized to access.
 * 
 * @param auth Manager for auth.
 * @param districts List of all districts.
 * @param eventType Type of event for the district.
 * @param includeId Id to include regardless of permissions.
 * @returns Filtered list of districts.
 */
export function filterToAuthorizedDistricts(
    auth: AuthManager,
    districts: DistrictInfo[],
    eventType?: string,
    includeId?: string | null): DistrictInfo[] {

    const filtered: DistrictInfo[] = [];
    for (const district of districts) {
        if (includeId === district.id ||
            (auth.userProfile &&
                auth.userProfile.hasDistrictPermission(district.id, district.regionId, eventType ?? null))) {
            filtered.push(district);
        }
    }

    return filtered;
}