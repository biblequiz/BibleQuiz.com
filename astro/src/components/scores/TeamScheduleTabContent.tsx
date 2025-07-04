import { EventScoringReport, ScoringReportMeet } from "@types/EventScoringReport";

import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState } from "@utils/SharedState";
import CollapsableMeetSection from "@components/scores/CollapsableMeetSection";
import type { ScoringReportFootnote } from "@types/EventScoringReport";
import type { EventScoresProps } from "@utils/Scores";
import { formatLastUpdated } from "@utils/Scores";

export default function TeamScheduleTabContent({ event }: EventScoresProps) {

    event ??= useStore(sharedEventScoringReportState)?.report;
    if (!event) {
        return (<span>Event is Loading ...</span>);
    }

    return (
        <>
            {event.Report.Meets.map((meet: ScoringReportMeet) => {
                return (
                    <CollapsableMeetSection meet={meet} pageId="teamschedule">
                        Schedule Grid Tab Content
                    </CollapsableMeetSection>);
            })}
        </>);
};

