import { atom } from 'nanostores';
import { EventScoringReport } from "@types/EventScoringReport";
import { RoomScoringReport } from "@types/RoomScoringReport";

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

export interface SharedRoomScoringReportState {
    criteria: RoomDialogCriteria | null;
    report: RoomScoringReport | null;
    error: string | null;
}

export const sharedRoomScoringReportState: SharedRoomScoringReportState | null = atom(null);