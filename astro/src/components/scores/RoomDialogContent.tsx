import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import { sharedRoomScoringReportState } from "@utils/SharedState";
import { RoomScoringReportTeam } from "@types/RoomScoringReport";

export default function RoomDialogContent() {

    const reportState = useStore(sharedRoomScoringReportState);
    useEffect(() => {
        // If the report is not already loaded, fetch it in the background
        if (reportState?.criteria) {
            const { eventId, databaseId, meetId, matchId, roomId } = reportState.criteria;

            if (reportState.report !== null) {
                // The report is already loaded, no need to fetch it again.
                return;
            }

            fetch(`https://scores.biblequiz.com/api/v1.0/reports/Events/${eventId}/ScoringReport/${databaseId}/${meetId}/${matchId}/${roomId}`)
                .then(async (response) => {
                    const body = await response.json();
                    if (response.ok) {
                        sharedRoomScoringReportState.set(
                            {
                                criteria: reportState.criteria,
                                report: body,
                                error: null
                            });
                    } else {
                        sharedRoomScoringReportState.set(
                            {
                                criteria: null,
                                report: null,
                                error: body.Message || "Failed to download the report for unknown reasons."
                            });
                    }
                })
                .catch((error) => {
                    sharedRoomScoringReportState.set({ report: null, error: `Unknown error occurred: ${error}` });
                });
        }
    }, [reportState]);

    if (reportState?.error) {
        return (<div role="alert" className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{reportState.error}</span>
        </div>);
    }
    else if (!reportState || !reportState.report || !reportState.criteria) {
        return (
            <div className="text-center">
                <span className="loading loading-dots loading-xl"></span>
                &nbsp;
                <span className="text-lg">
                    <i>Loading Scores for Room ...</i>
                </span>
            </div>);
    }

    const report = reportState.report;

    let totalRemaining: number = 0;
    let remainingPointCounts: string[] = [];
    if (report.RemainingPoints) {
        for (const pointValue in report.RemainingPoints) {
            const count: number = Math.max(0, report.RemainingPoints[pointValue]);
            if (count <= 0) {
                continue;
            }

            remainingPointCounts.push(`${count} x ${pointValue}`);
            totalRemaining += parseInt(pointValue) * count;
        }
    }

    return (
        <div className="overflow-x-auto overflow-y-auto">
            <p className="text-xl font-bold">{reportState.criteria.label}</p>
            {(report.CurrentQuestion != null || report.IsCompleted) && (
                <p className="text-xs ml-2">
                    <b>CURRENT QUESTION:</b>&nbsp;
                    {report.IsCompleted && (
                        <span className="done">[ COMPLETED ]</span>)}
                    {!report.IsCompleted && (
                        <>
                            <span>[ {report.CurrentQuestion} ]</span>
                            <br />
                            <b>REMAINING:</b> <span> {totalRemaining} points ({remainingPointCounts.join(", ")})</span>
                        </>)}
                    {report.StartTime != null && (report.RemainingTime != null || report.EndTime != null) && (
                        <>
                            <br />
                            <b>TIMER:</b> Started: {report.StartTime}
                            {report.RemainingTime != null && (
                                <span>Remaining: <mark><b> {report.RemainingTime} </b></mark></span>)}
                            {report.EndTime != null && (
                                <span>Stopped: {report.EndTime}</span>)}
                        </>)}
                </p>)}
            <table className="table table-xs table-nowrap">
                {report.RedTeam && (
                    <RoomDialogTeamTable primaryRowClass="red-room-score" team={report.RedTeam} addSpace={false} />
                )}
                {report.GreenTeam && (
                    <RoomDialogTeamTable primaryRowClass="green-room-score" team={report.GreenTeam} addSpace={true} />
                )}
            </table>
        </div>);
};

interface TableProps {
    primaryRowClass: string;
    team: RoomScoringReportTeam;
    addSpace: boolean;
    totalColumns: number;
}

function RoomDialogTeamTable({ primaryRowClass, team, addSpace, totalColumns }: TableProps) {

    return (
        <tbody>
            {addSpace && (
                <tr className="border-none">
                    <td className="border-none pt-0 pb-0" colSpan={totalColumns}>&nbsp;</td>
                </tr>)}
            <tr className="border-none">
                <td className="border-none pt-0 pb-0" colSpan={totalColumns}>
                    135 : New Life Church (Colorado Springs) #1 ( New Life Church )<br />
                    <b>Timeouts:</b> 0 of 3 - <span className="done">[ COMPLETED ]</span><br />
                    <b>Successful Contests:</b> 0<br />
                    <b>Unsuccessful Contests:</b> 0<br />
                    &nbsp;
                </td>
            </tr>
            <tr>
                <td className="font-bold">#</td>
                <td className="font-bold">Quizzer</td>
                <td className="font-bold">Total</td>
                <td className="font-bold">Fouls</td>
                <td className="font-bold">QO</td>
                <td className="font-bold">1</td>
                <td className="font-bold">2</td>
                <td className="font-bold">3</td>
                <td className="font-bold">4</td>
                <td className="font-bold">5</td>
                <td className="font-bold">6</td>
                <td className="font-bold">7</td>
                <td className="font-bold">8</td>
                <td className="font-bold">9</td>
                <td className="font-bold">10</td>
                <td className="font-bold">11</td>
                <td className="font-bold">12</td>
                <td className="font-bold">13</td>
                <td className="font-bold">14</td>
                <td className="font-bold">15</td>
                <td className="font-bold">16</td>
                <td className="font-bold">17</td>
                <td className="font-bold">18</td>
                <td className="font-bold">19</td>
                <td className="font-bold">20</td>
            </tr>
        </tbody>);
}