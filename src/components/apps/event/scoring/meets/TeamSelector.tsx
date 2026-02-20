import { useState } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { TeamOrQuizzerReference } from "types/Meets";

interface Props {
    selectedTeamIds: number[];
    allTeams: Record<number, TeamOrQuizzerReference>;
    disabled: boolean;
    isReadOnly: boolean;
    allowAddRemove?: boolean;
    onTeamIdsChange: (teamIds: number[]) => void;
}

export default function TeamSelector({
    selectedTeamIds,
    allTeams,
    disabled,
    isReadOnly,
    allowAddRemove = true,
    onTeamIdsChange
}: Props) {
    // Drag state for team reordering
    const [draggedTeamIndex, setDraggedTeamIndex] = useState<number | null>(null);
    const [dragOverTeamIndex, setDragOverTeamIndex] = useState<number | null>(null);

    // Get available teams (not yet selected)
    const availableTeams = Object.entries(allTeams)
        .filter(([id]) => !selectedTeamIds.includes(Number(id)))
        .sort(([, a], [, b]) => (a.Prefix ?? "").localeCompare(b.Prefix ?? "") || a.Name.localeCompare(b.Name));

    const handleAddTeam = (teamId: number) => {
        if (!selectedTeamIds.includes(teamId)) {
            onTeamIdsChange([...selectedTeamIds, teamId]);
        }
    };

    const handleRemoveTeam = (teamId: number) => {
        onTeamIdsChange(selectedTeamIds.filter(id => id !== teamId));
    };

    const handleTeamDragStart = (e: React.DragEvent, index: number) => {
        setDraggedTeamIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleTeamDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverTeamIndex(index);
    };

    const handleTeamDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        if (draggedTeamIndex !== null && draggedTeamIndex !== targetIndex) {
            const newOrder = [...selectedTeamIds];
            const [removed] = newOrder.splice(draggedTeamIndex, 1);
            newOrder.splice(targetIndex, 0, removed);
            onTeamIdsChange(newOrder);
        }
        setDraggedTeamIndex(null);
        setDragOverTeamIndex(null);
    };

    const handleTeamDragEnd = () => {
        setDraggedTeamIndex(null);
        setDragOverTeamIndex(null);
    };

    return (
        <div className="p-2">
            {/* Add team dropdown */}
            {!isReadOnly && allowAddRemove && availableTeams.length > 0 && (
                <div className="mb-3">
                    <select
                        className="select select-bordered select-sm w-full max-w-xs"
                        onChange={(e) => {
                            const teamId = Number(e.target.value);
                            if (teamId) handleAddTeam(teamId);
                            e.target.value = "";
                        }}
                        disabled={disabled}
                        defaultValue=""
                    >
                        <option value="" disabled>Add team...</option>
                        {availableTeams.map(([id, team]) => (
                            <option key={id} value={id}>
                                {team.Prefix} {team.Name} {team.ChurchName ? `(${team.ChurchName})` : ""}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Selected teams list */}
            {selectedTeamIds.length === 0 ? (
                <div className="text-center py-4 text-base-content/60">
                    <p className="text-sm italic">No teams assigned yet.</p>
                </div>
            ) : (
                <div className="space-y-1">
                    {selectedTeamIds.map((teamId, index) => {
                        const team = allTeams[teamId];
                        const isDragging = draggedTeamIndex === index;
                        const isDragOver = dragOverTeamIndex === index;

                        return (
                            <div
                                key={teamId}
                                className={`flex items-center gap-2 p-2 rounded-lg ${
                                    isDragOver ? "bg-primary/20" : "bg-base-100"
                                } ${isDragging ? "opacity-50" : ""}`}
                                draggable={!isReadOnly && !disabled}
                                onDragStart={(e) => handleTeamDragStart(e, index)}
                                onDragOver={(e) => handleTeamDragOver(e, index)}
                                onDrop={(e) => handleTeamDrop(e, index)}
                                onDragEnd={handleTeamDragEnd}
                            >
                                {!isReadOnly && (
                                    <FontAwesomeIcon
                                        icon="fas faGripVertical"
                                        classNames={["cursor-grab", "text-base-content/40"]}
                                    />
                                )}
                                <span className="badge badge-ghost badge-sm">{index + 1}</span>
                                <span className="flex-1">
                                    {team?.Name || `Team ${teamId}`}
                                    {team?.ChurchName && (
                                        <span className="text-base-content/60 text-sm ml-2">
                                            ({team.ChurchName})
                                        </span>
                                    )}
                                </span>
                                {!isReadOnly && allowAddRemove && (
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-xs text-error"
                                        onClick={() => handleRemoveTeam(teamId)}
                                        disabled={disabled}
                                    >
                                        <FontAwesomeIcon icon="fas faXmark" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}