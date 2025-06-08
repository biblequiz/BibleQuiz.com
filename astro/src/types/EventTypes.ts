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
    urlSlug: string;
    isVisible: boolean;
}