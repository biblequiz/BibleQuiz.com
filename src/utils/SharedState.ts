import { atom } from 'nanostores';
import Fuse, { type FuseResult } from "fuse.js";

import { EventScoringReport } from "@types/EventScoringReport";
import { RoomScoringReport } from "@types/RoomScoringReport";
import type { QuizzerIndex } from "../types/QuizzerSearch";
import type { ScoringReportMeet, ScoringReportQuizzer, ScoringReportTeam } from '../types/EventScoringReport';
import type { TeamAndQuizzerFavorites } from '../types/TeamAndQuizzerFavorites';

/* Downloaded Event Report */
export interface EventScoringReportSearchIndexItem<T> {
    meets: ScoringReportMeet[];
    item: T;
}

export interface SharedEventScoringReportState {
    report: EventScoringReport | null;
    favorites: TeamAndQuizzerFavorites;
    teamIndex: Fuse<EventScoringReportSearchIndexItem<ScoringReportTeam>> | null;
    quizzerIndex: Fuse<EventScoringReportSearchIndexItem<ScoringReportQuizzer>> | null;
    error: string | null;
}

export const sharedEventScoringReportState: SharedEventScoringReportState | null = atom(null);

/* Event Report Search */
export interface SharedEventScoringReportFilterState {
    searchText: string | null;
    teamResults: FuseResult<EventScoringReportSearchIndexItem<ScoringReportTeam>>[] | null;
    quizzerResults: FuseResult<EventScoringReportSearchIndexItem<ScoringReportTeam>>[] | null;
    openMeetDatabaseId: string | null;
    openMeetMeetId: number | null;
    highlightTeamId: string | null;
    highlightQuizzerId: string | null;
    favoritesVersion: number | null;
}

export const sharedEventScoringReportFilterState: SharedEventScoringReportFilterState | null = atom(null);

/* Downloaded Room Score Report */
export interface RoomDialogCriteria {
    label: string;
    eventId: string;
    databaseId: string;
    meetId: number;
    matchId: number;
    roomId: number;
}

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
};

export const sharedEventListFilter: EventListFilterConfiguration | null = atom(null);

/* Quizzer Search Dialog */
export interface QuizzerSearchState {
    searchText: string | null;
    index: QuizzerIndex;
    quizzerIndex: number | null;
};

export const sharedQuizzerSearchState: QuizzerSearchState | null = atom(null);