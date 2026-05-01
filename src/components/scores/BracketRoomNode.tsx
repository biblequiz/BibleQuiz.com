import type { ScoringReportMeet, ScoringReportRoomMatch } from "types/EventScoringReport";
import { DataTypeHelpers } from "utils/DataTypeHelpers";

export interface BracketRoomNodeProps {
    /** Room index within the meet */
    roomIndex: number;
    /** Room name */
    roomName: string;
    /** Match index (0-based) */
    matchIndex: number;
    /** The room match data */
    roomMatch: ScoringReportRoomMatch | null;
    /** The meet containing quizzer data */
    meet: ScoringReportMeet;
    /** Whether this room is a bye */
    isBye?: boolean;
    /** Callback when room is clicked */
    onClick?: () => void;
}

interface ParticipantDisplay {
    key: string;
    name: string;
    rank: number | null;
    isPlaceholder: boolean;
}

/**
 * Gets the badge color class based on rank position
 */
function getRankBadgeClass(rank: number): string {
    switch (rank) {
        case 1:
            return "badge-warning"; // Gold for 1st
        case 2:
            return "badge-neutral"; // Silver for 2nd
        case 3:
            return "badge-accent"; // Bronze for 3rd
        default:
            return "badge-ghost"; // Default for others
    }
}

/**
 * Displays a single room as a card in the bracket visualization.
 * Shows quizzers (resolved names or placeholders from routing).
 */
export default function BracketRoomNode({
    roomIndex,
    roomName,
    matchIndex,
    roomMatch,
    meet,
    isBye,
    onClick
}: BracketRoomNodeProps) {
    // Determine match state and styling
    let stateClass = "border-base-300";
    let stateBadge: React.ReactNode = null;
    
    if (roomMatch) {
        switch (roomMatch.State) {
            case "InProgress":
                stateClass = "border-info border-2";
                stateBadge = (
                    <span className="badge badge-info badge-sm">
                        <i className="fas fa-satellite-dish mr-1"></i>
                        Q{roomMatch.CurrentQuestion}
                    </span>
                );
                break;
            case "Completed":
                stateClass = "border-success";
                stateBadge = (
                    <span className="badge badge-success badge-sm">
                        <i className="fas fa-check mr-1"></i>
                        Done
                    </span>
                );
                break;
            default:
                stateClass = "border-base-300";
                break;
        }
    }

    // Build the list of participants to display
    const participants: ParticipantDisplay[] = [];

    if (isBye || !roomMatch) {
        participants.push({ key: `${matchIndex}-${roomIndex}-bye`, name: "BYE", rank: null, isPlaceholder: true });
    } else if (roomMatch.Quizzers && roomMatch.Quizzers.length > 0) {
        // Resolved quizzers - show actual names with rank if match is completed
        const seenQuizzerIds = new Set<number>();
        const isCompleted = roomMatch.State === "Completed";
        
        // Build list of quizzers with their ranks for sorting
        const quizzerData: { quizzerId: number; quizzer: any; rank: number | null }[] = [];
        
        for (let i = 0; i < roomMatch.Quizzers.length; i++) {
            const quizzerId = roomMatch.Quizzers[i];
            if (seenQuizzerIds.has(quizzerId)) continue;
            seenQuizzerIds.add(quizzerId);
            
            const quizzer = meet.Quizzers?.[quizzerId];
            if (quizzer) {
                // Get the rank from the quizzer's match data if completed
                const quizzerMatch = quizzer.Matches?.[matchIndex];
                const rank = isCompleted && quizzerMatch?.Rank ? quizzerMatch.Rank : null;
                quizzerData.push({ quizzerId, quizzer, rank });
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
            const { quizzerId, quizzer, rank } = quizzerData[i];
            const name = quizzer.ChurchName 
                ? `${quizzer.Name} (${quizzer.ChurchName})`
                : quizzer.Name;
            
            participants.push({
                key: `${matchIndex}-${roomIndex}-q-${i}-${quizzerId}`,
                name,
                rank,
                isPlaceholder: false
            });
        }
    } else if (roomMatch.RankedTeamsOrQuizzers && roomMatch.RankedTeamsOrQuizzers.length > 0) {
        // Unresolved - show placeholders like "1st from Room 1"
        for (let i = 0; i < roomMatch.RankedTeamsOrQuizzers.length; i++) {
            const route = roomMatch.RankedTeamsOrQuizzers[i];
            const sourceRoom = meet.Rooms?.[route.Room];
            const sourceRoomName = sourceRoom?.Name || `Room ${route.Room + 1}`;
            participants.push({
                key: `${matchIndex}-${roomIndex}-r-${i}-${route.Room}-${route.Rank}`,
                name: `${DataTypeHelpers.ordinalWithSuffix(route.Rank)} from ${sourceRoomName}`,
                rank: null,
                isPlaceholder: true
            });
        }
    } else {
        participants.push({ key: `${matchIndex}-${roomIndex}-tbd`, name: "TBD", rank: null, isPlaceholder: true });
    }

    return (
        <div
            data-room-index={roomIndex}
            data-match-index={matchIndex}
            className={`card card-compact bg-base-100 shadow-sm border ${stateClass} cursor-pointer hover:shadow-md transition-shadow min-w-48`}
            onClick={onClick}
        >
            <div className="card-body p-2">
                <div className="flex justify-between items-center">
                    <h4 className="card-title text-sm font-bold">{roomName}</h4>
                    {stateBadge}
                </div>
                <ul className="text-xs space-y-1">
                    {participants.map((p) => (
                        <li 
                            key={p.key}
                            className={`flex items-center gap-1 ${p.isPlaceholder ? "italic text-base-content/60" : ""}`}
                        >
                            {p.rank !== null && (
                                <span className={`badge badge-xs ${getRankBadgeClass(p.rank)}`}>
                                    {DataTypeHelpers.ordinalWithSuffix(p.rank)}
                                </span>
                            )}
                            <span className={p.rank !== null ? "" : ""}>{p.name}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}