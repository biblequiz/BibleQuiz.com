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
    /** Ref callback to track position for connectors */
    onRef?: (element: HTMLDivElement | null) => void;
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
    onClick,
    onRef
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
    const participants: { key: string; display: string; isPlaceholder: boolean }[] = [];

    if (isBye || !roomMatch) {
        participants.push({ key: `${matchIndex}-${roomIndex}-bye`, display: "BYE", isPlaceholder: true });
    } else if (roomMatch.Quizzers && roomMatch.Quizzers.length > 0) {
        // Resolved quizzers - show actual names (use Set to prevent duplicates)
        const seenQuizzerIds = new Set<number>();
        for (let i = 0; i < roomMatch.Quizzers.length; i++) {
            const quizzerId = roomMatch.Quizzers[i];
            // Skip if we've already seen this quizzer
            if (seenQuizzerIds.has(quizzerId)) {
                continue;
            }
            seenQuizzerIds.add(quizzerId);
            
            const quizzer = meet.Quizzers?.[quizzerId];
            if (quizzer) {
                const displayName = quizzer.ChurchName 
                    ? `${quizzer.Name} (${quizzer.ChurchName})`
                    : quizzer.Name;
                participants.push({
                    key: `${matchIndex}-${roomIndex}-q-${i}-${quizzerId}`,
                    display: displayName,
                    isPlaceholder: false
                });
            }
        }
    } else if (roomMatch.RankedTeamsOrQuizzers && roomMatch.RankedTeamsOrQuizzers.length > 0) {
        // Unresolved - show placeholders like "1st from Room 1"
        for (let i = 0; i < roomMatch.RankedTeamsOrQuizzers.length; i++) {
            const route = roomMatch.RankedTeamsOrQuizzers[i];
            const sourceRoom = meet.Rooms?.[route.Room];
            const sourceRoomName = sourceRoom?.Name || `Room ${route.Room + 1}`;
            participants.push({
                key: `${matchIndex}-${roomIndex}-r-${i}-${route.Room}-${route.Rank}`,
                display: `${DataTypeHelpers.ordinalWithSuffix(route.Rank)} from ${sourceRoomName}`,
                isPlaceholder: true
            });
        }
    } else {
        participants.push({ key: `${matchIndex}-${roomIndex}-tbd`, display: "TBD", isPlaceholder: true });
    }

    return (
        <div
            ref={onRef}
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
                <ul className="text-xs space-y-0.5">
                    {participants.map((p) => (
                        <li 
                            key={p.key}
                            className={p.isPlaceholder ? "italic text-base-content/60" : ""}
                        >
                            {p.display}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}