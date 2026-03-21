import { useState } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { TeamOrQuizzerReference } from "types/Meets";

interface Props {
    selectedIds: number[];
    allItems: Record<number, TeamOrQuizzerReference>;
    disabled: boolean;
    isReadOnly: boolean;
    isIndividualTournament: boolean;
    allowAddRemove?: boolean;
    onIdsChange: (ids: number[]) => void;
}

export default function TeamOrQuizzerSelector({
    selectedIds,
    allItems,
    disabled,
    isReadOnly,
    isIndividualTournament,
    allowAddRemove = true,
    onIdsChange
}: Props) {
    // Drag state for reordering
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // Labels based on tournament type
    const itemLabel = isIndividualTournament ? "quizzer" : "team";
    const itemLabelPlural = isIndividualTournament ? "quizzers" : "teams";
    const itemLabelCapitalized = isIndividualTournament ? "Quizzer" : "Team";

    // Get available items (not yet selected)
    const availableItems = Object.entries(allItems)
        .filter(([id]) => !selectedIds.includes(Number(id)))
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
        <div className="p-2">
            {/* Add item dropdown */}
            {!isReadOnly && allowAddRemove && availableItems.length > 0 && (
                <div className="mb-3">
                    <select
                        className="select select-bordered select-sm w-full max-w-xs"
                        onChange={(e) => {
                            const itemId = Number(e.target.value);
                            if (itemId) handleAddItem(itemId);
                            e.target.value = "";
                        }}
                        disabled={disabled}
                        defaultValue=""
                    >
                        <option value="" disabled>Add {itemLabel}...</option>
                        {availableItems.map(([id, item]) => (
                            <option key={id} value={id}>
                                {item.Prefix} {item.Name} {item.ChurchName ? `(${item.ChurchName})` : ""}
                            </option>
                        ))}
                    </select>
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
                                className={`flex items-center gap-2 p-2 rounded-lg ${
                                    isDragOver ? "bg-primary/20" : "bg-base-100"
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
        </div>
    );
}