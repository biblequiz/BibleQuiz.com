import { EventScoringReport, ScoringReportMeet, ScoringReportTeamMatch, ScoringReportRoom } from "types/EventScoringReport";

import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState, sharedEventScoringReportFilterState, showFavoritesOnlyToggle, type MeetReference } from "utils/SharedState";
import CollapsableMeetSection from "components/scores/CollapsableMeetSection";
import type { ScoringReportQuizzer, ScoringReportRoomMatch, ScoringReportTeam, ScoringReportQuizzerMatch } from 'types/EventScoringReport';
import RoomDialogLink from './RoomDialogLink';
import { isTabActive } from "utils/Tabs";
import ToggleTeamOrQuizzerFavoriteButton from './ToggleTeamOrQuizzerFavoriteButton';
import { DataTypeHelpers } from "utils/DataTypeHelpers";

export interface Props {
    type: "Team" | "Room";
    eventId: string;
    event?: EventScoringReport;
    isPrinting?: boolean;
    printSinglePerPage?: boolean;
    printStats?: boolean;
    schedulesTabId: string;
    selectedMeets?: MeetReference[];
};

/**
* Create a Acronym for the ChurchName
function generateChurchAcronym(churchName: string, maxLength: number = 3): string {
    if (!churchName) return '';

    const words = churchName
        .toUpperCase()
        .replace(/\b(AND|THE|OF|IN|ON|AT|FOR|WITH|BY|CH|ST|SAINT)\b/gi, '')
        .split(/\s+/)
        .filter((word: string) => word.length > 0 && /[A-Z]/i.test(word.charAt(0)));

    if (words.length === 0) {
        // Fallback for single word or unusual names
        return churchName
            .replace(/[^A-Z]/gi, '')
            .substring(0, maxLength)
            .toUpperCase();
    }

    return words
        .slice(0, maxLength)
        .map(word => word.charAt(0))
        .join('');
}*/

/**
 * Get a short name for the church including acronym, city, and state.
function getTeamShortName(churchName: string, city: string, state: string): string {
    let parts: string[] = [];

    console.log("Generating acronym for church:", churchName, city, state);
    let acronym = generateChurchAcronym(churchName, 4);
    if (acronym) {
        parts.push(acronym);
    }
    if (city) {
        parts.push(city);
    }
    //if (state) {
    //    parts.push(state);
    //}
    return parts.join(", ");
}*/

