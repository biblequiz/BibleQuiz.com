import { atom } from 'nanostores';
import { EventScoringReport } from "@types/EventScoringReport";

export const sharedEventScoringReportState: EventScoringReport | null = atom(null);