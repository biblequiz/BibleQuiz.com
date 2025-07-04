import { EventScoringReport, ScoringReportMeet } from "@types/EventScoringReport";

import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState } from "@utils/SharedState";
import FontAwesomeIcon from "@components/FontAwesomeIcon";
import CollapsibleSection from "@components/CollapsibleSection";
import type { ScoringReportFootnote } from "@types/EventScoringReport";

function formatLastUpdated(meet: ScoringReportMeet): string {
    const lastUpdatedDate = new Date(meet.LastUpdated);
    let lastUpdatedHours = lastUpdatedDate.getHours();
    const lastUpdatedAmPm = lastUpdatedHours >= 12 ? "PM" : "AM";
    const lastUpdatedMinutes = lastUpdatedDate.getMinutes();
    if (lastUpdatedHours > 12) {
        lastUpdatedHours = lastUpdatedHours - 12;
    }

    return `${lastUpdatedDate.getMonth() + 1}/${lastUpdatedDate.getDate()}/${lastUpdatedDate.getFullYear()} ${lastUpdatedHours}:${lastUpdatedMinutes < 10 ? "0" : ""}${lastUpdatedMinutes} ${lastUpdatedAmPm}`;
}

interface EventScoresProps {
    eventId: string;
    event?: EventScoringReport;
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