import { EventScoringReport } from "@types/EventScoringReport";
import { sharedEventScoringReportState } from "@utils/SharedState";

interface EventScoresProps {
    eventId: string;
    event?: EventScoringReport;
};

export function StatsTabItem({ eventId, event }: EventScoresProps) {

    event ??= sharedEventScoringReportState.get();
    if (!event) {
        return (<span>Event is Loading ...</span>);
    }

    return (
        <div>
            <span>Stats Tab</span>
        </div>);
};

export function ScheduleTabItem({ eventId, event }: EventScoresProps) {
    return (
        <div>
            <span>Schedule Content</span>
        </div>)
};

export function CoordinatorTabItem({ eventId, event }: EventScoresProps) {
    return (
        <div>
            <span>Coordinator Content</span>
        </div>)
};

export function QuestionStatsTabItem({ eventId, event }: EventScoresProps) {
    return (
        <div>
            <span>Question Stats</span>
        </div>)
};

export function QRCodeTabItem({ eventId, event }: EventScoresProps) {
    return (
        <div>
            <span>QR Code</span>
        </div>)
};