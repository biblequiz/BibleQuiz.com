import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState } from "@utils/SharedState";

import { ScoringReportMeet } from "@types/EventScoringReport";
import FontAwesomeIcon from "@components/FontAwesomeIcon";
import type { MeetReference } from "@utils/Scores";

export const PrintDialogModalId = "print-dialog";

interface Props {
    eventId: string;
    eventName: string;
    meets: MeetReference[] | null;
}

export default function PrintDialogContent({ eventId, eventName, meets }: Props) {

    const reportState = useStore(sharedEventScoringReportState);

    let resolvedMeets: MeetReference[] | null = meets;
    if (!resolvedMeets && reportState && reportState.report) {
        resolvedMeets = reportState.report.Report.Meets.map((meet: ScoringReportMeet) => {
            return {
                eventId: eventId,
                databaseId: meet.DatabaseId,
                meetId: meet.MeetId,
                label: meet.Name,
                isCombinedReport: meet.IsCombinedReport,
                hasRanking: meet.RankedTeams || meet.RankedQuizzers ? true : false,
            } as MeetReference;
        });
    }

    if (!resolvedMeets) {
        return null;
    }

    return (
        <div className="overflow-x-auto overflow-y-auto">
            <p className="text-2xl font-bold">
                <FontAwesomeIcon icon="fas faPrint" />&nbsp;Print {eventName}
            </p>
            <div>
                {resolvedMeets.map((meet: ScoringReportMeet, index: number) => {
                    return (
                        <label key={`print-meet-${index}`} className="cursor-pointer">
                            <input type="checkbox" defaultChecked className="checkbox checkbox-md" />&nbsp;
                            {meet.label}
                        </label>);
                })}
            </div>
        </div>);
}