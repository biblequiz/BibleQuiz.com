export interface StateRegionAndDistricts {
    label: string;
    regions: RegionInfo[];
    districts: DistrictInfo[];
}
export interface RegionInfo {
    id: string;
    name: string;
}

export interface DistrictInfo {
    id: string;
    name: string;
    states?: string[];
    regionId: string;
}
