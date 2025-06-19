export type EventTypeList = { [type: string]: EventCategories };

export interface EventCategories {
    nationals: EventInfo | null;
    regionals: EventList;
    districts: EventList;
    other: EventList;
    reports: ReportList;
}
export type EventList = { [slug: string]: EventInfo };
export type ReportList = { [slug: string]: ReportInfo };

export interface EventInfo {
    id: string;
    season: number;
    name: string;
    regionId: string | null;
    districtId: string | null;
    scope: string;
    dates: string;
    startDate: string;
    endDate: string;
    registrationDates: string | null;
    registrationEndDate: string | null;
    locationName: string;
    locationCity: string;
}

export interface ReportInfo {
    id: string;
    season: number;
    name: string;
    regionId: string | null;
    districtId: string | null;
    scope: string;
}