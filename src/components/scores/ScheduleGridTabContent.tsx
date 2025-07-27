import { useEffect } from "react";
import { ScoringReportMeet, ScoringReportTeam, ScoringReportTeamMatch, ScoringReportMeetMatch } from "@types/EventScoringReport";

import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState, sharedEventScoringReportFilterState, showFavoritesOnlyToggle } from "@utils/SharedState";
import CollapsableMeetSection from "./CollapsableMeetSection";
import RoomLink from "./RoomDialogLink";
import { EventScoringReport } from "@types/EventScoringReport";
import { isTabActive } from "@utils/Tabs";
import type { TeamAndQuizzerFavorites } from "@types/TeamAndQuizzerFavorites";
import ToggleTeamOrQuizzerFavoriteButton from "./ToggleTeamOrQuizzerFavoriteButton";

export interface Props {
    eventId: string;
    event?: EventScoringReport;
    isPrinting?: boolean;
    printStats?: boolean;
    rootTabId: string;
    schedulesTabId: string;
};

export default function ScheduleGridTabContent({ eventId, event, isPrinting, printStats, rootTabId, schedulesTabId }: Props) {

    const scrollToViewElementId = `schedule_grid_scroll_elem`;

    const reportState = useStore(sharedEventScoringReportState);
    event ??= reportState?.report;
    const eventFilters = useStore(sharedEventScoringReportFilterState as any);
    const showOnlyFavorites: boolean = useStore(showFavoritesOnlyToggle);

    // Add an effect to scroll the item into view once it is loaded.
    useEffect(() => {
        const highlightCard = document.getElementById(scrollToViewElementId) as HTMLDivElement;
        if (isTabActive(rootTabId) && isTabActive(schedulesTabId) && highlightCard?.scrollIntoView) {
            highlightCard.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [eventFilters]);

    if (!event) {
        return (<span>Event is Loading ...</span>);
    }

    const favorites: TeamAndQuizzerFavorites = reportState.favorites;
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
                const forceOpen = eventFilters?.openMeetDatabaseId === meet.DatabaseId &&
                    eventFilters.openMeetMeetId === meet.MeetId;

                let teamRowCount = 0;

                const teamRows = teams.map((teamId: ScoringReportTeam | number, teamIndex: number) => {
                    const team = hasRankedTeams
                        ? meet.Teams[teamId as number]
                        : teamId as ScoringReportTeam;

                    let highlightColor: string = "";
                    if (!isPrinting) {
                        const isFavorite = favorites.teamIds.has(team.Id);
                        if (eventFilters?.highlightTeamId === team.Id) {
                            highlightColor = "bg-yellow-200";
                        }
                        else if (isFavorite) {
                            highlightColor = "bg-accent-100";
                        }

                        if (showOnlyFavorites && !isFavorite) {
                            return null;
                        }
                    }

                    teamRowCount++;

                    return (
                        <tr
                            key={`${key}_teams_${teamIndex}`}
                            id={highlightColor && forceOpen ? scrollToViewElementId : undefined}
                            className={`hover:bg-base-300 ${highlightColor}`}>
                            {hasRankedTeams && (
                                <td className="text-right">
                                    {team.Scores.Rank}{team.Scores.IsTie ? '*' : ''}
                                </td>)}
                            <td className="pl-0">
                                <ToggleTeamOrQuizzerFavoriteButton type="team" id={team.Id} showText={false} /> {team.Name}
                            </td>
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
                });

                const sectionBadges = [
                    {
                        className: "badge-lg badge-soft badge-primary",
                        icon: "fas faPeopleGroup",
                        text: teamRowCount.toString()
                    }];

                return (
                    <CollapsableMeetSection
                        meet={meet}
                        showCombinedName={false}
                        showMeetStatus={false}
                        pageId="schedulegrid"
                        isPrinting={isPrinting}
                        printSectionIndex={sectionIndex++}
                        forceOpen={forceOpen}
                        badges={sectionBadges}
                        key={key}>

                        <table className="table table-s table-nowrap">
                            <thead>
                                <tr>
                                    {hasRankedTeams && <th className="text-right">#</th>}
                                    <th className="pl-0">Team</th>
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
                                {teamRows}
                                {teamRowCount === 0 && (
                                    <tr>
                                        <td colSpan={footerColSpan + meet.Matches.length} className="text-center text-sm italic">
                                            No favorite teams found.
                                        </td>
                                    </tr>)}
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
                        {teamRowCount === 0 && (
                            <table className="table table-s table-nowrap page-break-before">
                                <thead>
                                    <tr>
                                        <th>Team / Coach</th>
                                        <th colSpan={2}>Quizzers</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {meet.Teams.map((team: ScoringReportTeam, teamIndex: number) => {

                                        if (!isPrinting &&
                                            showOnlyFavorites &&
                                            !favorites.teamIds.has(team.Id)) {

                                            return null;
                                        }

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
                            </table>)}
                    </CollapsableMeetSection>);
            })}
        </>);
};

