import { useState } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { AuthManager } from "types/AuthManager";
import type { TeamOrQuizzerReference } from "types/Meets";
import type { OnlineMeetSchedulePreview } from "types/services/AstroMeetsService";
import SeedFromDivisionsDialog from "./SeedFromDivisionsDialog";
import SeedFromReportDialog from "./SeedFromReportDialog";

interface Props {
    selectedIds: number[];
    allItems: Record<number, TeamOrQuizzerReference>;
    disabled: boolean;
    isReadOnly: boolean;
    isIndividualCompetition: boolean;
    allowAddRemove?: boolean;
    schedulePreview?: OnlineMeetSchedulePreview | null;
    roomNames?: string[];
    isScheduleOutOfDate?: boolean;
    onIdsChange: (ids: number[]) => void;
    // Props for seeding functionality (individual competitions only)
    auth?: AuthManager;
    eventId?: string;
    databaseId?: string;
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

export default function TeamOrQuizzerSelector({
    selectedIds,
    allItems,
    disabled,
    isReadOnly,
    isIndividualCompetition,
    allowAddRemove = true,
    schedulePreview,
    roomNames,
    isScheduleOutOfDate,
    onIdsChange,
    auth,
    eventId,
    databaseId
}: Props) {
    // Drag state for reordering
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // Seed dialog state
    const [showSeedDialog, setShowSeedDialog] = useState(false);
    const [showSeedReportDialog, setShowSeedReportDialog] = useState(false);

    // Check if seeding is available (individual competition with auth props)
    const canSeed = auth && eventId && databaseId && !isReadOnly;

    // Labels based on tournament type
    const itemLabel = isIndividualCompetition ? "quizzer" : "team";
    const itemLabelPlural = isIndividualCompetition ? "quizzers" : "teams";
    const itemLabelCapitalized = isIndividualCompetition ? "Quizzer" : "Team";

    // Build quizzer initial room lookup for individual competitions
    const quizzerInitialRooms = isIndividualCompetition && schedulePreview && roomNames
        ? getQuizzerInitialRooms(schedulePreview, roomNames)
        : {};

    // Get available items (not yet selected and not hidden)
    const availableItems = Object.entries(allItems)
        .filter(([id, item]) => !selectedIds.includes(Number(id)) && !item.IsHidden)
        .sort(([, a], [, b]) => (a.Prefix ?? "").localeCompare(b.Prefix ?? "") || a.Name.localeCompare(b.Name));

    const handleAddItem = (itemId: number) => {
        if (!selectedIds.includes(itemId)) {
            onIdsChange([...selectedIds, itemId]);
        }
    };

    const handleRemoveItem = (itemId: number) => {
        onIdsChange(selectedIds.filter(id => id !== itemId));
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== targetIndex) {
            const newOrder = [...selectedIds];
            const [removed] = newOrder.splice(draggedIndex, 1);
            newOrder.splice(targetIndex, 0, removed);
            onIdsChange(newOrder);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    return (
        <div className="p-2 mt-0">
            {/* Add item dropdown */}
            {!isReadOnly && allowAddRemove && availableItems.length > 0 && (
                <div className="mb-3 mt-0 flex gap-2">
                    <select
                        className="select select-bordered select-sm w-full max-w-xs"
                        onChange={(e) => {
                            const itemId = Number(e.target.value);
                            if (itemId) handleAddItem(itemId);
                            e.target.value = "";
                        }}
                        disabled={disabled || isReadOnly}
                        defaultValue=""
                    >
                        <option value="" disabled>Add {itemLabel}...</option>
                        {availableItems.map(([id, item]) => (
                            <option key={id} value={id}>
                                {item.Prefix} {item.Name} {item.ChurchName ? `(${item.ChurchName})` : ""}
                            </option>
                        ))}
                    </select>
                    {canSeed && (
                        <>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline mt-0"
                                onClick={() => setShowSeedReportDialog(true)}
                                disabled={disabled}
                            >
                                <FontAwesomeIcon icon="fas faFileImport" />
                                Seed from File
                            </button>
                            {isIndividualCompetition && (
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline mt-0"
                                    onClick={() => setShowSeedDialog(true)}
                                    disabled={disabled}
                                >
                                    <FontAwesomeIcon icon="fas faSeedling" />
                                    Seed from Division(s)
                                </button>)}
                            <button
                                type="button"
                                className="btn btn-sm btn-outline btn-error mt-0"
                                onClick={() => onIdsChange([])}
                                disabled={disabled || selectedIds.length === 0 || isReadOnly}
                            >
                                <FontAwesomeIcon icon="fas faTrash" />
                                Clear
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Selected items list */}
            {selectedIds.length === 0 ? (
                <div className="text-center py-4 text-base-content/60">
                    <p className="text-sm italic">No {itemLabelPlural} assigned yet.</p>
                </div>
            ) : (
                <div className="space-y-1">
                    {selectedIds.map((itemId, index) => {
                        const item = allItems[itemId];
                        const isDragging = draggedIndex === index;
                        const isDragOver = dragOverIndex === index;

                        return (
                            <div
                                key={itemId}
                                className={`flex items-center gap-2 p-1 rounded-lg mt-0 mb-0 ${isDragOver ? "bg-primary/20" : "bg-base-100"
                                    } ${isDragging ? "opacity-50" : ""}`}
                                draggable={!isReadOnly && !disabled}
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDrop={(e) => handleDrop(e, index)}
                                onDragEnd={handleDragEnd}
                            >
                                {!isReadOnly && (
                                    <FontAwesomeIcon
                                        icon="fas faGripVertical"
                                        classNames={["cursor-grab", "text-base-content/40"]}
                                    />
                                )}
                                <span className="badge badge-ghost badge-sm">{index + 1}</span>
                                <span className="flex-1">
                                    {item?.Name || `${itemLabelCapitalized} ${itemId}`}
                                    {item?.ChurchName && (
                                        <span className="text-base-content/60 text-sm ml-2">
                                            ({item.ChurchName})
                                        </span>
                                    )}
                                    {isIndividualCompetition && quizzerInitialRooms[itemId] && (
                                        <span className={`badge badge-sm ml-2 ${isScheduleOutOfDate ? "badge-warning" : "badge-ghost"}`}>
                                            Room {quizzerInitialRooms[itemId]}
                                        </span>
                                    )}
                                </span>
                                {!isReadOnly && allowAddRemove && (
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-xs text-error"
                                        onClick={() => handleRemoveItem(itemId)}
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

            {/* Seed from Divisions Dialog */}
            {showSeedDialog && auth && eventId && databaseId && (
                <SeedFromDivisionsDialog
                    auth={auth}
                    eventId={eventId}
                    databaseId={databaseId}
                    isIndividualCompetition={isIndividualCompetition}
                    onSeed={(ids) => {
                        onIdsChange(ids);
                        setShowSeedDialog(false);
                    }}
                    onClose={() => setShowSeedDialog(false)}
                />
            )}

            {/* Seed from Report Dialog */}
            {showSeedReportDialog && auth && eventId && databaseId && (
                <SeedFromReportDialog
                    auth={auth}
                    eventId={eventId}
                    databaseId={databaseId}
                    isIndividualCompetition={isIndividualCompetition}
                    onSeed={(ids) => {
                        onIdsChange(ids);
                        setShowSeedReportDialog(false);
                    }}
                    onClose={() => setShowSeedReportDialog(false)}
                />
            )}
        </div>
    );
}
