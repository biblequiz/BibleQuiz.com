import type { OnlineMeetSchedulePreview } from "types/services/AstroMeetsService";
import { DataTypeHelpers } from "utils/DataTypeHelpers";

/**
 * Gets the badge color class based on rank position
 */
function getRankBadgeClass(rank: number): string {
    if (rank === 1 || rank === 2) {
        return "badge-warning";
    }
    return "badge-success text-black";
}

interface Props {
    schedulePreview: OnlineMeetSchedulePreview;
    roomNames: string[];
}

export default function IndividualSchedulePreviewTable({
    schedulePreview,
    roomNames,
}: Props) {
    const matchIds = Object.keys(schedulePreview.Matches).map(Number).sort((a, b) => a - b);

    // Matches after the first one (which defines initial rooms)
    const routedMatchIds = matchIds.slice(1);

    // Room ids from the first match (defines the rooms)
    const firstMatch = matchIds.length > 0 ? schedulePreview.Matches[matchIds[0]] : null;
    const roomIds = firstMatch
        ? Object.keys(firstMatch.Rooms).map(Number).sort((a, b) => a - b)
        : [];

    /**
     * Format RoutedTeamOrQuizzers for a room in a match with rank badges
     */
    const formatRoutedQuizzers = (matchId: number, roomId: number): React.ReactNode => {
        const match = schedulePreview.Matches[matchId];
        if (!match) return "--";

        const room = match.Rooms[roomId];
        if (!room) return "--";

        const routed = room.RoutedTeamOrQuizzers;
        if (!routed || routed.length === 0) return "--";

        return routed.map((r, idx) => (
            <div className="mt-1">
                <span key={`quizzer-${matchId}-${roomId}-${idx}`} className="whitespace-nowrap">
                    <span className={`badge badge-sm ${getRankBadgeClass(r.RankOrder)}`}>
                        {DataTypeHelpers.ordinalWithSuffix(r.RankOrder)}
                    </span>
                    <span className="ml-1">from Room {roomNames[r.RoomId - 1]}</span>
                </span>
                {idx < routed.length - 1 && <br />}
            </div>));
    };

    return (
        <div className="space-y-4">
            {routedMatchIds.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="table table-xs">
                        <thead>
                            <tr>
                                <th>Room</th>
                                {routedMatchIds.map(matchId => (
                                    <th key={matchId} className="text-center">{matchId}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {roomIds.map(roomId => {
                                const roomIndex = roomId - 1;
                                const roomName = roomNames[roomIndex] || `R${roomId}`;
                                return (
                                    <tr key={roomId}>
                                        <td className="font-medium">{roomName}</td>
                                        {routedMatchIds.map(matchId => (
                                            <td key={matchId} className="text-center text-xs">
                                                {formatRoutedQuizzers(matchId, roomId)}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
