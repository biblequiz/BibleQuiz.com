import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { OnlineDatabaseMeetDisplaySettings } from "types/services/AstroDatabasesService";

interface Props {
    meetId: number;
    displaySettings: OnlineDatabaseMeetDisplaySettings;
    hasAnyMissingQuestions: boolean;
    isReadOnly: boolean;
    disabled: boolean;
    isDragOver: boolean;
    onDisplaySettingsChange: (meetId: number, field: keyof OnlineDatabaseMeetDisplaySettings, value: boolean) => void;
    onEditSchedule: (meetId: number) => void;
    onEditPlayoffs: (meetId: number) => void;
    onEditRanking: (meetId: number) => void;
    onDelete: (meetId: number) => void;
    onDragStart: (e: React.DragEvent, meetId: number) => void;
    onDragEnd: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent, meetId: number) => void;
}

export default function DivisionCard({
    meetId,
    displaySettings,
    hasAnyMissingQuestions,
    isReadOnly,
    disabled,
    isDragOver,
    onDisplaySettingsChange,
    onEditSchedule,
    onEditPlayoffs,
    onEditRanking,
    onDelete,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop
}: Props) {
    const divisionName = displaySettings.NameOverride || displaySettings.Name;

    return (
        <div
            className={`card bg-base-100 shadow-md border ${isDragOver ? "border-primary border-2 bg-primary/10" : "border-base-300"}`}
            draggable={!isReadOnly && !disabled}
            onDragStart={(e) => onDragStart(e, meetId)}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, meetId)}
        >
            <div className="card-body p-4">
                {/* Header Row */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        {!isReadOnly && (
                            <FontAwesomeIcon
                                icon="fas faGripVertical"
                                classNames={["cursor-grab", "text-base-content/40"]}
                            />
                        )}
                        <h3 className="card-title text-base m-0">{divisionName}</h3>
                    </div>
                    {!isReadOnly && (
                        <button
                            type="button"
                            className="btn btn-ghost btn-xs text-error"
                            onClick={() => onDelete(meetId)}
                            disabled={disabled}
                            title="Delete Division"
                        >
                            <FontAwesomeIcon icon="fas faTrash" />
                        </button>
                    )}
                </div>

                {/* Missing Questions Warning */}
                {hasAnyMissingQuestions && (
                    <div className="flex items-center gap-2 text-warning text-sm mb-2">
                        <FontAwesomeIcon icon="fas faTriangleExclamation" />
                        <span>Missing Imported Questions</span>
                    </div>
                )}

                {/* Checkboxes Row */}
                <div className="flex flex-wrap gap-4 mb-3">
                    <label className="label cursor-pointer gap-2 p-0">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-primary"
                            checked={displaySettings.ShowSchedule}
                            onChange={(e) => onDisplaySettingsChange(meetId, "ShowSchedule", e.target.checked)}
                            disabled={disabled || isReadOnly}
                        />
                        <span className="label-text text-sm">Visible</span>
                    </label>

                    <label className="label cursor-pointer gap-2 p-0">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-primary"
                            checked={displaySettings.ShowScores}
                            onChange={(e) => onDisplaySettingsChange(meetId, "ShowScores", e.target.checked)}
                            disabled={disabled || isReadOnly}
                        />
                        <span className="label-text text-sm">Stats</span>
                    </label>

                    <label className="label cursor-pointer gap-2 p-0">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-primary"
                            checked={displaySettings.ShowIndividualScores}
                            onChange={(e) => onDisplaySettingsChange(meetId, "ShowIndividualScores", e.target.checked)}
                            disabled={disabled || isReadOnly}
                        />
                        <span className="label-text text-sm">Individuals</span>
                    </label>

                    <label className="label cursor-pointer gap-2 p-0">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-primary"
                            checked={displaySettings.ShowQuestionStats}
                            onChange={(e) => onDisplaySettingsChange(meetId, "ShowQuestionStats", e.target.checked)}
                            disabled={disabled || isReadOnly}
                        />
                        <span className="label-text text-sm">Q Stats</span>
                    </label>

                    <label className="label cursor-pointer gap-2 p-0">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-primary"
                            checked={displaySettings.AllowEZScore}
                            onChange={(e) => onDisplaySettingsChange(meetId, "AllowEZScore", e.target.checked)}
                            disabled={disabled || isReadOnly}
                        />
                        <span className="label-text text-sm">EZScore</span>
                    </label>
                </div>

                {/* Action Buttons Row */}
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => onEditSchedule(meetId)}
                        disabled={disabled}
                    >
                        <FontAwesomeIcon icon="fas faCalendarDays" />
                        Schedule
                    </button>

                    <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => onEditPlayoffs(meetId)}
                        disabled={disabled}
                    >
                        <FontAwesomeIcon icon="fas faTrophy" />
                        Playoffs
                    </button>

                    <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => onEditRanking(meetId)}
                        disabled={disabled}
                    >
                        <FontAwesomeIcon icon="fas faMedal" />
                        Ranking
                    </button>
                </div>
            </div>
        </div>
    );
}