import { ScoringReportMeet, ScoringReportTeam, ScoringReportTeamMatch, ScoringReportMeetMatch } from "@types/EventScoringReport";

import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState } from "@utils/SharedState";
import CollapsableMeetSection from "./CollapsableMeetSection";
import RoomLink from "./RoomDialogLink";
import { EventScoringReport } from "@types/EventScoringReport";

export interface Props {
    eventId: string;
    event?: EventScoringReport;
    isPrinting?: boolean;
    printSinglePerPage?: boolean;
    printStats?: boolean;
};

export default function ScheduleGridTabContent({ eventId, event, isPrinting, printSinglePerPage, printStats }: Props) {

    event ??= useStore(sharedEventScoringReportState)?.report;
    if (!event) {
        return (<span>Event is Loading ...</span>);
    }

    let sectionIndex = 0;

    return (
        <>
            {event.Report.Meets.map((meet: ScoringReportMeet) => {

                const key = `schedulegrid_${meet.DatabaseId}_${meet.MeetId}`;
                if (meet.IsCombinedReport) {
                    return null;
                }

                let teams: ScoringReportTeam[] | number[];
                let hasRankedTeams: boolean;
                if (meet.RankedTeams && (!isPrinting || printStats)) {
                    teams = meet.RankedTeams;
                    hasRankedTeams = true;
                }
                else {
                    teams = meet.Teams;
                    hasRankedTeams = false;
                }

                let hasAnyMatchTimes = false;
                for (let match of meet.Matches) {
                    const matchTime = match.MatchTime;
                    if (matchTime) {
                        hasAnyMatchTimes = true;
                        break;
                    }
                }

                const footerColSpan = hasRankedTeams ? 6 : 1;

                return (
                    <CollapsableMeetSection
                        meet={meet}
                        showCombinedName={false}
                        showMeetStatus={false}
                        pageId="schedulegrid"
                        isPrinting={isPrinting}
                        printSectionIndex={sectionIndex++}
                        key={key}>

                        <table className="table table-s table-nowrap">
                            <thead>
                                <tr>
                                    {hasRankedTeams && <th className="text-right">#</th>}
                                    <th>Team</th>
                                    {hasRankedTeams &&
                                        (<>
                                            <th className="text-right">W</th>
                                            <th className="text-right">L</th>
                                            <th className="text-right">Total</th>
                                            <th className="text-right">Avg</th>
                                        </>)}
                                    {meet.Matches.map((match: ScoringReportMeetMatch) => (
                                        <th className="text-center" key={`${key}_matchheader_${match.Id}`}>
                                            {null != match.PlayoffIndex ? `P${match.PlayoffIndex}` : match.Id}
                                        </th>))}
                                </tr>
                            </thead>
                            <tbody>
                                {teams.map((teamId: ScoringReportTeam | number, teamIndex: number) => {
                                    const team = hasRankedTeams
                                        ? meet.Teams[teamId as number]
                                        : teamId as ScoringReportTeam;

                                    return (
                                        <tr key={`${key}_teams_${teamIndex}`} className="hover:bg-base-300">
                                            {hasRankedTeams && (
                                                <td className="text-right">
                                                    {team.Scores.Rank}{team.Scores.IsTie ? '*' : ''}
                                                </td>)}
                                            <td>{team.Name}</td>
                                            {hasRankedTeams && (
                                                <>
                                                    <td className="text-right">{team.Scores.Wins}</td>
                                                    <td className="text-right">{team.Scores.Losses}</td>
                                                    <td className="text-right">{team.Scores.TotalPoints}</td>
                                                    <td className="text-right">{team.Scores.AveragePoints}</td>
                                                </>)}
                                            {team.Matches.map((match: ScoringReportTeamMatch, matchIndex: number) => {
                                                const matchKey = `${key}_teams_${teamIndex}match_${teamIndex}_matches_${matchIndex}`;
                                                if (null == match) {
                                                    return (<td key={matchKey}>--</td>);
                                                }

                                                const isLiveMatch = null != match.CurrentQuestion;

                                                const resolvedMeet = !meet.HasLinkedMeets || null == match.LinkedMeet
                                                    ? meet
                                                    : event.Report.Meets[match.LinkedMeet];

                                                const resolvedMatch = resolvedMeet.Matches[matchIndex];

                                                let badgeClass: string;
                                                switch (match.Result) {
                                                    case "W":
                                                        badgeClass = "badge-outline badge-primary";
                                                        break;
                                                    case "L":
                                                        badgeClass = "badge-error";
                                                        break;
                                                    default:
                                                        badgeClass = "badge-ghost";
                                                        break;
                                                }

                                                return (
                                                    <td className="text-center" key={matchKey}>
                                                        {!isLiveMatch && match.Score == null && (<span>{match.Room}</span>)}
                                                        {(isLiveMatch || match.Score != null) && (
                                                            <RoomLink id={matchKey} label={`Match ${resolvedMatch.Id} in ${match.Room} @ ${resolvedMeet.Name}`} eventId={eventId} databaseId={resolvedMeet.DatabaseId} meetId={resolvedMeet.MeetId} matchId={resolvedMatch.Id} roomId={match.RoomId}>
                                                                {match.Room}
                                                                {isLiveMatch && (
                                                                    <>
                                                                        <br />
                                                                        <span className="italic">#{match.CurrentQuestion}</span>
                                                                    </>)}
                                                                {!isLiveMatch && hasRankedTeams && match.Score != null && (
                                                                    <>
                                                                        <br />
                                                                        <span className={`badge badge-xs ${badgeClass}`}>
                                                                            {match.Score}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </RoomLink>)}
                                                    </td>
                                                )
                                            })}
                                        </tr>);
                                })}
                            </tbody>
                            {hasAnyMatchTimes && (
                                <tfoot>
                                    <tr>
                                        <th colSpan={footerColSpan}>Planned Start Time for Match</th>
                                        {meet.Matches.map((match: ScoringReportMeetMatch, matchIndex: number) => (
                                            <th className="text-center" key={`${key}_footer_${matchIndex}`}>
                                                {match.MatchTime ? match.MatchTime : "--"}
                                            </th>))}
                                    </tr>
                                </tfoot>)}
                        </table>
                        <table className="table table-s table-nowrap page-break-before">
                            <thead>
                                <tr>
                                    <th>Team / Coach</th>
                                    <th colSpan={2}>Quizzers</th>
                                </tr>
                            </thead>
                            <tbody>
                                {meet.Teams.map((team: ScoringReportTeam, teamIndex: number) => {

                                    const column1Count = team.Quizzers.length > 0
                                        ? Math.ceil(team.Quizzers.length / 2)
                                        : 0;

                                    const column2Count = team.Quizzers.length - column1Count;

                                    const column1ColSpan = column2Count > 0 ? 1 : 2;

                                    return (
                                        <tr key={`${key}_roster_${teamIndex}`}>
                                            <td>
                                                <span className="font-bold">{team.Name}</span>
                                                <br />
                                                <span className="italic">{team.ChurchName}</span>
                                                {team.CoachName && (
                                                    <>
                                                        <br />
                                                        <span>Coach: {team.CoachName}</span>
                                                    </>)}
                                            </td>
                                            <td colSpan={column1ColSpan}>
                                                {Array.from({ length: column1Count }, (_, q) => {
                                                    const quizzerKey = `${key}_quizzer_c1_${q}`;
                                                    return (
                                                        <span key={quizzerKey}>
                                                            {q > 0 && <br />}
                                                            <span>{meet.Quizzers[team.Quizzers[q]].Name}</span>
                                                        </span>);
                                                })}
                                            </td>
                                            {column2Count > 0 && (
                                                <td>
                                                    {Array.from({ length: column2Count }, (_, q) => {
                                                        const quizzerKey = `${key}_quizzer_c2_${q}`;
                                                        return (
                                                            <span key={quizzerKey}>
                                                                {q > 0 && <br />}
                                                                <span>{meet.Quizzers[team.Quizzers[q + column1Count]].Name}</span>
                                                            </span>);
                                                    })}
                                                </td>)}
                                        </tr>);
                                })}
                            </tbody>
                        </table>
                    </CollapsableMeetSection>);
            })}
        </>);
};

