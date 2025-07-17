export type EventTypeList = { [type: string]: EventList };
export type EventList = { [slug: string]: EventInfo };

export interface EventInfo {
    id: string;
    season: number;
    name: string;
    regionId: string | null;
    districtId: string | null;
    scope: "district" | "region" | "nation";
    scopeLabel: string;
    dates: string | null;
    startDate: string | null;
    endDate: string | null;
    registrationDates: string | null;
    registrationEndDate: string | null;
    locationName: string | null;
    locationCity: string | null;
    isVisible: boolean;
    isReport: boolean;
}