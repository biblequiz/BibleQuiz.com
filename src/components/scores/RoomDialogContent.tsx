import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import { sharedRoomScoringReportState } from "utils/SharedState";
import { RoomScoringReport, RoomScoringReportTeam, RoomScoringReportQuizzer, QuizzedOutState } from "types/RoomScoringReport";
import FontAwesomeIcon from "../FontAwesomeIcon";
import { ReportService } from 'types/services/ReportService';
import type { RemoteServiceError } from 'types/services/RemoteServiceUtility';

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

            ReportService
                .getRoomScoringReport(
                    null, // No auth
                    eventId,
                    databaseId,
                    meetId,
                    matchId,
                    roomId)
                .then(report =>
                    sharedRoomScoringReportState.set(
                        {
                            criteria: reportState.criteria,
                            report: report,
                            error: null
                        }))
                .catch((error: RemoteServiceError) => {
                    sharedRoomScoringReportState.set({
                        criteria: null,
                        report: null,
                        error: `Unknown error occurred: ${error.message}`
                    });
                });
        }
    }, [reportState]);

    if (reportState?.error) {
        return (<div role="alert" className="alert alert-error">
            <FontAwesomeIcon icon="fas faCircleXmark" />
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

    const handleRefreshClick = () => {
        sharedRoomScoringReportState.set(
            {
                criteria: reportState.criteria,
                report: null,
                error: null
            });
    };

    return (
        <div className="overflow-x-auto overflow-y-auto">
            <p className="text-xl font-bold">
                <button type="button" className="btn btn-sm btn-primary" onClick={handleRefreshClick}>
                    <FontAwesomeIcon icon="fas faArrowsRotate" />
                </button>&nbsp;
                {reportState.criteria.label}
            </p>
            {(report.CurrentQuestion != null || report.IsCompleted) && (
                <p className="text-xs ml-2">
                    <b>CURRENT QUESTION:</b>&nbsp;
                    {report.IsCompleted && (
                        <span className="done">[ COMPLETED ]</span>)}
                    {!report.IsCompleted && (
                        <>
                            <span>[ {report.CurrentQuestion} ]</span>
                            {totalRemaining > 0 && (
                                <>
                                    <br />
                                    <b>REMAINING:</b> <span> {totalRemaining} points ({remainingPointCounts.join(", ")})</span>
                                </>)}
                        </>)}
                    {report.StartTime != null && (report.RemainingTime != null || report.EndTime != null) && (
                        <>
                            <br />
                            <b>Timer Started:</b> {report.StartTime}
                            {report.RemainingTime != null && (
                                <>
                                    <br />
                                    <span><b>Timer Remaining:</b> <mark> {report.RemainingTime} </mark></span>
                                </>)}
                            {report.EndTime != null && (
                                <>
                                    <br />
                                    <span><b>Timer Stopped:</b>  {report.EndTime}</span>
                                </>)}
                        </>)}
                </p>)}
            <table className="table table-xs table-nowrap">
                {report.RedTeam && (
                    <RoomDialogTeamTable primaryRowClass="red-room-score" team={report.RedTeam} report={report} addSpace={false} />
                )}
                {report.GreenTeam && (
                    <RoomDialogTeamTable primaryRowClass="green-room-score" team={report.GreenTeam} report={report} addSpace={true} />
                )}
            </table>
        </div>);
};

interface TableProps {
    primaryRowClass: string;
    team: RoomScoringReportTeam;
    addSpace: boolean;
    report: RoomScoringReport;
}

function getContestInfo(maxNumber: number | null): { hasContestType: boolean, numberSuffix: string | null } {
    if (null === maxNumber) {
        return { hasContestType: true, numberSuffix: null };
    }
    else if (maxNumber <= 0) {
        return { hasContestType: false, numberSuffix: null };
    }
    else {
        return { hasContestType: true, numberSuffix: ` of ${maxNumber}` };
    }
}

function formatPoints(points: number | null, showZeros: boolean) {
    if ((points == 0 && !showZeros) || points === undefined || points === null) {
        return (<span>&nbsp;</span>);
    }
    else if (points < 0) {
        return (<span className="circle">{points}</span>);
    }
    else {
        return (<span>{points}</span>);
    }
}

function RoomDialogTeamTable({ primaryRowClass, team, addSpace, report }: TableProps) {

    const totalColumns = 5 + report.TotalQuestionCount;

    const successfulContest = getContestInfo(report.Rules.ContestRules.MaxSuccessfulContests);
    const unsuccessfulContest = getContestInfo(report.Rules.ContestRules.MaxUnsuccessfulContests);

    let currentRowClass = primaryRowClass;
    function swapRowClass() {
        if (primaryRowClass === currentRowClass) {
            currentRowClass = primaryRowClass + "-alt";
        }
        else {
            currentRowClass = primaryRowClass;
        }

        return currentRowClass;
    }

    return (
        <tbody>
            {addSpace && (
                <tr className="border-none">
                    <td className="border-none pt-0 pb-0" colSpan={totalColumns}>&nbsp;</td>
                </tr>)}
            <tr className="border-none">
                <td className="border-none pt-0 pb-0" colSpan={totalColumns}>
                    {team.TotalPoints} : {team.Name} ( {team.ChurchName} )<br />
                    <b>Timeouts:</b> {team.Timeouts} of {report.Rules.MaxTimeouts}
                    {report.IsCompleted && (
                        <>&nbsp;- <span className="done">[ COMPLETED ]</span></>)}<br />
                    {successfulContest.hasContestType && (
                        <>
                            <span className="font-bold">{unsuccessfulContest.hasContestType ? "Successful " : ""}{report.Rules.ContestRules.ContestLabel}</span>&nbsp;
                            {team.SuccessfulContests}{successfulContest.numberSuffix}
                            <br />
                        </>)}
                    {unsuccessfulContest.hasContestType && (
                        <>
                            <span className="font-bold">{unsuccessfulContest.hasContestType ? "Unsuccessful " : ""}{report.Rules.ContestRules.ContestLabel}</span>&nbsp;
                            {team.UnsuccessfulContests}{unsuccessfulContest.numberSuffix}
                            <br />
                        </>)}
                    &nbsp;
                </td>
            </tr>
            <tr>
                <td className="font-bold">#</td>
                <td className="font-bold">Quizzer</td>
                <td className="font-bold">Total</td>
                <td className="font-bold">Fouls</td>
                <td className="font-bold">QO</td>
                {Array.from({ length: report.TotalQuestionCount }, (_, q) => {

                    let pointClass = "";
                    switch (report.PointValues[q + 1]) {
                        case 10:
                            pointClass = "header-point-10";
                            break;
                        case 20:
                            pointClass = "header-point-20";
                            break;
                        case 30:
                            pointClass = "header-point-30";
                            break;
                        default:
                            pointClass = "header-point-default";
                            break;
                    }

                    if (!report.IsCompleted && report.CurrentQuestion == q + 1) {
                        pointClass += " current-question-top";
                    }
                    else {
                        pointClass += " border border-gray-300";
                    }

                    const questionLabel: string = q + 1 <= report.RegularQuestionCount
                        ? (q + 1).toString()
                        : "OT";

                    return (
                        <td className={`font-bold text-center ${pointClass}`} key={`${primaryRowClass}-header-${q}`}>
                            {questionLabel}
                        </td>);
                })}
            </tr>
            {team.Quizzers.map((quizzer: RoomScoringReportQuizzer, index: number) => {
                if (index !== 0) {
                    swapRowClass();
                }

                let quizOutClass = "";
                switch (quizzer.QuizzedOutState) {
                    case QuizzedOutState[QuizzedOutState.QuizzedOutForward]:
                        quizOutClass = "quiz-out";
                        break;
                    case QuizzedOutState[QuizzedOutState.QuizzedOutBackward]:
                        quizOutClass = "strike-out";
                        break;
                }

                return (
                    <tr key={`${primaryRowClass}-quizzer-${quizzer.Id}`} className={currentRowClass}>
                        <td className={quizOutClass}>{quizzer.Position ?? "_"}</td>
                        <td className={quizOutClass}>{quizzer.Name}</td>
                        <td className={`text-center ${quizOutClass}`}>
                            {formatPoints(quizzer.TotalPoints, true)}
                        </td>
                        <td className={`text-center ${quizOutClass}`}>
                            {formatPoints(quizzer.Fouls, false)}
                        </td>
                        <td className={`text-center ${quizOutClass}`}>
                            {quizzer.QuizzedOutState === QuizzedOutState[QuizzedOutState.NotQuizzedOut] ? (<>&nbsp;</>) : "*"}
                        </td>
                        {Array.from({ length: report.TotalQuestionCount }, (_, q) => {
                            const points = quizzer.Questions[q + 1];

                            let pointClass = "";
                            if (points) {
                                switch (report.PointValues[q + 1]) {
                                    case -5:
                                    case 10:
                                        pointClass = "header-point-10";
                                        break;
                                    case -10:
                                    case 20:
                                        pointClass = "header-point-20";
                                        break;
                                    case -15:
                                    case 30:
                                        pointClass = "header-point-30";
                                        break;
                                    default:
                                        pointClass = "header-point-default";
                                        break;
                                }
                            }

                            if (!report.IsCompleted && report.CurrentQuestion == q + 1) {
                                pointClass += " current-question-middle";
                            }
                            else {
                                pointClass += " border border-gray-300";
                            }

                            return (
                                <td className={`text-center ${pointClass}`} key={`${primaryRowClass}-quizzer-${index}-${q + 1}`}>
                                    {formatPoints(points, false)}
                                </td>);
                        })}
                    </tr>);
            })}
            <tr className={swapRowClass()}>
                <td className="font-bold">&nbsp;</td>
                <td className="font-bold">TEAM TOTALS</td>
                <td className="text-center">
                    {formatPoints(team.TotalPoints, true)}
                </td>
                <td className="text-center">
                    {formatPoints(team.TotalFoulPoints, false)}
                </td>
                <td className="text-center">
                    &nbsp;
                </td>
                {Array.from({ length: report.TotalQuestionCount }, (_, q) => {
                    const currentCellClass = !report.IsCompleted && report.CurrentQuestion == q + 1
                        ? "current-question-bottom"
                        : "border border-gray-300";

                    return (
                        <td key={`${primaryRowClass}-total-${q}`} className={currentCellClass}>&nbsp;</td>);
                })}
            </tr>
        </tbody >);
}