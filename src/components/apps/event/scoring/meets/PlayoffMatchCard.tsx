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
    onAddTeamToRoom: (matchIndex: number, roomIndex: number) => void;
    onRemoveMatch: (matchIndex: number) => void;
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
    onAddTeamToRoom,
    onRemoveMatch
}: Props) {
    return (
        <div className="card bg-base-200 p-4">
            <div className="flex items-center justify-between mb-3">
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
                    {!isReadOnly && (
                        <button
                            type="button"
                            className="btn btn-ghost btn-xs text-error"
                            onClick={() => onRemoveMatch(matchIndex)}
                            disabled={isSaving}
                            title="Remove Match"
                        >
                            <FontAwesomeIcon icon="fas faTrash" />
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {match.RoomSchedule.map((room, roomIndex) => (
                    <div key={room.Id} className="bg-base-100 p-3 rounded-lg">
                        <div className="font-medium text-sm mb-2">
                            Room: {rooms[room.Id] || `Room ${room.Id}`}
                            {room.HasScoringStarted && (
                                <span className="badge badge-warning badge-sm ml-2">
                                    Scoring Started
                                </span>
                            )}
                        </div>
                        <div className="space-y-2">
                            {room.TeamIds.map((teamId, teamIndex) => (
                                <div key={teamIndex} className="flex items-center gap-2">
                                    <select
                                        className="select select-sm select-bordered flex-1"
                                        value={teamId}
                                        onChange={(e) => onRoomTeamChange(
                                            matchIndex,
                                            roomIndex,
                                            teamIndex,
                                            Number(e.target.value)
                                        )}
                                        disabled={isSaving || isReadOnly || !!room.HasScoringStarted}
                                    >
                                        {Object.entries(teams).map(([id, name]) => (
                                            <option key={id} value={id}>{name}</option>
                                        ))}
                                    </select>
                                    {!isReadOnly && !room.HasScoringStarted && (
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-xs text-error"
                                            onClick={() => onRoomTeamChange(
                                                matchIndex,
                                                roomIndex,
                                                teamIndex,
                                                null
                                            )}
                                            disabled={isSaving}
                                        >
                                            <FontAwesomeIcon icon="fas faXmark" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {!isReadOnly && !room.HasScoringStarted && (
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-xs w-full"
                                    onClick={() => onAddTeamToRoom(matchIndex, roomIndex)}
                                    disabled={isSaving}
                                >
                                    <FontAwesomeIcon icon="fas faPlus" />
                                    Add Team
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}