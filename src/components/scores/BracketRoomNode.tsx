import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { ScoringReportMeet, ScoringReportRoomMatch } from "types/EventScoringReport";
import { DataTypeHelpers } from "utils/DataTypeHelpers";

export interface BracketRoomNodeProps {
    eventId: string;
    roomIndex: number;
    roomName: string;
    matchIndex: number;
    roomMatch: ScoringReportRoomMatch | null;
    meet: ScoringReportMeet;
    isBye?: boolean;
}

interface ParticipantDisplay {
    key: string;
    name: string;
    churchName?: string;
    rank: number | null;
    nextRoom: string | null;
    isPlaceholder: boolean;
    isInProgress: boolean;
}

/**
 * Gets the badge color class based on rank position and advancement status
 * @param rank The rank position (1st, 2nd, etc.)
 * @param hasNextRoom Whether the quizzer advances to another room (null if unknown/in-progress)
 * @param isCompleted Whether the match is completed
 */
function getRankBadgeClass(
    rank: number | null,
    hasNextRoom: boolean | null,
    isCompleted: boolean): string {
    if (!isCompleted || rank === null) {
        return "badge-primary";
    }

    // Completed match logic
    if (rank === 1 || rank === 2) {
        return "badge-warning";
    }

    if (hasNextRoom === true) {
        return "badge-success";
    }

    return "badge-neutral";
}

declare global {
    interface Window {
        openRoomDialog: (event: any) => void;
    }
}

/**
 * Displays a single room as a card in the bracket visualization.
 * Shows quizzers (resolved names or placeholders from routing).
 */
