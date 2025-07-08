import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState, sharedPrintConfiguration } from "@utils/SharedState";
import type { EventInfo } from "@types/EventTypes";
import { EventScoringReport } from "@types/EventScoringReport";
import { OutputType } from "@utils/SharedState";
import type { PrintConfiguration } from "@utils/SharedState";

import StatsTabContent from "@components/scores/StatsTabContent";
import ScheduleGridTabContent from "@components/scores/ScheduleGridTabContent";
import TeamOrRoomScheduleTabContent from "@components/scores/TeamOrRoomScheduleTabContent";

interface Props {
    eventId: string;
    event: EventScoringReport | null;
}

export default function PrintDialogResolver({ eventId, event }: Props) {

    const reportState = useStore(sharedEventScoringReportState);
    const printDialogState: PrintConfiguration | null = useStore(sharedPrintConfiguration);
    const resolvedReport: EventScoringReport | null = (event ?? reportState?.report) as EventScoringReport;

    useEffect(() => {

        if (printDialogState && resolvedReport) {
            // Trigger the print dialog after the component has rendered
            window.print();

            // Clear the current print configuration to remove any formatting from the page.
            sharedPrintConfiguration.set(null);
        }
    }, [printDialogState, reportState]);

    if (!printDialogState || !resolvedReport) {
        return null;
    }

    switch (printDialogState.outputType) {
        case OutputType.Stats: {
            return (
                <div className="hide-if-not-print-screen">
                    <StatsTabContent
                        eventId={eventId}
                        event={resolvedReport}
                        isPrinting={true}
                        printingStatsFormat={printDialogState.statsFormat}
                    />
                </div>);
        }

        case OutputType.TeamSchedule: {
            return (<div>Team Schedule</div>);
        }

        case OutputType.RoomSchedule: {
            return (<div>Room Schedule</div>);
        }

        case OutputType.ScheduleGrid: {
            return (<div>Schedule Grid</div>);
        }

        default:
            throw new Error(`Unsupported output type: ${printDialogState.outputType}`);
    }
}