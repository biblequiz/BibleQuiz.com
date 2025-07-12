export interface RegionInfo {
    id: string;
    name: string;
}

export interface DistrictInfo {
    id: string;
    name: string;
    states: string[];
    regionId: string;
}
