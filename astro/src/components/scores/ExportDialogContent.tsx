import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState } from "@utils/SharedState";
import FontAwesomeIcon from "@components/FontAwesomeIcon";

export const ExportDialogModalIdPrefix = "export-dialog";

interface Props {
    type: "Print" | "Export";
    eventName: string;
}

export default function ExportDialogContent({ type, eventName }: Props) {

    const reportState = useStore(sharedEventScoringReportState);
    if (!reportState || !reportState.report) {
        return null;
    }

    let icon = "";
    switch (type) {
        case "Print":
            icon = "fas faPrint";
            break;
        case "Export":
            icon = "fas faFileExcel";
            break;
    }

    return (
        <div className="overflow-x-auto overflow-y-auto">
            <p className="text-2xl font-bold">
                <FontAwesomeIcon icon={icon} />&nbsp;{type} {eventName}
            </p>
        </div>);
}