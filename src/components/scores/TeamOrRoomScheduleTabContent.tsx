import { useEffect } from "react";
import { EventScoringReport, ScoringReportMeet, ScoringReportTeamMatch, ScoringReportRoom } from "types/EventScoringReport";

import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState, sharedEventScoringReportFilterState, showFavoritesOnlyToggle } from "utils/SharedState";
import CollapsableMeetSection from "components/scores/CollapsableMeetSection";
import type { ScoringReportRoomMatch, ScoringReportTeam } from 'types/EventScoringReport';
import RoomDialogLink from './RoomDialogLink';
import { isTabActive } from "utils/Tabs";
import ToggleTeamOrQuizzerFavoriteButton from './ToggleTeamOrQuizzerFavoriteButton';

export interface Props {
    type: "Team" | "Room";
    eventId: string;
    event?: EventScoringReport;
    isPrinting?: boolean;
    printSinglePerPage?: boolean;
    printStats?: boolean;
    rootTabId: string;
    schedulesTabId: string;
};

function ordinalWithSuffix(number: number): string {
    const tens = number % 10;
    const hundreds = number % 100;

    if (tens == 1 && hundreds != 11) {
        return number + "st";
    }
    else if (tens == 2 && hundreds != 12) {
        return number + "nd";
    }
    else if (tens == 3 && hundreds != 13) {
        return number + "rd";
    }

    return number + "th";
}

