import { ScoringReportMeet, ScoringReportTeam, ScoringReportTeamMatch, ScoringReportMeetMatch, ScoringReportQuizzer, ScoringReportQuizzerMatch, ScoringReportMatchState } from "types/EventScoringReport";
import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState, sharedEventScoringReportFilterState, showFavoritesOnlyToggle, type MeetReference } from "utils/SharedState";
import CollapsableMeetSection from './CollapsableMeetSection';
import RoomDialogLink from './RoomDialogLink';
import { EventScoringReport } from "types/EventScoringReport";
import { isTabActive } from "utils/Tabs";
import type { TeamAndQuizzerFavorites } from "types/TeamAndQuizzerFavorites";
import ToggleTeamOrQuizzerFavoriteButton from './ToggleTeamOrQuizzerFavoriteButton';
import { DataTypeHelpers } from "utils/DataTypeHelpers";

export interface Props {
    eventId: string;
    event?: EventScoringReport;
    isPrinting?: boolean;
    printStats?: boolean;
    schedulesTabId: string;
    selectedMeets?: MeetReference[];
};

export default function ScheduleGridTabContent({
    eventId,
    event,
    isPrinting,
    printStats,
    schedulesTabId,
    selectedMeets }: Props) {

    const scrollToViewElementId = `schedule_grid_scroll_elem`;

    const reportState = useStore(sharedEventScoringReportState);
    event ??= reportState?.report || undefined;
    const eventFilters = useStore(sharedEventScoringReportFilterState as any);
    const showOnlyFavorites: boolean = useStore(showFavoritesOnlyToggle);

    // Scroll handler to be called when a section opens
    const handleSectionOpened = () => {
        const highlightCard = document.getElementById(scrollToViewElementId) as HTMLDivElement;
        if (isTabActive(schedulesTabId) && highlightCard?.scrollIntoView) {
            highlightCard.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    if (!event) {
        return (<span>Event is Loading ...</span>);
    }

    const favorites: TeamAndQuizzerFavorites | null = reportState?.favorites ?? null;
    let sectionIndex = 0;

    return (
        <>
            {event.Report.Meets.map((meet: ScoringReportMeet) => {

                const key = `schedulegrid_${meet.DatabaseId}_${meet.MeetId}`;
                if (meet.IsCombinedReport || !meet.Matches) {
                    return null;
                }
                else if (selectedMeets && selectedMeets.length > 0) {
                    const selectedMeetRef = selectedMeets.find(
                        m => m.databaseId === meet.DatabaseId && m.meetId === meet.MeetId);
                    if (!selectedMeetRef) {
                        return null;
                    }
                }

                let teamsOrQuizzers: ScoringReportTeam[] | ScoringReportQuizzer[] | number[];
                let hasRankedTeamsOrQuizzers: boolean;
                if (!meet.IsIndividualCompetition && meet.RankedTeams && (!isPrinting || printStats)) {
                    teamsOrQuizzers = meet.RankedTeams;
                    hasRankedTeamsOrQuizzers = true;
                }
                else {
                    teamsOrQuizzers = (meet.IsIndividualCompetition ? meet.Quizzers : meet.Teams) || [];
                    hasRankedTeamsOrQuizzers = false;
                }

                let hasAnyMatchTimes = false;
                for (let match of meet.Matches) {
                    const matchTime = match.MatchTime;
                    if (matchTime) {
                        hasAnyMatchTimes = true;
                        break;
                    }
                }

                const footerColSpan = hasRankedTeamsOrQuizzers ? 6 : 1;
                const forceOpen = eventFilters?.openMeetDatabaseId === meet.DatabaseId &&
                    eventFilters.openMeetMeetId === meet.MeetId;

                let teamOrQuizzerRowCount = 0;

                const teamOrQuizzerRows = teamsOrQuizzers.map((teamOrQuizzerId: ScoringReportTeam | ScoringReportQuizzer | number, teamOrQuizzerIndex: number) => {
                    const teamOrQuizzer = hasRankedTeamsOrQuizzers
                        ? meet.Teams![teamOrQuizzerId as number]
                        : teamOrQuizzerId as ScoringReportTeam;

                    let highlightColor: string = "";
                    let highlightTextColor: string = "";
                    if (!isPrinting) {
                        const isFavorite = meet.IsIndividualCompetition
                            ? favorites?.quizzerIds.has(teamOrQuizzer.Id) ?? false
                            : favorites?.teamIds.has(teamOrQuizzer.Id) ?? false;

                        const isHighlighted = meet.IsIndividualCompetition
                            ? eventFilters?.highlightQuizzerId === teamOrQuizzer.Id
                            : eventFilters?.highlightTeamId === teamOrQuizzer.Id;

                        if (isHighlighted) {
                            highlightColor = "bg-yellow-200";
                            highlightTextColor = "text-accent-content";
                        }
                        else if (isFavorite) {
                            highlightColor = "bg-accent-300";
                            highlightTextColor = "text-accent-content";
                        }

                        if (showOnlyFavorites && !isFavorite) {
                            return null;
                        }
                    }

                    teamOrQuizzerRowCount++;

                    return (
                        <tr
                            key={`${key}_teams_${teamOrQuizzerIndex}`}
                            id={highlightColor && forceOpen ? scrollToViewElementId : undefined}
                            className={`hover:bg-base-300 ${highlightColor} ${highlightTextColor}`}>
                            {hasRankedTeamsOrQuizzers && (
                                <td className="text-right">
                                    {teamOrQuizzer.Scores!.Rank}{teamOrQuizzer.Scores!.IsTie ? '*' : ''}
                                </td>)}
                            <td className="pl-0">
                                <ToggleTeamOrQuizzerFavoriteButton type={meet.IsIndividualCompetition ? "quizzer" : "team"} id={teamOrQuizzer.Id} />&nbsp;<span className="font-bold">{meet.IsIndividualCompetition ? teamOrQuizzer.Name : teamOrQuizzer.ChurchName}</span><br />
                                <span className="italic">{meet.IsIndividualCompetition ? teamOrQuizzer.ChurchName : teamOrQuizzer.Name}</span>
                            </td>
                            {hasRankedTeamsOrQuizzers && (
                                <>
                                    <td className="text-right">{teamOrQuizzer.Scores!.Wins}</td>
                                    <td className="text-right">{teamOrQuizzer.Scores!.Losses}</td>
                                    <td className="text-right">{teamOrQuizzer.Scores!.TotalPoints}</td>
                                    <td className="text-right">{teamOrQuizzer.Scores!.AveragePoints}</td>
                                </>)}
                            {teamOrQuizzer.Matches!.map((match: ScoringReportTeamMatch | ScoringReportQuizzerMatch | null, matchIndex: number) => {
                                const matchKey = `${key}_teams_${teamOrQuizzerIndex}match_${teamOrQuizzerIndex}_matches_${matchIndex}`;
                                if (null == match) {
                                    return (<td key={matchKey}>--</td>);
                                }

                                const isLiveMatch = null != match.CurrentQuestion;

                                const resolvedMeet = meet;
                                const resolvedMatch = resolvedMeet.Matches![matchIndex];

                                let badgeClass: string;
                                if (meet.IsIndividualCompetition) {
                                    badgeClass = "badge-ghost";
                                }
                                else {
                                    switch ((match as ScoringReportTeamMatch).Result) {
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
                                }

                                const hasScore = meet.IsIndividualCompetition
                                    ? ((match as ScoringReportQuizzerMatch).OtherQuizzers?.length ?? 0) > 0
                                    : (match as ScoringReportTeamMatch).Score != null;

                                return (
                                    <td className="text-center" key={matchKey}>
                                        {!isLiveMatch && !hasScore && (<span>{match.Room}</span>)}
                                        {(isLiveMatch || hasScore) && (
                                            <RoomDialogLink
                                                id={matchKey}
                                                label={`Match ${resolvedMatch.Id} in ${match.Room} @ ${resolvedMeet.Name}`}
                                                eventId={eventId}
                                                databaseId={resolvedMeet.DatabaseId}
                                                meetId={resolvedMeet.MeetId}
                                                matchId={resolvedMatch.Id}
                                                roomId={match.RoomId}>
                                                {match.Room}
                                                {isLiveMatch && (
                                                    <>
                                                        <br />
                                                        <span className="italic">#{match.CurrentQuestion}</span>
                                                    </>)}
                                                {!isLiveMatch && hasRankedTeamsOrQuizzers && hasScore && (
                                                    <>
                                                        <br />
                                                        <span className={`badge badge-xs ${badgeClass}`}>
                                                            {(match as ScoringReportTeamMatch).Score}
                                                        </span>
                                                    </>
                                                )}
                                                {!isLiveMatch && meet.IsIndividualCompetition && match.State === ScoringReportMatchState.Completed && (match as ScoringReportQuizzerMatch).Rank && (
                                                    <span className="badge badge-sm badge-warning ml-2">
                                                        {DataTypeHelpers.ordinalWithSuffix((match as ScoringReportQuizzerMatch).Rank!)}
                                                    </span>)}
                                            </RoomDialogLink>)}
                                    </td>
                                )
                            })}
                        </tr>);
                });

                const sectionBadges = [
                    {
                        className: "badge-lg badge-soft badge-primary",
                        icon: "fas faPeopleGroup",
                        text: teamOrQuizzerRowCount.toString()
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
                        onOpen={forceOpen ? handleSectionOpened : undefined}
                        key={key}>

                        <table className="table table-s table-nowrap">
                            <thead>
                                <tr>
                                    {hasRankedTeamsOrQuizzers && <th className="text-right">#</th>}
                                    <th className="pl-0">{meet.IsIndividualCompetition ? "Quizzer" : "Team"}</th>
                                    {hasRankedTeamsOrQuizzers &&
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
                                {teamOrQuizzerRows}
                                {teamOrQuizzerRowCount === 0 && (
                                    <tr>
                                        <td colSpan={footerColSpan + meet.Matches.length} className="text-center text-sm italic">
                                            No favorite {meet.IsIndividualCompetition ? "quizzers" : "teams"} found.
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
                        {teamOrQuizzerRowCount === 0 && !meet.IsIndividualCompetition && (
                            <table className="table table-s table-nowrap page-break-before">
                                <thead>
                                    <tr>
                                        <th>Team / Coach</th>
                                        <th colSpan={2}>Quizzers</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {meet.Teams!.map((team: ScoringReportTeam, teamIndex: number) => {

                                        if (!isPrinting &&
                                            showOnlyFavorites &&
                                            !favorites?.teamIds.has(team.Id)) {

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
                                                                <span>{meet.Quizzers![team.Quizzers[q]].Name}</span>
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
                                                                    <span>{meet.Quizzers![team.Quizzers[q + column1Count]].Name}</span>
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

