import type { OnlineMeetSchedulePreview } from "types/services/AstroMeetsService";
import type { TeamOrQuizzerReference } from "types/Meets";

interface Props {
    schedulePreview: OnlineMeetSchedulePreview;
    selectedQuizzerIds: number[];
    allQuizzers: Record<number, TeamOrQuizzerReference>;
    roomNames: string[];
    isOutOfDate: boolean;
}

/**
 * Builds a lookup of quizzer id -> initial room name from the first match in the preview.
 */
function getQuizzerInitialRooms(
    schedulePreview: OnlineMeetSchedulePreview,
    roomNames: string[]
): Record<number, string> {
    const matchIds = Object.keys(schedulePreview.Matches).map(Number).sort((a, b) => a - b);
    if (matchIds.length === 0) return {};

    const firstMatch = schedulePreview.Matches[matchIds[0]];
    const result: Record<number, string> = {};

    for (const [roomId, room] of Object.entries(firstMatch.Rooms)) {
        const roomIndex = Number(roomId) - 1;
        const roomName = roomNames[roomIndex] || `R${roomId}`;
        for (const quizzerId of room.QuizzerIds ?? []) {
            result[quizzerId] = roomName;
        }
    }

    return result;
}

export default function IndividualSchedulePreviewTable({
    schedulePreview,
    selectedQuizzerIds,
    allQuizzers,
    roomNames,
    isOutOfDate
}: Props) {
    const matchIds = Object.keys(schedulePreview.Matches).map(Number).sort((a, b) => a - b);

    // Matches after the first one (which defines initial rooms)
    const routedMatchIds = matchIds.slice(1);

    // Room ids from the first match (defines the rooms)
    const firstMatch = matchIds.length > 0 ? schedulePreview.Matches[matchIds[0]] : null;
    const roomIds = firstMatch
        ? Object.keys(firstMatch.Rooms).map(Number).sort((a, b) => a - b)
        : [];

    // Build quizzer initial room lookup
    const quizzerInitialRooms = getQuizzerInitialRooms(schedulePreview, roomNames);

    /**
     * Format RoutedTeamOrQuizzers for a room in a match as "R1 - 1, R2 - 2" etc.
     */
    const formatRoutedQuizzers = (matchId: number, roomId: number): string => {
        const match = schedulePreview.Matches[matchId];
        if (!match) return "--";

        const room = match.Rooms[roomId];
        if (!room) return "--";

        const routed = room.RoutedTeamOrQuizzers;
        if (!routed || routed.length === 0) return "--";

        return routed
            .map(r => `R${r.RoomId} - ${r.RankOrder}`)
            .join(", ");
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

export { getQuizzerInitialRooms };