export default function TeamOrRoomScheduleTabContent({ type, eventId, event, isPrinting, printSinglePerPage, printStats, rootTabId, schedulesTabId }: Props) {

    const scrollToViewElementId = `schedule_${type}_scroll_elem`;

    const reportState = useStore(sharedEventScoringReportState);
    event ??= reportState?.report || undefined;
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

    const favorites = reportState?.favorites ?? null;
    let sectionIndex = 0;

    return (
        <>
            {event.Report.Meets.map((meet: ScoringReportMeet) => {

                if (meet.IsCombinedReport) {
                    return null;
                }

                const hasRanking = meet.RankedTeams && (!isPrinting || printStats);
                const isRoomReport = type === "Room";
                const tabItems = isRoomReport
                    ? meet.Rooms
                    : meet.Teams;
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

                const teamCards = tabItems.map((cardItem: ScoringReportTeam | ScoringReportRoom, tabIndex: number) => {
                    const cardKey = `${key}_card_${tabIndex}`;

                    // Build the list of quizzers.
                    let quizzerNames: string[] | null = null;;
                    if (!isRoomReport && (cardItem as ScoringReportTeam).Quizzers.length > 0) {

                        quizzerNames = [];

                        for (let quizzerId of (cardItem as ScoringReportTeam).Quizzers) {
                            quizzerNames.push(meet.Quizzers![quizzerId].Name);
                        }
                    }

                    let teamCardHighlightColor: string = "";
                    if (!isPrinting && !isRoomReport) {
                        const isFavorite = favorites?.teamIds.has((cardItem as ScoringReportTeam).Id) || false;
                        if (eventFilters?.highlightTeamId === (cardItem as ScoringReportTeam).Id) {
                            teamCardHighlightColor = "bg-yellow-200";
                        }
                        else if (isFavorite) {
                            teamCardHighlightColor = "bg-accent-100";
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
                    const matchItems = cardItem.Matches!.map(
                        (match: ScoringReportTeamMatch | ScoringReportRoomMatch | null, matchIndex: number) => {
                            const matchKey = `${key}_matches_${matchIndex}`;
                            if (null == match) {
                                return (<li key={matchKey} className="ml-6">BYE</li>);
                            }

                            const resolvedMeet = !meet.HasLinkedMeets || !(match as ScoringReportRoomMatch).LinkedMeet
                                ? meet
                                : event.Report.Meets[(match as ScoringReportRoomMatch).LinkedMeet!];

                            const resolvedMatch = resolvedMeet.Matches![matchIndex];
                            let matchTeam: ScoringReportTeam | null = null;
                            let shouldHighlightSearchResult = false;
                            let shouldHighlightFavorite = false;
                            if (match && isRoomReport) {
                                matchTeam = resolvedMeet.Teams![(match as ScoringReportRoomMatch).Team1];
                                match = matchTeam.Matches![matchIndex];
                                shouldHighlightSearchResult = eventFilters?.highlightTeamId === matchTeam?.Id;
                                shouldHighlightFavorite = favorites?.teamIds.has(matchTeam?.Id) ?? false;
                            }

                            const isLiveMatch = null != match && null != match.CurrentQuestion;
                            const isScheduleOnly = !hasRanking || (!isLiveMatch && (match as ScoringReportTeamMatch).Score);

                            // Determine the prefix before each match.
                            let cellText = [];
                            if (null != resolvedMatch.PlayoffIndex) {
                                cellText.push(`Playoff ${resolvedMatch.PlayoffIndex}: `);
                            }

                            if (isRoomReport) {
                                cellText.push(`"${matchTeam!.Name}"`);
                            }

                            if (isScheduleOnly) {
                                cellText.push("vs.");
                            }
                            else {
                                switch (match?.Result) {
                                    case "W":
                                        cellText.push(`${isRoomReport ? 'w' : 'W'}on against`);
                                        break;
                                    case "L":
                                        cellText.push(`${isRoomReport ? 'l' : 'L'}ost to`);
                                        break;
                                    default:
                                        if (!match?.CurrentQuestion && null != match?.Score) {
                                            cellText.push(`${isRoomReport ? 'p' : 'P'}layed`);
                                        }
                                        else if (isLiveMatch) {
                                            cellText.push(`${isRoomReport ? 'p' : 'P'}laying`);
                                        }

                                        break;
                                }
                            }

                            // Append the other team name and scores.
                            if (null != match.OtherTeam) {

                                const otherTeam = resolvedMeet.Teams[match.OtherTeam];
                                if (!shouldHighlightSearchResult && eventFilters?.highlightTeamId == otherTeam.Id) {
                                    shouldHighlightSearchResult = true;
                                }

                                if (!shouldHighlightFavorite && (favorites?.teamIds.has(otherTeam.Id) ?? false)) {
                                    shouldHighlightFavorite = true;
                                }

                                cellText.push(otherTeam.Name);
                                if (!isScheduleOnly) {
                                    if (isLiveMatch) {
                                        if (!isRoomReport) {
                                            cellText.push(`in ${match.Room}`);
                                        }
                                    }
                                    else {
                                        cellText.push(`${match.Score} to ${otherTeam.Matches[matchIndex].Score}`);
                                    }
                                }
                            }
                            else {

                                cellText.push("\"BYE TEAM\"");

                                if (match.Score != null) {
                                    cellText.push(`\"BYE TEAM\" ${match.Score}`);
                                }
                            }

                            // Add the scheduled room and time.
                            if (isScheduleOnly) {
                                if (!isRoomReport) {
                                    cellText.push(`in ${match.Room}`);
                                }

                                const matchTime = resolvedMeet.Matches[matchIndex].MatchTime;
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

                            // Determine the highlight color (if any).
                            let matchHighlightColor: string = "";
                            if (!isPrinting) {
                                if (shouldHighlightSearchResult) {
                                    matchHighlightColor = "bg-yellow-200";
                                }
                                else if (shouldHighlightFavorite) {
                                    matchHighlightColor = "bg-accent-100";
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
                                    className={`ml-6 ${matchHighlightColor}`}
                                    value={matchIndex + 1}
                                >
                                    {isScheduleOnly && (<>{cellHtml}</>)}
                                    {!isScheduleOnly && (
                                        <RoomDialogLink id={matchKey} label={`Match ${resolvedMatch.Id} in ${match!.Room} @ ${resolvedMeet.Name}`} eventId={eventId} databaseId={resolvedMeet.DatabaseId} meetId={resolvedMeet.MeetId} matchId={resolvedMatch.Id} roomId={match.RoomId}>
                                            {cellHtml}
                                            {isLiveMatch && (
                                                <>
                                                    <br />
                                                    <i className="fas fa-satellite-dish"></i>&nbsp;Question #{match.CurrentQuestion}
                                                </>
                                            )}
                                        </RoomDialogLink>)}
                                </li>);
                        });

                    if (!hasAnyMatchItems) {
                        return null;
                    }

                    teamCardCount++;

                    return (
                        <div
                            className={`card ${borderClass} ${teamCardHighlightColor} card-sm mt-4 team-card`}
                            id={teamCardHighlightColor && forceOpen ? scrollToViewElementId : undefined}
                            key={cardKey}>
                            <div className="card-body">
                                <p className="text-sm mb-0 font-bold">
                                    {!isRoomReport && (<><ToggleTeamOrQuizzerFavoriteButton type="team" id={(cardItem as ScoringReportTeam).Id} showText={false} />&nbsp;</>)}
                                    {cardItem.Name}
                                </p>
                                {!isRoomReport && hasRanking && (
                                    <>
                                        <p className="subtitle italic mt-0">{(cardItem as ScoringReportTeam).ChurchName}</p>
                                        <div className="columns-4">
                                            <div className="text-center team-card-right-border">
                                                <span className="text-lg font-bold">{ordinalWithSuffix((cardItem as ScoringReportTeam).Scores!.Rank)}{(cardItem as ScoringReportTeam).Scores!.IsTie ? '*' : ''}</span><br />
                                                <i className="subtitle">PLACE</i>
                                            </div>
                                            <div className="text-center team-card-right-border">
                                                <span className="text-lg font-bold">{(cardItem as ScoringReportTeam).Scores!.Wins}-{(cardItem as ScoringReportTeam).Scores!.Losses}</span><br />
                                                <i className="subtitle">W-L</i>
                                            </div>
                                            <div className="text-center team-card-right-border">
                                                <span className="text-lg font-bold">{(cardItem as ScoringReportTeam).Scores!.TotalPoints}</span><br />
                                                <i className="subtitle">PTS</i>
                                            </div>
                                            <div className="text-center">
                                                <span className="text-lg font-bold">{(cardItem as ScoringReportTeam).Scores!.AveragePoints}</span><br />
                                                <i className="subtitle">AVG</i>
                                            </div>
                                        </div>
                                    </>)}
                                <ol className="mt-0 schedule-list">
                                    {matchItems}
                                </ol>
                                {!isRoomReport && (
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
                        key={key}>

                        <div className={`grid ${gridColumns} gap-2`}>
                            {teamCards}
                        </div>

                        {teamCardCount === 0 && (
                            <div className="text-center text-sm italic mt-4">
                                No favorite teams found.
                            </div>
                        )}
                    </CollapsableMeetSection >);
            })}
        </>);
};

