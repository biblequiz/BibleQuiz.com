import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { OnlineMeetSchedulePreview } from "types/services/AstroMeetsService";
import type { TeamOrQuizzerReference } from "types/Meets";
import { DataTypeHelpers } from "utils/DataTypeHelpers";
import IndividualSchedulePreviewTable from "./IndividualSchedulePreviewTable";

interface Props {
    schedulePreview: OnlineMeetSchedulePreview | null;
    isIndividualCompetition: boolean;
    selectedTeamIds: number[];
    selectedQuizzerIds: number[];
    allTeams: Record<number, TeamOrQuizzerReference>;
    allQuizzers: Record<number, TeamOrQuizzerReference>;
    roomNames: string[];
    includeByesInScores: boolean;
    isOutOfDate: boolean;
    isRefreshing: boolean;
    disabled: boolean;
    isReadOnly: boolean;
    useOptimizer: boolean;
    showMatchTimes: boolean;
    matchTimes: Record<number, string | null>;
    onUseOptimizerChange: (value: boolean) => void;
    onRefreshPreview: () => void;
    onMatchTimeChange: (matchId: number, time: string | null) => void;
    onResetMatchTimes: () => void;
    onExportStats: () => void;
    onFullscreenChange?: (isFullscreen: boolean) => void;
}

