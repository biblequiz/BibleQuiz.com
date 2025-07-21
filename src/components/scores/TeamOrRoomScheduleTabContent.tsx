import { EventScoringReport, ScoringReportMeet, ScoringReportTeamMatch, ScoringReportRoom } from "@types/EventScoringReport";

import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState } from "@utils/SharedState";
import CollapsableMeetSection from "@components/scores/CollapsableMeetSection";
import type { ScoringReportTeam } from "../../types/EventScoringReport";
import RoomDialogLink from "./RoomDialogLink";

export interface Props {
    type: "Team" | "Room";
    eventId: string;
    event?: EventScoringReport;
    isPrinting?: boolean;
    printSinglePerPage?: boolean;
    printStats?: boolean;
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

export default function TeamOrRoomScheduleTabContent({ type, eventId, event, isPrinting, printSinglePerPage, printStats }: Props) {

    event ??= useStore(sharedEventScoringReportState)?.report;
    if (!event) {
        return (<span>Event is Loading ...</span>);
    }

    let sectionIndex = 0;

    return (
        <>
            {event.Report.Meets.map((meet: ScoringReportMeet) => {

                if (meet.IsCombinedReport) {
                    return null;
                }

                const key = `${type}schedule_${meet.DatabaseId}_${meet.MeetId}`;

                const hasRanking = meet.RankedTeams && (!isPrinting || printStats);
                const isRoomReport = type === "Room";
                const tabItems = isRoomReport
                    ? meet.Rooms
                    : meet.Teams;
                if (!tabItems) {
                    return null;
                }

                const gridColumns = isPrinting
                    ? (printSinglePerPage ? "grid-cols-1" : "grid-cols-2")
                    : "sm:grid-cols-1 md:grid-cols-2";

                return (
                    <CollapsableMeetSection
                        meet={meet}
                        showCombinedName={isRoomReport}
                        showMeetStatus={false}
                        pageId={`${type}schedule`}
                        isPrinting={isPrinting}
                        printSectionIndex={sectionIndex++}
                        key={key}>

                        <div className={`grid ${gridColumns} gap-2`}>
                            {tabItems.map((cardItem: ScoringReportTeam | ScoringReportRoom, tabIndex: number) => {
                                const cardKey = `${key}_card_${tabIndex}`;

                                // Build the list of quizzers.
                                let quizzerNames: string[] | null = null;;
                                if (!isRoomReport && cardItem.Quizzers.length > 0) {

                                    quizzerNames = [];

                                    for (let quizzerId of cardItem.Quizzers) {
                                        quizzerNames.push(meet.Quizzers[quizzerId].Name);
                                    }
                                }

                                // Determine if the card should have a break before for printing.
                                const borderClass = isPrinting
                                    ? (isPrinting && tabIndex > 0 && printSinglePerPage
                                        ? "page-break-before"
                                        : "")
                                    : "bg-base-100 shadow-sm";

                                return (
                                    <div className={`card ${borderClass} card-sm mt-4 team-card`} key={cardKey}>
                                        <div className="card-body">
                                            <p className="text-sm mb-0 font-bold">{cardItem.Name}</p>
                                            {!isRoomReport && hasRanking && (
                                                <>
                                                    <p className="subtitle italic mt-0">{cardItem.ChurchName}</p>
                                                    <div className="columns-4">
                                                        <div className="text-center team-card-right-border">
                                                            <span className="text-lg font-bold">{ordinalWithSuffix(cardItem.Scores.Rank)}{cardItem.Scores.IsTie ? '*' : ''}</span><br />
                                                            <i className="subtitle">PLACE</i>
                                                        </div>
                                                        <div className="text-center team-card-right-border">
                                                            <span className="text-lg font-bold">{cardItem.Scores.Wins}-{cardItem.Scores.Losses}</span><br />
                                                            <i className="subtitle">W-L</i>
                                                        </div>
                                                        <div className="text-center team-card-right-border">
                                                            <span className="text-lg font-bold">{cardItem.Scores.TotalPoints}</span><br />
                                                            <i className="subtitle">PTS</i>
                                                        </div>
                                                        <div className="text-center">
                                                            <span className="text-lg font-bold">{cardItem.Scores.AveragePoints}</span><br />
                                                            <i className="subtitle">AVG</i>
                                                        </div>
                                                    </div>
                                                </>)}
                                            <ol className="mt-0 schedule-list">
                                                {cardItem.Matches.map((match: ScoringReportTeamMatch | number, matchIndex: number) => {
                                                    const matchKey = `${key}_matches_${matchIndex}`;
                                                    if (null == match) {
                                                        return (<li key={matchKey} className="ml-6">BYE</li>);
                                                    }

                                                    const resolvedMeet = !meet.HasLinkedMeets || null == match.LinkedMeet
                                                        ? meet
                                                        : event.Report.Meets[match.LinkedMeet];

                                                    const resolvedMatch = resolvedMeet.Matches[matchIndex];
                                                    let matchTeam = null;
                                                    if (match && isRoomReport) {
                                                        matchTeam = resolvedMeet.Teams[match.Team1];
                                                        match = matchTeam.Matches[matchIndex];
                                                    }

                                                    const isLiveMatch = null != match.CurrentQuestion;
                                                    const isScheduleOnly = !hasRanking || (!isLiveMatch && null == match.Score);

                                                    // Determine the prefix before each match.
                                                    let cellText = [];
                                                    if (null != resolvedMatch.PlayoffIndex) {
                                                        cellText.push(`Playoff ${resolvedMatch.PlayoffIndex}: `);
                                                    }

                                                    if (isRoomReport) {
                                                        cellText.push(`"${matchTeam.Name}"`);
                                                    }

                                                    if (isScheduleOnly) {
                                                        cellText.push("vs.");
                                                    }
                                                    else {
                                                        switch (match.Result) {
                                                            case "W":
                                                                cellText.push(`${isRoomReport ? 'w' : 'W'}on against`);
                                                                break;
                                                            case "L":
                                                                cellText.push(`${isRoomReport ? 'l' : 'L'}ost to`);
                                                                break;
                                                            default:
                                                                if (!match.CurrentQuestion && null != match.Score) {
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

                                                        cellText.push(resolvedMeet.Teams[match.OtherTeam].Name);
                                                        if (!isScheduleOnly) {
                                                            if (isLiveMatch) {
                                                                if (!isRoomReport) {
                                                                    cellText.push(`in ${match.Room}`);
                                                                }
                                                            }
                                                            else {
                                                                cellText.push(`${match.Score} to ${resolvedMeet.Teams[match.OtherTeam].Matches[matchIndex].Score}`);
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

                                                    // Combine into HTML.
                                                    const cellHtml = cellText.join(" ");

                                                    return (
                                                        <li key={matchKey} className="ml-6">
                                                            {isScheduleOnly && (<>{cellHtml}</>)}
                                                            {!isScheduleOnly && (
                                                                <RoomDialogLink id={matchKey} label={`Match ${resolvedMatch.Id} in ${match.Room} @ ${resolvedMeet.Name}`} eventId={eventId} databaseId={resolvedMeet.DatabaseId} meetId={resolvedMeet.MeetId} matchId={resolvedMatch.Id} roomId={match.RoomId}>
                                                                    {cellHtml}
                                                                    {isLiveMatch && (
                                                                        <>
                                                                            <br />
                                                                            <i className="fas fa-satellite-dish"></i>&nbsp;Question #{match.CurrentQuestion}
                                                                        </>
                                                                    )}
                                                                </RoomDialogLink>)}
                                                        </li>);
                                                })}
                                            </ol>
                                            {!isRoomReport && (
                                                <div className="text-xs mt-0">91
                                                    {cardItem.CoachName && (
                                                        <p className="text-xs">
                                                            <b>Head Coach:</b> {cardItem.CoachName}
                                                        </p>)}
                                                    {quizzerNames && (
                                                        <p className="mb-0 mt-0">
                                                            <b>Quizzers: </b> {quizzerNames.join(" | ")}
                                                        </p>)}
                                                </div>)}
                                        </div>
                                    </div>);
                            })}
                        </div>
                    </CollapsableMeetSection >);
            })}
        </>);
};

