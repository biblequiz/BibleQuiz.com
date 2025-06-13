import { EventScoringReport } from "@types/EventScoringReport";

import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState } from "@utils/SharedState";

interface EventScoresProps {
    eventId: string;
    event?: EventScoringReport;
};

export function StatsTabItem({ eventId, event }: EventScoresProps) {

    event ??= useStore(sharedEventScoringReportState)?.report;
    if (!event) {
        return (<span>Event is Loading ...</span>);
    }

    return (
        <div>
            <span>Stats Tab Loaded: {event.EventName}</span>
        </div>);
};

export function ScheduleTabItem({ eventId, event }: EventScoresProps) {

    event ??= useStore(sharedEventScoringReportState)?.report;
    if (!event) {
        return (<span>Event is Loading ...</span>);
    }

    return (
        <div>
            <span>Schedule Tab Loaded: {event.EventName}</span>
        </div>);
};

export function CoordinatorTabItem({ eventId, event }: EventScoresProps) {

    event ??= useStore(sharedEventScoringReportState)?.report;
    if (!event) {
        return (<span>Event is Loading ...</span>);
    }

    return (
        <div>
            <span>Coordinator Tab Loaded: {event.EventName}</span>
        </div>);
};

export function QuestionStatsTabItem({ eventId, event }: EventScoresProps) {

    event ??= useStore(sharedEventScoringReportState)?.report;
    if (!event) {
        return (<span>Event is Loading ...</span>);
    }

    return (
        <div>
            <span>Question Stats Tab Loaded: {event.EventName}</span>
        </div>);
};