export default function SchedulePreviewTable({
    schedulePreview,
    isIndividualCompetition,
    selectedTeamIds,
    selectedQuizzerIds,
    allTeams,
    allQuizzers,
    roomNames,
    includeByesInScores,
    isOutOfDate,
    isRefreshing,
    disabled,
    isReadOnly,
    useOptimizer,
    showMatchTimes,
    matchTimes,
    onUseOptimizerChange,
    onRefreshPreview,
    onMatchTimeChange,
    onResetMatchTimes,
    onExportStats,
    onFullscreenChange
}: Props) {
    const selectedCount = isIndividualCompetition ? selectedQuizzerIds.length : selectedTeamIds.length;
    const itemLabelPlural = isIndividualCompetition ? "quizzers" : "teams";
    const [draftMatchTimes, setDraftMatchTimes] = useState<Record<number, string>>({});
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Handle fullscreen toggle
    const handleFullscreenToggle = useCallback(() => {
        const newValue = !isFullscreen;
        setIsFullscreen(newValue);
        onFullscreenChange?.(newValue);
    }, [isFullscreen, onFullscreenChange]);

    // Handle Escape key to exit fullscreen
    useEffect(() => {
        if (!isFullscreen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                setIsFullscreen(false);
                onFullscreenChange?.(false);
            }
        };

        document.addEventListener("keydown", handleKeyDown, true);
        return () => document.removeEventListener("keydown", handleKeyDown, true);
    }, [isFullscreen, onFullscreenChange]);

    const handleDraftTimeChange = (matchId: number, value: string) => {
        setDraftMatchTimes(prev => ({
            ...prev,
            [matchId]: value
        }));
    };

    const handleDraftTimeBlur = (matchId: number, value: string, currentValue: string | null) => {
        const newValue = DataTypeHelpers.formatTimeSpanAsTime(value);
        if (newValue !== currentValue) {
            onMatchTimeChange(matchId, newValue);
        }

        setDraftMatchTimes(prev => {
            const next = { ...prev };
            delete next[matchId];
            return next;
        });
    };

    // Render the toolbar controls
    const renderToolbar = (inFullscreen: boolean = false) => (
        <div className={`flex flex-wrap items-center gap-4 ${inFullscreen ? "mb-4" : "mb-4"}`}>
            {!isReadOnly && (
                <>
                    {!isIndividualCompetition && (
                        <label className="label cursor-pointer mt-0 mb-0 gap-2">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-sm"
                                checked={useOptimizer}
                                onChange={(e) => onUseOptimizerChange(e.target.checked)}
                                disabled={disabled || isRefreshing}
                            />
                            <span className="label-text text-sm">Use Optimizer</span>
                        </label>
                    )}
                    <button
                        type="button"
                        className={`btn btn-sm mt-0 mb-0 ${isOutOfDate ? "btn-warning" : "btn-outline"}`}
                        onClick={onRefreshPreview}
                        disabled={disabled || isRefreshing || selectedCount < 2}
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
                </>
            )}
            {/* Export Stats button is always visible - it doesn't change data */}
            <button
                type="button"
                className="btn btn-sm btn-outline mt-0 mb-0"
                onClick={onExportStats}
                disabled={disabled || isRefreshing || !schedulePreview}
            >
                <FontAwesomeIcon icon="fas faFileExcel" />
                Export Schedule Stats
            </button>
            {/* Fullscreen toggle button */}
            {schedulePreview && (
                <button
                    type="button"
                    className="btn btn-sm btn-outline mt-0 mb-0"
                    onClick={handleFullscreenToggle}
                    title={isFullscreen ? "Exit Fullscreen (Esc)" : "View Fullscreen"}
                >
                    <FontAwesomeIcon icon={isFullscreen ? "fas faCompress" : "fas faExpand"} />
                    {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                </button>
            )}
        </div>
    );

    // Render the schedule content (table or individual competition view)
    const renderScheduleContent = () => {
        if (selectedCount < 2) {
            return (
                <div className="text-center py-4 text-base-content/60">
                    <p className="text-sm italic">
                        Add at least 2 {itemLabelPlural} to see schedule preview.
                    </p>
                </div>
            );
        }

        if (isOutOfDate && !schedulePreview) {
            return (
                <div className="text-center py-4">
                    <div className="alert alert-warning">
                        <FontAwesomeIcon icon="fas faTriangleExclamation" />
                        <span>Click "Refresh Preview" to generate the schedule.</span>
                    </div>
                </div>
            );
        }

        if (!schedulePreview) return null;

        if (isIndividualCompetition) {
            return (
                <IndividualSchedulePreviewTable
                    allQuizzers={allQuizzers}
                    schedulePreview={schedulePreview}
                    roomNames={roomNames}
                />
            );
        }

        return (
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
                    {showMatchTimes && (
                        <tfoot>
                            <tr className="border-t-2 border-base-300">
                                <td className="font-semibold">
                                    Match Time
                                    {!isReadOnly && (
                                        <button
                                            type="button"
                                            className="btn btn-xs btn-outline ml-1"
                                            onClick={onResetMatchTimes}
                                            disabled={disabled || isRefreshing}
                                            title="Reset match times"
                                        >
                                            <FontAwesomeIcon icon="fas faRotateLeft" />
                                            <span>Reset Times</span>
                                        </button>
                                    )}
                                </td>
                                {Object.entries(schedulePreview.Matches).map(([matchId]) => {
                                    const matchIdNum = Number(matchId);
                                    const formattedValue = DataTypeHelpers.formatTimeSpanAsTime(matchTimes[matchIdNum] ?? "") || "";
                                    const inputValue = draftMatchTimes[matchIdNum] ?? formattedValue;
                                    return (
                                        <td key={`time-${matchId}`} className="text-center">
                                            {isReadOnly ? (
                                                <span>{formattedValue || "--"}</span>
                                            ) : (
                                                <input
                                                    type="time"
                                                    className="input input-xs input-bordered w-20 text-center"
                                                    value={inputValue}
                                                    onChange={(e) => handleDraftTimeChange(matchIdNum, e.target.value)}
                                                    onBlur={(e) => {
                                                        handleDraftTimeBlur(matchIdNum, e.target.value, matchTimes[matchIdNum] ?? null);
                                                    }}
                                                    disabled={disabled || isRefreshing}
                                                />
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        );
    };

    // Fullscreen overlay - render to document body using portal for full viewport width
    const fullscreenOverlay = isFullscreen && typeof document !== "undefined"
        ? createPortal(
            <div
                className="fixed inset-0 z-50 bg-base-100 overflow-auto"
                style={{ top: "var(--sl-nav-height, 4rem)" }}
            >
                <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <FontAwesomeIcon icon="fas faTableCells" />
                            Schedule Preview
                        </h2>
                        <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={handleFullscreenToggle}
                            title="Exit Fullscreen (Esc)"
                        >
                            <FontAwesomeIcon icon="fas faXmark" />
                            Close
                        </button>
                    </div>
                    {renderToolbar(true)}
                    {renderScheduleContent()}
                </div>
            </div>,
            document.body
        )
        : null;

    // When fullscreen, show placeholder in original location
    if (isFullscreen) {
        return (
            <>
                {/* Regular view placeholder when in fullscreen */}
                <div className="p-2">
                    {renderToolbar(false)}
                    <div className="text-center py-4 text-base-content/60">
                        <p className="text-sm italic">
                            Schedule is displayed in fullscreen mode. Press Escape or click "Exit Fullscreen" to return.
                        </p>
                    </div>
                </div>

                {/* Fullscreen overlay rendered via portal to document.body */}
                {fullscreenOverlay}
            </>
        );
    }

    return (
        <div className="p-2">
            {renderToolbar(false)}
            {renderScheduleContent()}
        </div>
    );
}
