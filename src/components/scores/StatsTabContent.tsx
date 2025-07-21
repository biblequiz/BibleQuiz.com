import { ScoringReportMeet } from "@types/EventScoringReport";

import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState, StatsFormat } from "@utils/SharedState";
import CollapsableMeetSection from "@components/scores/CollapsableMeetSection";
import MeetProgressNotification from "@components/scores/MeetProgressNotification";
import type { ScoringReportFootnote } from "@types/EventScoringReport";
import type { EventScoresProps } from "@utils/Scores";

function formatFootnotes(keyPrefix: string, footnotes: ScoringReportFootnote[] | null, hasTie: boolean): JSX.Element {
    return (
        <>
            {footnotes && footnotes.length > 0 && (
                <div>
                    {footnotes.map((footnote: ScoringReportFootnote, index: number) => (
                        <div className="mt-0" key={`${keyPrefix}_${index}`}>
                            {footnote.Symbol.trim()} {footnote.Text}
                        </div>))}
                </div>)}
            {hasTie && (
                <div className="mt-0">
                    <i>* Tie couldn't be broken by tie breaking rules.</i>
                </div>)}
        </>);
}

export default function StatsTabContent({ event, isPrinting, printingStatsFormat }: EventScoresProps) {

    event ??= useStore(sharedEventScoringReportState)?.report;
    if (!event) {
        return (<span>Event is Loading ...</span>);
    }

    let sectionIndex: number = 0;

    return (
        <>
            {event.Report.Meets.map((meet: ScoringReportMeet) => {

                let hasTeamTie = false;
                let hasQuizzerTie = false;

                const hasRankedTeams = meet.RankedTeams && meet.RankedTeams.length > 0 &&
                    (!isPrinting || printingStatsFormat === StatsFormat.TeamsAndQuizzers || printingStatsFormat === StatsFormat.TeamsOnly);

                const hasRankedQuizzers = meet.RankedQuizzers && meet.RankedQuizzers.length > 0 &&
                    (!isPrinting || printingStatsFormat === StatsFormat.TeamsAndQuizzers || printingStatsFormat === StatsFormat.QuizzersOnly);

                if (!hasRankedTeams && !hasRankedQuizzers) {
                    return null;
                }

                return (
                    <CollapsableMeetSection
                        meet={meet}
                        pageId="stats"
                        showCombinedName={false}
                        showMeetStatus={true}
                        isPrinting={isPrinting}
                        printSectionIndex={sectionIndex++}
                        key={`stats_${meet.DatabaseId}_${meet.MeetId}`}>

                        {hasRankedTeams && (
                            <div>
                                <MeetProgressNotification meet={meet} />
                                <p className="text-lg"><b>Teams</b></p>
                                <table className="table table-s table-nowrap">
                                    <thead>
                                        <tr>
                                            <th className="text-right">#</th>
                                            <th>Team (Church)</th>
                                            <th className="text-right">W</th>
                                            <th className="text-right">L</th>
                                            <th className="text-right">W%</th>
                                            <th className="text-right">Total</th>
                                            <th className="text-right">Avg</th>
                                            <th className="text-right">QO</th>
                                            <th className="text-right">Q%</th>
                                            <th className="text-right">30s</th>
                                            <th className="text-right">20s</th>
                                            <th className="text-right">10s</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {meet.RankedTeams.map((teamId: number) => {
                                            const team = meet.Teams[teamId];

                                            if (team.Scores.FootnoteIndex == null && team.Scores.IsTie) {
                                                hasTeamTie = true;
                                            }

                                            return (
                                                <tr className="hover:bg-base-300" key={`team_${meet.DatabaseId}_${meet.MeetId}_${teamId}`}>
                                                    <th className="text-right">
                                                        {team.Scores.FootnoteIndex != null && (
                                                            <b>
                                                                {meet.TeamFootnotes[team.Scores.FootnoteIndex].Symbol}{team.Scores.Rank}
                                                            </b>)}
                                                        {team.Scores.FootnoteIndex == null && team.Scores.IsTie && (
                                                            <b>
                                                                {team.Scores.Rank}
                                                            </b>)}
                                                        {team.Scores.FootnoteIndex == null && !team.Scores.IsTie && (
                                                            <span>{team.Scores.Rank}</span>)}
                                                    </th>
                                                    <th>
                                                        {team.Name}<br />
                                                        <span className="font-normal italic">{team.ChurchName}</span>
                                                    </th>
                                                    <td className="text-right">{team.Scores.Wins}</td>
                                                    <td className="text-right">{team.Scores.Losses}</td>
                                                    <td className="text-right">{team.Scores.WinPercentage}%</td>
                                                    <td className="text-right">{team.Scores.TotalPoints}</td>
                                                    <td className="text-right">{team.Scores.AveragePoints ? team.Scores.AveragePoints : (<>&nbsp;</>)}</td>
                                                    <td className="text-right">{team.Scores.QuizOuts ? team.Scores.QuizOuts : (<>&nbsp;</>)}</td>
                                                    <td className="text-right">{team.Scores.QuestionCorrectPercentage ? (<span>{team.Scores.QuestionCorrectPercentage}%</span>) : (<>&nbsp;</>)}</td>
                                                    <td className="text-right">{team.Scores.Correct30s ? team.Scores.Correct30s : (<>&nbsp;</>)}</td>
                                                    <td className="text-right">{team.Scores.Correct20s ? team.Scores.Correct20s : (<>&nbsp;</>)}</td>
                                                    <td className="text-right">{team.Scores.Correct10s ? team.Scores.Correct10s : (<>&nbsp;</>)}</td>
                                                </tr>);
                                        })}
                                    </tbody>
                                </table>
                                {formatFootnotes(`${meet.DatabaseId}_${meet.MeetId}_teamfoot`, meet.TeamFootnotes, hasTeamTie)}
                            </div>)}
                        {hasRankedQuizzers && (
                            <div className={hasRankedTeams && hasRankedQuizzers && isPrinting ? "page-break-before" : ""}>
                                <p className="text-lg"><b>Quizzers</b></p>
                                <table className="table table-s table-nowrap">
                                    <thead>
                                        <tr>
                                            <th className="text-right">#</th>
                                            <th>Quizzer</th>
                                            <th>Team (Church)</th>
                                            {meet.ShowYearsQuizzing && (
                                                <th className="text-right">Yrs</th>)}
                                            <th className="text-right">Total</th>
                                            <th className="text-right">Avg</th>
                                            <th className="text-right">QO</th>
                                            <th className="text-right">Q%</th>
                                            <th className="text-right">30s</th>
                                            <th className="text-right">20s</th>
                                            <th className="text-right">10s</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {meet.RankedQuizzers.map((quizzerId: number) => {
                                            const quizzer = meet.Quizzers[quizzerId];

                                            if (quizzer.Scores.FootnoteIndex == null && quizzer.Scores.IsTie) {
                                                hasQuizzerTie = true;
                                            }

                                            return (
                                                <tr className="hover:bg-base-300" key={`quizzer_${meet.DatabaseId}_${meet.MeetId}_${quizzerId}`}>
                                                    <th className="text-right">
                                                        {quizzer.Scores.FootnoteIndex != null && (
                                                            <b>
                                                                {meet.QuizzerFootnotes[quizzer.Scores.FootnoteIndex].Symbol}{quizzer.Scores.Rank}
                                                            </b>)}
                                                        {quizzer.Scores.FootnoteIndex == null && quizzer.Scores.IsTie && (
                                                            <b>
                                                                {quizzer.Scores.Rank}
                                                            </b>)}
                                                        {quizzer.Scores.FootnoteIndex == null && !quizzer.Scores.IsTie && (
                                                            <span>{quizzer.Scores.Rank}</span>)}
                                                    </th>
                                                    <th>{quizzer.Name}</th>
                                                    <td>
                                                        {quizzer.TeamName}<br />
                                                        <span className="font-normal italic">{quizzer.ChurchName}</span>
                                                    </td>
                                                    {meet.ShowYearsQuizzing && (
                                                        <td className="text-right">
                                                            {quizzer.YearsQuizzing == null ? (<>&nbsp;</>) : quizzer.YearsQuizzing}
                                                        </td>)}
                                                    <td className="text-right">{quizzer.Scores.TotalPoints}</td>
                                                    <td className="text-right">{quizzer.Scores.AveragePoints ? quizzer.Scores.AveragePoints : (<>&nbsp;</>)}</td>
                                                    <td className="text-right">{quizzer.Scores.QuizOuts ? quizzer.Scores.QuizOuts : (<>&nbsp;</>)}</td>
                                                    <td className="text-right">{quizzer.Scores.QuestionCorrectPercentage ? (<span>{quizzer.Scores.QuestionCorrectPercentage}%</span>) : (<>&nbsp;</>)}</td>
                                                    <td className="text-right">{quizzer.Scores.Correct30s ? quizzer.Scores.Correct30s : (<>&nbsp;</>)}</td>
                                                    <td className="text-right">{quizzer.Scores.Correct20s ? quizzer.Scores.Correct20s : (<>&nbsp;</>)}</td>
                                                    <td className="text-right">{quizzer.Scores.Correct10s ? quizzer.Scores.Correct10s : (<>&nbsp;</>)}</td>
                                                </tr>);
                                        })}
                                    </tbody>
                                </table>
                                {formatFootnotes(`${meet.DatabaseId}_${meet.MeetId}_quizzerfoot`, meet.QuizzerFootnotes, hasQuizzerTie)}
                            </div>)}
                    </CollapsableMeetSection>);
            })}
        </>);
};
