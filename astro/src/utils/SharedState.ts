import { atom } from 'nanostores';
import { EventScoringReport } from "@types/EventScoringReport";

export interface SharedEventScoringReportState {
    report: EventScoringReport | null;
    error: string | null;
}

export const sharedEventScoringReportState: SharedEventScoringReportState | null = atom(null);