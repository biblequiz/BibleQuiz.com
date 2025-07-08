import { EventScoringReport, ScoringReportMeet } from "@types/EventScoringReport";
import { StatsFormat } from "@utils/SharedState";

export function formatLastUpdated(meet: ScoringReportMeet): string {
    const lastUpdatedDate = new Date(meet.LastUpdated);
    let lastUpdatedHours = lastUpdatedDate.getHours();
    const lastUpdatedAmPm = lastUpdatedHours >= 12 ? "PM" : "AM";
    const lastUpdatedMinutes = lastUpdatedDate.getMinutes();
    if (lastUpdatedHours > 12) {
        lastUpdatedHours = lastUpdatedHours - 12;
    }

    return `${lastUpdatedDate.getMonth() + 1}/${lastUpdatedDate.getDate()}/${lastUpdatedDate.getFullYear()} ${lastUpdatedHours}:${lastUpdatedMinutes < 10 ? "0" : ""}${lastUpdatedMinutes} ${lastUpdatedAmPm}`;
}

export interface EventScoresProps {
    eventId: string;
    event?: EventScoringReport;
    isPrinting?: boolean;
    printingStatsFormat?: StatsFormat;
};