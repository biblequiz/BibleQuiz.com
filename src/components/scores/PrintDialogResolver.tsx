import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState, sharedPrintConfiguration } from "utils/SharedState";
import type { EventInfo } from "types/EventTypes";
import { EventScoringReport } from "types/EventScoringReport";
import { OutputType } from "utils/SharedState";
import type { PrintConfiguration } from "utils/SharedState";

import FontAwesomeIcon from "components/FontAwesomeIcon";
import StatsTabContent from "components/scores/StatsTabContent";
import ScheduleGridTabContent from "components/scores/ScheduleGridTabContent";
import TeamOrRoomScheduleTabContent from "components/scores/TeamOrRoomScheduleTabContent";

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
        return (
            <div className="hide-if-not-print-screen">
                Use the <FontAwesomeIcon icon="fas faPrint" /> button to print this page.
            </div>);
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
            return (
                <div className="hide-if-not-print-screen">
                    <TeamOrRoomScheduleTabContent
                        type="Team"
                        eventId={eventId}
                        event={event}
                        isPrinting={true}
                        printSinglePerPage={printDialogState.showSinglePerPage}
                        printStats={printDialogState.includeStats}
                    />
                </div>);
        }

        case OutputType.RoomSchedule: {
            return (
                <div className="hide-if-not-print-screen">
                    <TeamOrRoomScheduleTabContent
                        type="Room"
                        eventId={eventId}
                        event={event}
                        isPrinting={true}
                        printSinglePerPage={printDialogState.showSinglePerPage}
                        printStats={printDialogState.includeStats}
                    />
                </div>);
        }

        case OutputType.ScheduleGrid: {
            return (
                <div className="hide-if-not-print-screen">
                    <ScheduleGridTabContent
                        eventId={eventId}
                        event={event}
                        isPrinting={true}
                        printStats={printDialogState.includeStats}
                    />
                </div>);
        }

        default:
            throw new Error(`Unsupported output type: ${printDialogState.outputType}`);
    }
}