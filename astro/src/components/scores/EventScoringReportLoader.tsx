import { useEffect } from "react";
import type { EventInfo } from "@types/EventTypes";

import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState } from "@utils/SharedState";
import { ExcelDialogModalId } from "./ExcelDialogContent";
import { PrintDialogModalId } from "./PrintDialogContent";

interface Props {
    parentTabId: string;
    tabSyncKey: string;
    eventInfo: EventInfo;
}

function removeTabAndPanel(tabLinkElement: HTMLAnchorElement): void {
    tabLinkElement.parentElement?.remove();
}

export default function EventScoringReportLoader({ parentTabId, tabSyncKey, eventInfo }: Props) {

    const reportState = useStore(sharedEventScoringReportState);
    useEffect(() => {
        // If the report is not already loaded, fetch it in the background
        if (!reportState) {
            fetch(`https://scores.biblequiz.com/api/v1.0/reports/Events/${eventInfo.id}/ScoringReport`)
                .then(async (response) => {
                    const body = await response.json();
                    if (response.ok) {
                        sharedEventScoringReportState.set(
                            {
                                report: body,
                                error: null
                            });

                        const excelButton: HTMLButtonElement = document.getElementById(`${ExcelDialogModalId}-button`) as HTMLButtonElement;
                        if (excelButton) {
                            excelButton.disabled = false;
                        }

                        const printButton: HTMLButtonElement = document.getElementById(`${PrintDialogModalId}-button`) as HTMLButtonElement;
                        if (printButton) {
                            printButton.disabled = false;
                        }
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

            return (<div role="alert" className="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
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