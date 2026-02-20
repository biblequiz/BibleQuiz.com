import { useRef, useState } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { OnlineDatabaseMeetSummary } from "types/services/AstroDatabasesService";

interface Props {
    currentMeetId: number;
    allMeets: OnlineDatabaseMeetSummary[];
    linkedMeetIds: number[];
    isReadOnly: boolean;
    onSave: (linkedMeetIds: number[]) => void;
    onClose: () => void;
}

/**
 * Dialog for selecting meets to link together.
 * Following the frmLinkedMeets pattern from ScoreKeep.
 * Supports drag-and-drop reordering of linked divisions.
 */
export default function LinkedMeetsDialog({
    currentMeetId,
    allMeets,
    linkedMeetIds,
    isReadOnly,
    onSave,
    onClose
}: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    // Initialize selected meets as an ordered array - honor API order exactly
    // The API includes current meet in the list, so use it as-is
    // If no linked meets from API, start with just the current meet
    const [selectedMeetIds, setSelectedMeetIds] = useState<number[]>(() => {
        if (linkedMeetIds.length === 0) {
            return [currentMeetId];
        }
        // API returns the full list including current meet in its proper position
        return [...linkedMeetIds];
    });

    // Drag state
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const [dragOverId, setDragOverId] = useState<number | null>(null);

    // Get the order of a meet in the selected list (for display purposes)
    const getOrderIndex = (meetId: number): number => {
        return selectedMeetIds.indexOf(meetId);
    };

    const handleToggleMeet = (meetId: number) => {
        // Cannot uncheck the current meet
        if (meetId === currentMeetId) {
            return;
        }

        setSelectedMeetIds(prev => {
            if (prev.includes(meetId)) {
                // Remove from array
                return prev.filter(id => id !== meetId);
            } else {
                // Add to end of array
                return [...prev, meetId];
            }
        });
    };

    // Drag and drop handlers - all checked items can be dragged including current meet
    const handleDragStart = (e: React.DragEvent, meetId: number) => {
        // Don't allow dragging unchecked items
        if (!selectedMeetIds.includes(meetId)) {
            e.preventDefault();
            return;
        }
        setDraggedId(meetId);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", meetId.toString());
    };

    const handleDragOver = (e: React.DragEvent, meetId: number) => {
        e.preventDefault();
        // Only allow dropping on other checked items
        if (selectedMeetIds.includes(meetId) && meetId !== draggedId) {
            setDragOverId(meetId);
            e.dataTransfer.dropEffect = "move";
        }
    };

    const handleDragLeave = () => {
        setDragOverId(null);
    };

    const handleDrop = (e: React.DragEvent, targetMeetId: number) => {
        e.preventDefault();
        setDragOverId(null);

        if (!draggedId || draggedId === targetMeetId) {
            setDraggedId(null);
            return;
        }

        // Don't allow dropping on unchecked items
        if (!selectedMeetIds.includes(targetMeetId)) {
            setDraggedId(null);
            return;
        }

        setSelectedMeetIds(prev => {
            const newOrder = [...prev];
            const draggedIndex = newOrder.indexOf(draggedId);
            const targetIndex = newOrder.indexOf(targetMeetId);

            if (draggedIndex === -1 || targetIndex === -1) return prev;

            // Remove dragged item and insert at target position
            newOrder.splice(draggedIndex, 1);
            newOrder.splice(targetIndex, 0, draggedId);

            return newOrder;
        });

        setDraggedId(null);
    };

    const handleDragEnd = () => {
        setDraggedId(null);
        setDragOverId(null);
    };

    const handleSave = () => {
        // If only current meet is selected, that means no linked meets
        if (selectedMeetIds.length <= 1) {
            onSave([]);
        } else {
            // Return the ordered array
            onSave(selectedMeetIds);
        }
    };

    const hasLinkedMeets = selectedMeetIds.length > 1;

    // Build the unified list of all meets for display
    // Linked meets first (in their order), then available meets alphabetically
    const allMeetItems = allMeets.map(meet => ({
        id: meet.Display.Id,
        name: meet.Display.NameOverride || meet.Display.Name,
        isCurrent: meet.Display.Id === currentMeetId,
        isLinkedToAnother: meet.LinkedMeetGroupId && 
            !linkedMeetIds.includes(meet.Display.Id) &&
            linkedMeetIds.length > 0
    }));

    // Sort: checked items first (in their order), then unchecked alphabetically
    const sortedMeetItems = [...allMeetItems].sort((a, b) => {
        const aChecked = selectedMeetIds.includes(a.id);
        const bChecked = selectedMeetIds.includes(b.id);

        if (aChecked && bChecked) {
            // Both checked: sort by their position in selectedMeetIds
            return getOrderIndex(a.id) - getOrderIndex(b.id);
        } else if (aChecked && !bChecked) {
            // a is checked, b is not: a comes first
            return -1;
        } else if (!aChecked && bChecked) {
            // b is checked, a is not: b comes first
            return 1;
        } else {
            // Both unchecked: sort alphabetically
            return a.name.localeCompare(b.name);
        }
    });

    return (
        <dialog ref={dialogRef} className="modal" open>
            <div className="modal-box w-full max-w-lg">
                <h3 className="font-bold text-lg">
                    <FontAwesomeIcon icon="fas faLink" />
                    <span className="ml-2">Linked Divisions</span>
                </h3>
                <button
                    type="button"
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    onClick={onClose}
                >✕</button>

                <div className="mt-4">
                    <div className="alert alert-info mb-4">
                        <FontAwesomeIcon icon="fas faCircleInfo" />
                        <div className="text-sm">
                            <p className="font-semibold">What are Linked Divisions?</p>
                            <p>
                                Linked divisions share scheduling settings and allow teams
                                from different divisions to play against each other in a
                                combined round-robin schedule.
                            </p>
                            {!isReadOnly && hasLinkedMeets && (
                                <p className="mt-1 text-info-content/80">
                                    <FontAwesomeIcon icon="fas faGripVertical" classNames={["mr-1"]} />
                                    Drag checked divisions to reorder them.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* All Meets - Unified List */}
                    <div>
                        <h4 className="font-semibold text-sm mb-2">
                            {isReadOnly ? "Linked Divisions" : "Select Divisions to Link"}
                        </h4>
                        
                        {allMeetItems.length === 0 ? (
                            <div className="text-center py-4 text-base-content/60">
                                <p className="text-sm italic">
                                    No divisions available.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {sortedMeetItems.map(meet => {
                                    const isSelected = selectedMeetIds.includes(meet.id);
                                    const orderIndex = getOrderIndex(meet.id);
                                    const isDragging = draggedId === meet.id;
                                    const isDragOver = dragOverId === meet.id;
                                    const canDrag = isSelected && !isReadOnly;
                                    const isCheckboxDisabled = meet.isCurrent || isReadOnly;

                                    return (
                                        <div
                                            key={meet.id}
                                            className={`p-3 rounded-lg border transition-all ${
                                                isDragging
                                                    ? "opacity-50 border-primary bg-primary/5"
                                                    : isDragOver
                                                    ? "border-primary border-2 bg-primary/10"
                                                    : isSelected 
                                                    ? "bg-primary/10 border-primary" 
                                                    : "bg-base-200 border-transparent"
                                            }`}
                                            draggable={canDrag}
                                            onDragStart={(e) => handleDragStart(e, meet.id)}
                                            onDragOver={(e) => handleDragOver(e, meet.id)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, meet.id)}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <label className={`flex items-center gap-3 ${
                                                isCheckboxDisabled && !canDrag
                                                    ? "cursor-not-allowed" 
                                                    : canDrag 
                                                    ? "cursor-grab" 
                                                    : "cursor-pointer"
                                            }`}>
                                                <span className={`w-6 text-center ${
                                                    canDrag 
                                                        ? "text-base-content/60 hover:text-base-content cursor-grab active:cursor-grabbing" 
                                                        : "text-base-content/20"
                                                }`}>
                                                    <FontAwesomeIcon icon="fas faGripVertical" />
                                                </span>
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-sm checkbox-primary"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleMeet(meet.id)}
                                                    disabled={isCheckboxDisabled}
                                                />
                                                <div className="flex-1">
                                                    <span className="font-medium">{meet.name}</span>
                                                    {meet.isCurrent && (
                                                        <span className="badge badge-primary badge-sm ml-2">
                                                            Current
                                                        </span>
                                                    )}
                                                    {meet.isLinkedToAnother && (
                                                        <span className="badge badge-warning badge-sm ml-2">
                                                            Already Linked
                                                        </span>
                                                    )}
                                                </div>
                                                {isSelected && (
                                                    <span className="badge badge-ghost badge-sm">
                                                        #{orderIndex + 1}
                                                    </span>
                                                )}
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Warning about shared settings */}
                    {hasLinkedMeets && !isReadOnly && (
                        <div className="alert alert-warning mt-4">
                            <FontAwesomeIcon icon="fas faTriangleExclamation" />
                            <div className="text-sm">
                                <p className="font-semibold">Important</p>
                                <p>
                                    All linked divisions will share the same scheduling settings
                                    (room names, match times, etc.). Changes to one division's
                                    schedule will affect all linked divisions.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-4 text-right gap-2 flex justify-end">
                    {!isReadOnly && (
                        <button
                            className="btn btn-sm btn-primary"
                            type="button"
                            onClick={handleSave}
                        >
                            <FontAwesomeIcon icon="fas faSave" />
                            {hasLinkedMeets ? `Link ${selectedMeetIds.length} Divisions` : "Remove Links"}
                        </button>
                    )}
                    <button
                        className="btn btn-sm btn-secondary"
                        type="button"
                        onClick={onClose}
                    >
                        {isReadOnly ? "Close" : "Cancel"}
                    </button>
                </div>
            </div>
        </dialog>
    );
}