export default function BracketRoomNode({
    eventId,
    roomIndex,
    roomName,
    matchIndex,
    roomMatch,
    meet,
    isBye
}: BracketRoomNodeProps) {

    // Determine match state and styling
    let stateClass = "border-base-300";
    let stateBadge: React.ReactNode = null;

    if (roomMatch) {
        switch (roomMatch.State) {
            case "InProgress":
                stateClass = "border-info border-2";
                stateBadge = (
                    <span>
                        <FontAwesomeIcon icon="fas faSatelliteDish" />&nbsp;#{roomMatch.CurrentQuestion}
                    </span>);
                break;
            case "Completed":
                stateClass = "border-success";
                stateBadge = <FontAwesomeIcon icon="fas faCheck" classNames={["text-success"]} />;
                break;
            default:
                stateClass = "border-base-300";
                break;
        }
    }

    // Build the list of participants to display
    const participants: ParticipantDisplay[] = [];

    const isCompleted = roomMatch?.State === "Completed";
    const isInProgress = roomMatch?.State === "InProgress";

    if (isBye || !roomMatch) {
        participants.push({
            key: `${matchIndex}-${roomIndex}-bye`,
            name: "BYE",
            rank: null,
            nextRoom: null,
            isPlaceholder: true,
            isInProgress: false
        });
    } else if (roomMatch.Quizzers && roomMatch.Quizzers.length > 0) {
        // Resolved quizzers - show actual names with rank if match is completed
        const seenQuizzerIds = new Set<number>();

        // Build list of quizzers with their ranks for sorting
        const quizzerData: { quizzerId: number; quizzer: any; rank: number | null; nextRoom: string | null }[] = [];

        for (let i = 0; i < roomMatch.Quizzers.length; i++) {
            const quizzerId = roomMatch.Quizzers[i];
            if (seenQuizzerIds.has(quizzerId)) continue;
            seenQuizzerIds.add(quizzerId);

            const quizzer = meet.Quizzers?.[quizzerId];
            if (quizzer) {
                // Get the rank and next room from the quizzer's match data
                const quizzerMatch = quizzer.Matches?.[matchIndex];
                const rank = isCompleted && quizzerMatch?.Rank ? quizzerMatch.Rank : null;
                const nextRoom = isCompleted ? quizzerMatch?.NextRoom ?? null : null;
                quizzerData.push({ quizzerId, quizzer, rank, nextRoom: nextRoom });
            }
        }

        // Sort by rank if completed, otherwise keep original order
        if (isCompleted) {
            quizzerData.sort((a, b) => {
                if (a.rank === null && b.rank === null) return 0;
                if (a.rank === null) return 1;
                if (b.rank === null) return -1;
                return a.rank - b.rank;
            });
        }

        for (let i = 0; i < quizzerData.length; i++) {
            const { quizzerId, quizzer, rank, nextRoom } = quizzerData[i];

            participants.push({
                key: `${matchIndex}-${roomIndex}-q-${i}-${quizzerId}`,
                name: quizzer.Name,
                churchName: quizzer.ChurchName,
                rank,
                nextRoom,
                isPlaceholder: false,
                isInProgress
            });
        }
    } else if (roomMatch.RankedTeamsOrQuizzers && roomMatch.RankedTeamsOrQuizzers.length > 0) {
        for (let i = 0; i < roomMatch.RankedTeamsOrQuizzers.length; i++) {
            const route = roomMatch.RankedTeamsOrQuizzers[i];
            const sourceRoom = meet.Rooms?.[route.Room];
            const sourceRoomName = sourceRoom?.Name || `Room ${route.Room + 1}`;
            participants.push({
                key: `${matchIndex}-${roomIndex}-r-${i}-${route.Room}-${route.Rank}`,
                name: sourceRoomName,
                rank: route.Rank,
                nextRoom: null,
                isPlaceholder: true,
                isInProgress: false
            });
        }
    } else {
        participants.push({
            key: `${matchIndex}-${roomIndex}-tbd`,
            name: "TBD",
            rank: null,
            nextRoom: null,
            isPlaceholder: true,
            isInProgress: false
        });
    }

    const matchId = meet.Matches?.[matchIndex]?.Id;

    return (
        <div
            data-label={`Match ${matchId} in ${roomName} @ ${meet.Name}`}
            data-event-id={eventId}
            data-database-id={meet.DatabaseId}
            data-meet-id={meet.MeetId}
            data-match-id={matchId}
            data-room-id={meet.Rooms?.[roomIndex]?.RoomId}
            data-room-index={roomIndex}
            data-match-index={matchIndex}
            className={`card card-compact bg-base-100 shadow-sm border ${stateClass} cursor-pointer hover:shadow-md transition-shadow min-w-48 mt-0 mb-0`}
            onClick={e => roomMatch?.Quizzers && roomMatch?.Quizzers.length > 0 ? window.openRoomDialog(e) : undefined}
        >
            <div className="card-body p-2">
                <div className="flex justify-between items-center mb-0">
                    <h4 className="card-title text-sm font-bold">Room {roomName}</h4>
                    {stateBadge}
                </div>
                <ul className="text-xs space-y-1 mb-0 mt-0">
                    {participants.map((p, i) => (
                        <li
                            key={p.key}
                            className={`flex items-center gap-1 ${p.isPlaceholder ? "italic text-base-content/60" : ""} ${i > 0 ? "border-t border-primary" : ""} pt-1`}
                            style={{ marginLeft: "unset" }}
                        >
                            {p.isPlaceholder && p.rank !== null ? (
                                <>
                                    <span className={`badge badge-sm ${getRankBadgeClass(p.rank, true, true)}`}>
                                        {DataTypeHelpers.ordinalWithSuffix(p.rank)}
                                    </span>
                                    <span>from Room {p.name}</span>
                                </>
                            ) : !p.isPlaceholder ? (
                                <>
                                    <span className={`badge badge-sm ${getRankBadgeClass(p.rank, !!p.nextRoom, true)}`}>
                                        {p.rank === null ? "?" : DataTypeHelpers.ordinalWithSuffix(p.rank)}
                                    </span>
                                    <span>{p.name}
                                        {p.churchName && (
                                            <>
                                                <br />
                                                <i>{p.churchName}</i>
                                            </>)}
                                        {p.nextRoom && (
                                            <>
                                                <br />
                                                <b><i>Move to Room {p.nextRoom}</i></b>
                                            </>)}
                                    </span>
                                </>
                            ) : (
                                <span>{p.name}</span>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>);
}