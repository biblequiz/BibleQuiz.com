import { EventScoringReport, ScoringReportMeet } from "@types/EventScoringReport";

import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState } from "@utils/SharedState";
import CollapsableMeetSection from "@components/scores/CollapsableMeetSection";
import type { EventScoresProps } from "@utils/Scores";

export default function CoordinatorTabContent({ event }: EventScoresProps) {

    event ??= useStore(sharedEventScoringReportState)?.report;
    if (!event) {
        return (<span>Event is Loading ...</span>);
    }

    return (
        <>
            {event.Report.Meets.map((meet: ScoringReportMeet) => {
                return (
                    <CollapsableMeetSection meet={meet} pageId="coodinator">
                        Coordinator Tab Content
                    </CollapsableMeetSection>);
            })}
        </>);
};

