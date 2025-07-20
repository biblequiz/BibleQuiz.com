import { useEffect } from "react";
import type { EventInfo } from "@types/EventTypes";
import type { EventScoringReport } from "@types/EventScoringReport";

import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState, sharedPrintConfiguration } from "@utils/SharedState";
import { PrintDialogModalId } from "./PrintDialogContent";
import FontAwesomeIcon from "../FontAwesomeIcon";

interface Props {
    parentTabId: string;
    eventInfo: EventInfo;
    event: EventScoringReport | null;
}

function removeTabAndPanel(tabLinkElement: HTMLAnchorElement): void {
    tabLinkElement.parentElement?.remove();
}

export default function EventScoringReportLoader({ parentTabId, eventInfo, event }: Props) {

    const reportState = useStore(sharedEventScoringReportState);
    useStore(sharedPrintConfiguration); // Registering the hook.

    useEffect(() => {

        const initializeReport = (report: EventScoringReport) => {
            sharedEventScoringReportState.set(
                {
                    report: report,
                    error: null
                });

            const excelButton: HTMLElement | null = document.getElementById("excel-export-button");
            if (excelButton) {
                excelButton.removeAttribute("disabled");
            }

            const printButton: HTMLElement | null = document.getElementById(`${PrintDialogModalId}-button`);
            if (printButton) {
                printButton.removeAttribute("disabled");
            }
        };

        if (!reportState) {

            if (event) {
                // The event is already loaded and just needs to be initialized.
                initializeReport(event);
                return;
            }

            // If the report is not already loaded, fetch it in the background
            fetch(`https://scores.biblequiz.com/api/v1.0/reports/Events/${eventInfo.id}/ScoringReport`)
                .then(async (response) => {
                    const body = await response.json();
                    if (response.ok) {
                        initializeReport(body);
                    } else {
                        sharedEventScoringReportState.set(
                            {
                                report: null,
                                error: body.Message || "Failed to download the report for unknown reasons."
                            });
                    }
                })
                .catch((error) => {
                    sharedEventScoringReportState.set({ report: null, error: `Unknown error occurred: ${error}` });
                });
        }
    }, [eventInfo.id, reportState]);

    // React based on the state of the report.
    const parentTab = document.getElementById(parentTabId) as HTMLDivElement;
    if (reportState) {

        if (reportState.error) {

            // The report failed to load.
            if (parentTab) {
                parentTab.style.display = "none";
            }

            return (<div role="alert" className="alert alert-warning">
                <FontAwesomeIcon icon="fas faTriangleExclamation" />
                <span>{reportState.error}</span>
            </div>);
        }
        else {

            // Drop the unsupported tabs.
            let hasStats = false;
            let hasQStats = false;
            for (let meet of reportState.report.Report.Meets) {

                // If there are any question stats, mark the flag.
                if (meet.HasQuestionStats) {
                    hasQStats = true;
                }

                if (meet.RankedQuizzers || meet.RankedTeams) {
                    hasStats = true;
                }
            }

            if (!hasStats || !hasQStats) {
                const tabLinks = parentTab.querySelectorAll(`li > a[role="tab"]`);
                if (!hasQStats) {
                    removeTabAndPanel(tabLinks[3] as HTMLAnchorElement);
                }

                if (!hasStats) {
                    removeTabAndPanel(tabLinks[0] as HTMLAnchorElement);
                }
            }

            // The report is known, so the tabs can be displayed
            if (parentTab) {
                parentTab.style.display = "";
            }

            return <div />;
        }
    } else {
        // If the report is loading, the tabs should be hidden
        if (parentTab) {
            parentTab.style.display = "none";
        }

        // Show a loading indicator for the event
        return (
            <div>
                <span className="loading loading-dots loading-xl"></span>
                &nbsp;
                <span className="text-lg">
                    <i>Loading Stats and Schedules for Event ...</i>
                </span>
            </div>
        );
    }
}