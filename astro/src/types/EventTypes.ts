export type EventTypeList = { [type: string]: EventList };
export type EventList = { [url: string]: EventInfo };

export interface EventInfo {
    order: number;
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
    isVisible: boolean;
}