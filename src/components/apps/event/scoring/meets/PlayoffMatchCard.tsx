import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { OnlinePlayoffMatch } from "types/services/AstroMeetPlayoffsService";

interface Props {
    match: OnlinePlayoffMatch;
    matchIndex: number;
    rooms: Record<number, string>;
    teams: Record<number, string>;
    isSaving: boolean;
    isReadOnly: boolean;
    onMatchTimeChange: (matchIndex: number, time: string) => void;
    onRoomTeamChange: (matchIndex: number, roomIndex: number, teamIndex: number, teamId: number | null) => void;
    onAddRoomToMatch: (matchIndex: number) => void;
    onRoomChange: (matchIndex: number, roomIndex: number, newRoomId: number) => void;
    onRemoveRoom: (matchIndex: number, roomIndex: number) => void;
}

export default function PlayoffMatchCard({
    match,
    matchIndex,
    rooms,
    teams,
    isSaving,
    isReadOnly,
    onMatchTimeChange,
    onRoomTeamChange,
    onAddRoomToMatch,
    onRoomChange,
    onRemoveRoom
}: Props) {
    // Get rooms already used in this match (for filtering available rooms)
    const usedRoomIds = match.RoomSchedule.map(r => r.Id);

    // Check if there are more rooms available to add
    const hasMoreRoomsAvailable = match.AvailableRooms.some(roomId => !usedRoomIds.includes(roomId));

    // Get all team IDs used across all rooms in this match (for filtering team options)
    const allUsedTeamIds = match.RoomSchedule.flatMap(r => r.TeamIds);

    return (
        <div className="card bg-base-200 p-2 mt-2 mb-0">
            <div className="flex items-center justify-between mb-0">
                <h4 className="font-semibold">
                    Playoff Round {match.Id}
                </h4>
                <div className="flex items-center gap-2">
                    <label className="label gap-2">
                        <span className="label-text text-sm">Time:</span>
                        <input
                            type="time"
                            className="input input-sm input-bordered w-32"
                            value={match.MatchTime || ""}
                            onChange={(e) => onMatchTimeChange(matchIndex, e.target.value)}
                            disabled={isSaving || isReadOnly}
                        />
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {match.RoomSchedule.map((room, roomIndex) => {
                    // Available rooms for this dropdown: current room + unused rooms
                    const availableRoomsForSelect = match.AvailableRooms.filter(
                        roomId => roomId === room.Id || !usedRoomIds.includes(roomId)
                    );

                    // Ensure we always have exactly 2 team slots (pad with null if needed)
                    const teamSlots: (number | null)[] = [
                        room.TeamIds[0] ?? null,
                        room.TeamIds[1] ?? null
                    ];

                    return (
                        <div key={`${room.Id}-${roomIndex}`} className="bg-base-100 p-3 rounded-lg mt-0 mb-0">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 flex-1">
                                    <span className="text-sm font-medium">Room:</span>
                                    {!isReadOnly && !room.HasScoringStarted ? (
                                        <select
                                            className="select select-sm select-bordered flex-1"
                                            value={room.Id}
                                            onChange={(e) => onRoomChange(matchIndex, roomIndex, Number(e.target.value))}
                                            disabled={isSaving}
                                        >
                                            {availableRoomsForSelect.map(roomId => (
                                                <option key={roomId} value={roomId}>
                                                    {rooms[roomId] || `Room ${roomId}`}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span className="font-medium">
                                            {rooms[room.Id] || `Room ${room.Id}`}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 mt-0">
                                    {room.HasScoringStarted && (
                                        <span className="badge badge-warning badge-sm">
                                            Scoring Started
                                        </span>
                                    )}
                                    {!isReadOnly && !room.HasScoringStarted && (
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-xs text-error mt-0"
                                            onClick={() => onRemoveRoom(matchIndex, roomIndex)}
                                            disabled={isSaving}
                                            title="Remove Room"
                                        >
                                            <FontAwesomeIcon icon="fas faXmark" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                {teamSlots.map((teamId, teamIndex) => {
                                    // Available teams for this dropdown:
                                    // - "Select Team..." option (empty)
                                    // - Currently selected team (if any)
                                    // - Teams not used in any other room in this round
                                    const availableTeamsForSelect = Object.entries(teams).filter(([id]) => {
                                        const numId = Number(id);
                                        // Include if it's the currently selected team
                                        if (numId === teamId) return true;
                                        // Exclude if used elsewhere in this round
                                        if (allUsedTeamIds.includes(numId)) return false;
                                        return true;
                                    });

                                    return (
                                        <div key={teamIndex} className="flex items-center gap-2 mt-2 mb-0">
                                            <select
                                                className="select select-sm select-bordered flex-1"
                                                value={teamId ?? ""}
                                                onChange={(e) => onRoomTeamChange(
                                                    matchIndex,
                                                    roomIndex,
                                                    teamIndex,
                                                    e.target.value === "" ? null : Number(e.target.value)
                                                )}
                                                disabled={isSaving || isReadOnly || !!room.HasScoringStarted}
                                            >
                                                <option value="">Select Team...</option>
                                                {availableTeamsForSelect.map(([id, name]) => (
                                                    <option key={id} value={id}>{name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                {/* Add Room button */}
                {!isReadOnly && hasMoreRoomsAvailable && (
                    <div className="bg-base-100 p-0 mt-0 mb-0 rounded-lg border-2 border-dashed border-base-300 flex items-center justify-center min-h-[120px]">
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => onAddRoomToMatch(matchIndex)}
                            disabled={isSaving}
                        >
                            <FontAwesomeIcon icon="fas faPlus" />
                            Add Room
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}