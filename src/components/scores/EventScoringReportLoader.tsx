import { useEffect } from "react";
import Fuse from "fuse.js";
import { useStore } from "@nanostores/react";
import { EventScoringReport, ScoringReportTeam, ScoringReportMeet, ScoringReportQuizzer } from 'types/EventScoringReport';
import type { EventInfo } from 'types/EventTypes';
import type { RemoteServiceError } from 'types/services/RemoteServiceUtility';
import { ReportService } from 'types/services/ReportService';
import { TeamAndQuizzerFavorites } from 'types/TeamAndQuizzerFavorites';
import { sharedEventScoringReportState, sharedPrintConfiguration, type EventScoringReportSearchIndexItem } from 'utils/SharedState';
import FontAwesomeIcon from "../FontAwesomeIcon";
import { PrintDialogModalId } from "./PrintDialogContent";

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

            const teamIndexSource: EventScoringReportSearchIndexItem<ScoringReportTeam>[] = [];
            const teamIndexMeets: Record<string, ScoringReportMeet[]> = {};

            const quizzerIndexSource: EventScoringReportSearchIndexItem<ScoringReportQuizzer>[] = [];
            const quizzerIndexMeets: Record<string, ScoringReportMeet[]> = {};

            for (const meet of report.Report.Meets) {
                if (meet.Teams) {
                    for (const team of meet.Teams) {

                        let teamMeets = teamIndexMeets[team.Id] || null;

                        // If the meets don't exist, this is the first time we have seen this team
                        // and it needs to be added to the index.
                        if (!teamMeets) {

                            teamMeets = [];
                            teamIndexMeets[team.Id] = teamMeets;

                            teamIndexSource.push({
                                meets: teamMeets,
                                item: team
                            });
                        }

                        // Add the meet for this item.
                        teamMeets.push(meet);
                    }
                }

                if (meet.Quizzers) {
                    for (const quizzer of meet.Quizzers) {

                        let quizzerMeets = quizzerIndexMeets[quizzer.Id] || null;

                        // If the meets don't exist, this is the first time we have seen this quizzer
                        // and it needs to be added to the index.
                        if (!quizzerMeets) {

                            quizzerMeets = [];
                            quizzerIndexMeets[quizzer.Id] = quizzerMeets;

                            quizzerIndexSource.push({
                                meets: quizzerMeets,
                                item: quizzer
                            });
                        }

                        // Add the meet for this item.
                        quizzerMeets.push(meet);
                    }
                }
            }

            sharedEventScoringReportState.set(
                {
                    report: report,
                    favorites: TeamAndQuizzerFavorites.load(),
                    teamIndex: new Fuse<EventScoringReportSearchIndexItem<ScoringReportTeam>>(
                        teamIndexSource,
                        {
                            shouldSort: false,
                            includeScore: true,
                            ignoreLocation: true,
                            keys: ["item.Name", "item.ChurchName"],
                            threshold: 0.4
                        }),
                    quizzerIndex: new Fuse<EventScoringReportSearchIndexItem<ScoringReportQuizzer>>(
                        quizzerIndexSource,
                        {
                            shouldSort: false,
                            includeScore: true,
                            ignoreLocation: true,
                            keys: ["item.Name", "item.ChurchName", "item.TeamName"],
                            threshold: 0.4
                        }),
                    error: null
                });

            const excelButton: HTMLButtonElement | null = document.getElementById("excel-export-button") as HTMLButtonElement;
            if (excelButton) {
                excelButton.disabled = false;

                excelButton.addEventListener(
                    "click",
                    () => {
                        excelButton.disabled = true;

                        ReportService.downloadEventStatsExcelFile(
                            null, // No auth.
                            eventInfo.id,
                            `Stats - ${eventInfo.name}.xlsx`)
                            .then(() => {
                                excelButton.disabled = false;
                            })
                            .catch((error) => {
                                // eslint-disable-next-line no-console
                                console.error("Failed to download the excel file: ", error);
                                alert(`Failed to download the excel file: ${error}`);

                                excelButton.disabled = false;
                            });
                    });
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
            ReportService
                .getScoringReportForAllDatabases(
                    null, // No auth
                    eventInfo.id)
                .then(initializeReport)
                .catch((error: RemoteServiceError) => {
                    sharedEventScoringReportState.set(
                        {
                            report: null,
                            favorites: null!,
                            teamIndex: null,
                            quizzerIndex: null,
                            error: error.message || "Failed to download the report for unknown reasons.",
                        });
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
            for (let meet of reportState.report!.Report.Meets) {

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