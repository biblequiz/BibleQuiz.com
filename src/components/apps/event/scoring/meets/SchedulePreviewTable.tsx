import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { OnlineMeetSchedulePreview } from "types/services/AstroMeetsService";
import type { TeamOrQuizzerReference } from "types/Meets";

interface Props {
    schedulePreview: OnlineMeetSchedulePreview | null;
    selectedTeamIds: number[];
    allTeams: Record<number, TeamOrQuizzerReference>;
    roomNames: string[];
    includeByesInScores: boolean;
    isOutOfDate: boolean;
    isRefreshing: boolean;
    disabled: boolean;
    isReadOnly: boolean;
    useOptimizer: boolean;
    onUseOptimizerChange: (value: boolean) => void;
    onRefreshPreview: () => void;
}

export default function SchedulePreviewTable({
    schedulePreview,
    selectedTeamIds,
    allTeams,
    roomNames,
    includeByesInScores,
    isOutOfDate,
    isRefreshing,
    disabled,
    isReadOnly,
    useOptimizer,
    onUseOptimizerChange,
    onRefreshPreview
}: Props) {
    return (
        <div className="p-2">
            {/* Refresh controls */}
            {!isReadOnly && (
                <div className="flex flex-wrap items-center gap-4 mb-4">
                    <label className="label cursor-pointer gap-2">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={useOptimizer}
                            onChange={(e) => onUseOptimizerChange(e.target.checked)}
                            disabled={disabled || isRefreshing}
                        />
                        <span className="label-text text-sm">Use Optimizer</span>
                    </label>
                    <button
                        type="button"
                        className={`btn btn-sm ${isOutOfDate ? "btn-warning" : "btn-outline"}`}
                        onClick={onRefreshPreview}
                        disabled={disabled || isRefreshing || selectedTeamIds.length < 2}
                    >
                        {isRefreshing ? (
                            <>
                                <span className="loading loading-spinner loading-xs"></span>
                                Refreshing...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon="fas faRefresh" />
                                Refresh Preview
                            </>
                        )}
                    </button>
                </div>
            )}

            {selectedTeamIds.length < 2 ? (
                <div className="text-center py-4 text-base-content/60">
                    <p className="text-sm italic">
                        Add at least 2 teams to see schedule preview.
                    </p>
                </div>
            ) : isOutOfDate && !schedulePreview ? (
                <div className="text-center py-4">
                    <div className="alert alert-warning">
                        <FontAwesomeIcon icon="fas faTriangleExclamation" />
                        <span>Click "Refresh Preview" to generate the schedule.</span>
                    </div>
                </div>
            ) : schedulePreview ? (
                <div className="overflow-x-auto">
                    <table className="table table-xs">
                        <thead>
                            <tr>
                                <th>Team</th>
                                {Object.keys(schedulePreview.Matches).map(matchId => (
                                    <th key={matchId} className="text-center">{matchId}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {selectedTeamIds.map(teamId => {
                                const team = allTeams[teamId];
                                return (
                                    <tr key={teamId}>
                                        <td className="font-medium">
                                            {team?.Name || `Team ${teamId}`} ({team?.ChurchName || "No Church"})
                                        </td>
                                        {Object.entries(schedulePreview.Matches).map(([matchId, match]) => {
                                            let roomLabel = "--";
                                            for (const [roomId, room] of Object.entries(match.Rooms)) {
                                                if (room.TeamIds.includes(teamId)) {
                                                    if (room.IsByeRound && !includeByesInScores) {
                                                        roomLabel = "--";
                                                    } else {
                                                        const roomIndex = Number(roomId) - 1;
                                                        roomLabel = roomNames[roomIndex] || `R${roomId}`;
                                                    }
                                                    break;
                                                }
                                            }
                                            return (
                                                <td key={matchId} className="text-center">
                                                    {roomLabel}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    );
}