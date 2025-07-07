import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState } from "@utils/SharedState";

import { ScoringReportMeet } from "@types/EventScoringReport";
import FontAwesomeIcon from "@components/FontAwesomeIcon";

export const PrintDialogModalId = "print-dialog";

interface Props {
    eventName: string;
}

export default function PrintDialogContent({  eventName }: Props) {

    const reportState = useStore(sharedEventScoringReportState);
    if (!reportState || !reportState.report) {
        return null;
    }

    return (
        <div className="overflow-x-auto overflow-y-auto">
            <p className="text-2xl font-bold">
                <FontAwesomeIcon icon="fas faPrint" />&nbsp;Print {eventName}
            </p>
            <div>
                {reportState.report.Report.Meets.map((meet: ScoringReportMeet, index: number) => {
                    return (
                        <label>
                            <input type="checkbox" defaultChecked className="checkbox checkbox-md" />&nbsp;
                            {meet.Name}
                        </label>);
                })}
            </div>
        </div>);
}