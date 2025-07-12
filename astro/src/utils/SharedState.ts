import { atom } from 'nanostores';
import { EventScoringReport } from "@types/EventScoringReport";
import { RoomScoringReport } from "@types/RoomScoringReport";
import type { EventList } from '../types/EventTypes';

/* Downloaded Event Report */
export interface SharedEventScoringReportState {
    report: EventScoringReport | null;
    error: string | null;
}

export const sharedEventScoringReportState: SharedEventScoringReportState | null = atom(null);

export interface RoomDialogCriteria {
    label: string;
    eventId: string;
    databaseId: string;
    meetId: number;
    matchId: number;
    roomId: number;
}

/* Downloaded Room Score Report */
export interface SharedRoomScoringReportState {
    criteria: RoomDialogCriteria | null;
    report: RoomScoringReport | null;
    error: string | null;
}

export const sharedRoomScoringReportState: SharedRoomScoringReportState | null = atom(null);

/* Print Dialog */
export interface MeetReference {
    eventId: string;
    databaseId: string;
    meetId: number;
    label: string;
    isCombinedReport: boolean;
    hasRanking: boolean;
};

export enum OutputType {
    Stats,
    TeamSchedule,
    RoomSchedule,
    ScheduleGrid,
};

export enum StatsFormat {
    TeamsAndQuizzers,
    TeamsOnly,
    QuizzersOnly,
};

export interface PrintConfiguration {
    outputType: OutputType;
    statsFormat: StatsFormat;
    showSinglePerPage: boolean;
    includeStats: boolean;
    selectedMeets: MeetReference[];
};

export const sharedPrintConfiguration: PrintConfiguration | null = atom(null);

/* Event List Filters */
export interface EventListFilterConfiguration {
    searchText: string | null;
    showNation: boolean;
    showRegion: boolean;
    showDistrict: boolean;

    regionId: string | null;
    districtId: string | null;

    selectedTab: string | null;
};

export const sharedEventListFilter: EventListFilterConfiguration | null = atom(null);