export default function TeamOrRoomScheduleTabContent({
    type,
    eventId,
    event,
    isPrinting,
    printSinglePerPage,
    printStats,
    schedulesTabId,
    selectedMeets }: Props) {

    const scrollToViewElementId = `schedule_${type}_scroll_elem`;

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

    const favorites = reportState?.favorites ?? null;
    let sectionIndex = 0;

    return (
        <>
            {event.Report.Meets.map((meet: ScoringReportMeet) => {

                if (meet.IsCombinedReport) {
                    return null;
                }
                else if (selectedMeets && selectedMeets.length > 0) {
                    const selectedMeetRef = selectedMeets.find(
                        m => m.databaseId === meet.DatabaseId && m.meetId === meet.MeetId);
                    if (!selectedMeetRef) {
                        return null;
                    }
                }

                const hasRanking = meet.RankedTeams && (!isPrinting || printStats);
                const isRoomReport = type === "Room";
                const tabItems = isRoomReport
                    ? meet.Rooms
                    : (meet.IsIndividualCompetition ? meet.Quizzers : meet.Teams);
                if (!tabItems) {
                    return null;
                }

                const key = `${type}schedule_${meet.DatabaseId}_${meet.MeetId}`;

                const forceOpen = eventFilters?.openMeetDatabaseId === meet.DatabaseId &&
                    eventFilters.openMeetMeetId === meet.MeetId;

                const gridColumns = isPrinting
                    ? (printSinglePerPage ? "grid-cols-1" : "grid-cols-2")
                    : "sm:grid-cols-1 md:grid-cols-2";

                let teamCardCount = 0;

                const teamCards = tabItems.map((cardItem: ScoringReportTeam | ScoringReportQuizzer | ScoringReportRoom, tabIndex: number) => {
                    const cardKey = `${key}_card_${tabIndex}`;

                    // Build the list of quizzers.
                    let quizzerNames: string[] | null = null;;
                    if (!isRoomReport && !meet.IsIndividualCompetition && (cardItem as ScoringReportTeam).Quizzers.length > 0) {

                        quizzerNames = [];

                        for (let quizzerId of (cardItem as ScoringReportTeam).Quizzers) {
                            quizzerNames.push(meet.Quizzers![quizzerId].Name);
                        }
                    }

                    let teamCardHighlightColor: string = "";
                    let teamCardHighlightTextColor: string = "";
                    if (!isPrinting && !isRoomReport) {
                        const isFavorite = meet.IsIndividualCompetition
                            ? favorites?.quizzerIds.has((cardItem as ScoringReportQuizzer).Id) || false
                            : favorites?.teamIds.has((cardItem as ScoringReportTeam).Id) || false;
                        if (eventFilters?.highlightTeamId === (cardItem as ScoringReportTeam | ScoringReportQuizzer).Id) {
                            teamCardHighlightColor = "bg-yellow-200";
                            teamCardHighlightTextColor = "text-accent-content";
                        }
                        else if (isFavorite) {
                            teamCardHighlightColor = "bg-accent-300";
                            teamCardHighlightTextColor = "text-accent-content";
                        }

                        if (showOnlyFavorites && !isFavorite) {
                            return null;
                        }
                    }

                    // Determine if the card should have a break before for printing.
                    const borderClass = isPrinting
                        ? (isPrinting && tabIndex > 0 && printSinglePerPage
                            ? "page-break-before"
                            : "")
                        : `${teamCardHighlightColor || "bg-base-100"} shadow-sm`;

                    let hasAnyMatchItems = false;
                    const matchItems = cardItem.Matches!.map((matchItem: ScoringReportTeamMatch | ScoringReportQuizzerMatch | ScoringReportRoomMatch | null, matchIndex: number) => {
                        const matchKey = `${key}_matches_${matchIndex}`;
                        if (null == matchItem) {
                            return (<li key={matchKey} className="ml-6">BYE</li>);
                        }

                        const resolvedMeet = !meet.HasLinkedMeets ||
                            (!(matchItem as ScoringReportRoomMatch).LinkedMeet && (matchItem as ScoringReportRoomMatch).LinkedMeet !== 0)
                            ? meet
                            : event.Report.Meets[(matchItem as ScoringReportRoomMatch).LinkedMeet!];

                        const resolvedMatch = resolvedMeet.Matches![matchIndex];
                        let matchTeamOrQuizzer: ScoringReportTeam | ScoringReportQuizzer | null = null;
                        let shouldHighlightSearchResult = false;
                        let shouldHighlightFavorite = false;
                        let match: ScoringReportTeamMatch | ScoringReportQuizzerMatch | ScoringReportRoomMatch | null = null;
                        if (matchItem && isRoomReport) {
                            if (resolvedMeet.IsIndividualCompetition) {
                                if ((matchItem as ScoringReportRoomMatch).Quizzers?.length ?? 0 > 0) {
                                    matchTeamOrQuizzer = resolvedMeet.Quizzers![(matchItem as ScoringReportRoomMatch).Quizzers![0]];
                                    if (resolvedMeet.IsIndividualCompetition) {
                                        for (const quizzerId of (matchItem as ScoringReportRoomMatch).Quizzers!) {
                                            const quizzer = resolvedMeet.Quizzers![quizzerId];
                                            if (eventFilters?.highlightQuizzerId === quizzer.Id) {
                                                shouldHighlightSearchResult = true;
                                            }

                                            if (favorites?.quizzerIds.has(quizzer.Id)) {
                                                shouldHighlightFavorite = true;
                                            }

                                            if (shouldHighlightFavorite || shouldHighlightSearchResult) {
                                                break;
                                            }
                                        }
                                    }
                                }
                                else {
                                    match = matchItem;
                                }
                            }
                            else {
                                matchTeamOrQuizzer = resolvedMeet.Teams![(matchItem as ScoringReportRoomMatch).Team1!];
                            }
                            if (matchTeamOrQuizzer) {
                                match = matchTeamOrQuizzer.Matches![matchIndex];
                                if (!resolvedMeet.IsIndividualCompetition) {
                                    shouldHighlightSearchResult = eventFilters?.highlightTeamId === matchTeamOrQuizzer?.Id;
                                    shouldHighlightFavorite = favorites?.teamIds.has(matchTeamOrQuizzer?.Id) ?? false;
                                }
                            }
                            else if (!resolvedMeet.IsIndividualCompetition || !isRoomReport) {
                                match = null;
                            }
                        }
                        else {
                            match = matchItem as ScoringReportTeamMatch | ScoringReportQuizzerMatch | null;
                        }

                        const isLiveMatch = null != match && null != match.CurrentQuestion;
                        const isScheduleOnly = meet.IsIndividualCompetition
                            ? !isLiveMatch && ((isRoomReport && ((matchItem as ScoringReportRoomMatch).Quizzers?.length ?? 0) === 0) || (!isRoomReport && ((matchItem as ScoringReportQuizzerMatch).OtherQuizzers?.length ?? 0) === 0))
                            : !hasRanking || (!isLiveMatch && ((match as ScoringReportTeamMatch)?.Score === null || (match as ScoringReportTeamMatch)?.Score === undefined));

                        // Determine the prefix before each match.
                        let cellText = [];
                        if (null != resolvedMatch.PlayoffIndex) {
                            cellText.push(`Playoff ${resolvedMatch.PlayoffIndex}: `);
                        }

                        if (isRoomReport && matchTeamOrQuizzer) {
                            cellText.push(`"${matchTeamOrQuizzer!.Name}" (${matchTeamOrQuizzer!.ChurchName})`);
                        }

                        if (meet.IsIndividualCompetition) {
                            const quizzerMatch = match as ScoringReportQuizzerMatch;
                            if (!isRoomReport && !isLiveMatch && quizzerMatch.Rank) {
                                cellText.push(`${DataTypeHelpers.ordinalWithSuffix(quizzerMatch.Rank)} Place in Room ${quizzerMatch!.Room}`);
                                if (quizzerMatch.NextRoom) {
                                    cellText.push(`(Move to Room ${quizzerMatch.NextRoom})`);
                                }
                            }
                            else if (quizzerMatch?.OtherQuizzers?.length ?? 0 > 0) {
                                const quizzerNames = [];
                                for (const otherQuizzerId of quizzerMatch.OtherQuizzers!) {
                                    const otherQuizzer = resolvedMeet.Quizzers![otherQuizzerId];
                                    if (otherQuizzer) {
                                        if (otherQuizzer.ChurchName) {
                                            quizzerNames.push(`"${otherQuizzer.Name}" (${otherQuizzer.ChurchName})`);
                                        }
                                        else {
                                            quizzerNames.push(otherQuizzer.Name);
                                        }
                                    }
                                }

                                if (quizzerNames.length > 0) {
                                    cellText.push(`vs. ${quizzerNames.join(", ")}`);
                                }

                                if (!isRoomReport) {
                                    cellText.push(`in ${quizzerMatch!.Room}`);
                                    const matchTime = resolvedMeet.Matches![matchIndex].MatchTime;
                                    if (matchTime) {
                                        cellText.push(`@ ${matchTime}`);
                                    }
                                }
                            }
                            else if (isRoomReport && ((matchItem as ScoringReportRoomMatch).RankedTeamsOrQuizzers?.length ?? 0) > 0) {
                                const routes = [];
                                for (const route of (matchItem as ScoringReportRoomMatch).RankedTeamsOrQuizzers!) {
                                    routes.push(`${DataTypeHelpers.ordinalWithSuffix(route.Rank)} from ${meet.Rooms![route.Room].Name}`);
                                }

                                cellText.push(routes.join(", "));
                            }
                        }
                        else if (isScheduleOnly) {
                            cellText.push("vs.");
                        }
                        else {
                            switch ((match as ScoringReportTeamMatch)?.Result) {
                                case "W":
                                    cellText.push(`${isRoomReport ? 'w' : 'W'}on against`);
                                    break;
                                case "L":
                                    cellText.push(`${isRoomReport ? 'l' : 'L'}ost to`);
                                    break;
                                default:
                                    if (!match?.CurrentQuestion && null != (match as ScoringReportTeamMatch)?.Score) {
                                        cellText.push(`${isRoomReport ? 'p' : 'P'}layed`);
                                    }
                                    else if (isLiveMatch) {
                                        cellText.push(`${isRoomReport ? 'p' : 'P'}laying`);
                                    }
                                    break;
                            }
                        }

                        // Append the other team name and scores.
                        if (!meet.IsIndividualCompetition) {
                            const matchTeam = match as ScoringReportTeamMatch;
                            if (null != matchTeam?.OtherTeam) {

                                const otherTeam = resolvedMeet.Teams![matchTeam.OtherTeam];
                                if (!shouldHighlightSearchResult && eventFilters?.highlightTeamId == otherTeam.Id) {
                                    shouldHighlightSearchResult = true;
                                }

                                if (!shouldHighlightFavorite && (favorites?.teamIds.has(otherTeam.Id) ?? false)) {
                                    shouldHighlightFavorite = true;
                                }
                                cellText.push(`"${otherTeam.Name} (${otherTeam.ChurchName})"`);
                                if (!isScheduleOnly) {
                                    if (isLiveMatch) {
                                        if (!isRoomReport) {
                                            cellText.push(`in ${matchTeam.Room}`);
                                        }
                                    }
                                    else {
                                        cellText.push(`${matchTeam.Score} to ${otherTeam.Matches![matchIndex]!.Score}`);
                                    }
                                }
                            }
                            else {

                                cellText.push("\"BYE TEAM\"");

                                if (matchTeam?.Score != null) {
                                    cellText.push(`\"BYE TEAM\" ${matchTeam.Score}`);
                                }
                            }

                            // Add the scheduled room and time.
                            if (isScheduleOnly) {
                                if (!isRoomReport) {
                                    cellText.push(`in ${(match as ScoringReportTeamMatch | ScoringReportQuizzerMatch)!.Room}`);
                                }

                                const matchTime = resolvedMeet.Matches![matchIndex].MatchTime;
                                if (matchTime) {
                                    cellText.push(`@ ${matchTime}`);
                                }
                                if (isRoomReport && resolvedMeet.HasLinkedMeets) {
                                    cellText.push(`(${resolvedMeet.Name})`);
                                }
                            }
                            else if (isRoomReport && resolvedMeet.HasLinkedMeets) {
                                cellText.push(`(${resolvedMeet.Name})`);
                            }
                        }

                        // Determine the highlight color (if any).
                        let matchHighlightColor: string = "";
                        let matchHighlightTextColor: string = "";
                        if (!isPrinting) {
                            if (shouldHighlightSearchResult) {
                                matchHighlightColor = "bg-yellow-200";
                                matchHighlightTextColor = "text-accent-content";
                            }
                            else if (shouldHighlightFavorite) {
                                matchHighlightColor = "bg-green-400";
                                matchHighlightTextColor = "text-accent-content";
                            }

                            if (showOnlyFavorites && !shouldHighlightFavorite && isRoomReport) {
                                return null; // Skip this match if not a favorite.
                            }
                        }

                        hasAnyMatchItems = true;

                        // Combine into HTML.
                        const cellHtml = cellText.join(" ");

                        return (
                            <li
                                key={matchKey}
                                className={`ml-6 ${matchHighlightColor} ${matchHighlightTextColor}`}
                                value={matchIndex + 1}
                            >
                                {isScheduleOnly && (<>{cellHtml}</>)}
                                {!isScheduleOnly && (
                                    <RoomDialogLink
                                        id={matchKey}
                                        label={`Match ${resolvedMatch.Id} in ${isRoomReport ? (cardItem as ScoringReportRoom).Name : (match as ScoringReportTeamMatch | ScoringReportQuizzerMatch).Room} @ ${resolvedMeet.Name}`}
                                        eventId={eventId}
                                        databaseId={resolvedMeet.DatabaseId}
                                        meetId={resolvedMeet.MeetId}
                                        matchId={resolvedMatch.Id}
                                        roomId={isRoomReport ? (cardItem as ScoringReportRoom).RoomId : (match as ScoringReportTeamMatch | ScoringReportQuizzerMatch).RoomId}>
                                        {cellHtml}
                                        {isLiveMatch && (
                                            <>
                                                <br />
                                                <i className="fas fa-satellite-dish"></i>&nbsp;Question #{match!.CurrentQuestion}
                                            </>
                                        )}
                                    </RoomDialogLink>
                                )}
                            </li>
                        );
                    });

                    if (!hasAnyMatchItems) {
                        return null;
                    }

                    teamCardCount++;

                    return (
                        <div
                            className={`card ${borderClass} ${teamCardHighlightColor} ${teamCardHighlightTextColor} card-sm mt-4 team-card`}
                            id={teamCardHighlightColor && forceOpen ? scrollToViewElementId : undefined}
                            key={cardKey}>
                            <div className="card-body">
                                <p className="text-sm mb-0 font-bold">
                                    {!isRoomReport && (<><ToggleTeamOrQuizzerFavoriteButton type={meet.IsIndividualCompetition ? "quizzer" : "team"} id={(cardItem as ScoringReportTeam | ScoringReportQuizzer).Id} />&nbsp;</>)}
                                    {meet.IsIndividualCompetition ? (cardItem as ScoringReportQuizzer).Name : (cardItem as ScoringReportTeam).ChurchName}
                                </p>
                                <p className="subtitle italic mt-0">
                                    {meet.IsIndividualCompetition ? (cardItem as ScoringReportQuizzer).ChurchName : (cardItem as ScoringReportTeam).Name}
                                </p>
                                {!isRoomReport && hasRanking && !meet.IsIndividualCompetition && (
                                    <>
                                        <div className="columns-4">
                                            <div className="text-center team-card-right-border">
                                                <span className="text-lg font-bold">{DataTypeHelpers.ordinalWithSuffix((cardItem as ScoringReportTeam).Scores!.Rank)}{(cardItem as ScoringReportTeam).Scores!.IsTie ? '*' : ''}</span><br />
                                                <i className="subtitle">PLACE</i>
                                            </div>
                                            <div className="text-center team-card-right-border">
                                                <span className="text-lg font-bold">{(cardItem as ScoringReportTeam).Scores!.Wins}-{(cardItem as ScoringReportTeam).Scores!.Losses}</span><br />
                                                <i className="subtitle">W-L</i>
                                            </div>
                                            <div className="text-center team-card-right-borderi">
                                                <span className="text-lg font-bold">{(cardItem as ScoringReportTeam).Scores!.TotalPoints}</span><br />
                                                <i className="subtitle">PTS</i>
                                            </div>
                                            <div className="text-center">
                                                <span className="text-lg font-bold">{(cardItem as ScoringReportTeam).Scores!.AveragePoints}</span><br />
                                                <i className="subtitle">AVG</i>
                                            </div>
                                        </div>
                                    </>)}
                                <ol className={`mt-0 schedule-list ${teamCardHighlightColor} ${teamCardHighlightTextColor}`}>
                                    {matchItems}
                                </ol>
                                {!isRoomReport && !meet.IsIndividualCompetition && (
                                    <div className="text-xs mt-0">
                                        {(cardItem as ScoringReportTeam).CoachName && (
                                            <p className="text-xs">
                                                <b>Head Coach:</b> {(cardItem as ScoringReportTeam).CoachName}
                                            </p>)}
                                        {quizzerNames && (
                                            <p className="mb-0 mt-0">
                                                <b>Quizzers: </b> {quizzerNames.join(" | ")}
                                            </p>)}
                                    </div>)}
                            </div>
                        </div>);
                });

                const sectionBadges = [
                    {
                        className: "badge-lg badge-soft badge-primary",
                        icon: "fas faPeopleGroup",
                        text: teamCardCount.toString()
                    }];

                return (
                    <CollapsableMeetSection
                        meet={meet}
                        showCombinedName={isRoomReport}
                        showMeetStatus={false}
                        pageId={`${type}schedule`}
                        isPrinting={isPrinting}
                        printSectionIndex={sectionIndex++}
                        forceOpen={forceOpen}
                        elementId={forceOpen && isRoomReport ? scrollToViewElementId : undefined}
                        badges={sectionBadges}
                        onOpen={forceOpen ? handleSectionOpened : undefined}
                        key={key}>

                        <div className={`grid ${gridColumns} gap-2`}>
                            {teamCards}
                        </div>

                        {teamCardCount === 0 && (
                            <div className="text-center text-sm italic mt-4">
                                No favorite {meet.IsIndividualCompetition ? "quizzers" : "teams"} found.
                            </div>
                        )}
                    </CollapsableMeetSection >);
            })}
        </>);
};

