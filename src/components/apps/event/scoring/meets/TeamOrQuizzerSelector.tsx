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
    // Id of the division being edited (0 for a new one) and the names of all divisions, so
    // teams or quizzers already in another division can be labeled.
    currentMeetId?: number;
    meetNames?: Record<number, string>;
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
    currentMeetId = 0,
    meetNames = {},
    onIdsChange,
    auth,
    eventId,
    databaseId
}: Props) {
    // Drag state for reordering
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // Add picker state. Checked ids are kept in the order they were checked, since the
    // order of the selected list is the seed order.
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [pickedIds, setPickedIds] = useState<number[]>([]);
    const [pickerFilter, setPickerFilter] = useState("");

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

    // Get available items (not yet selected and not hidden), with the other divisions each is already in.
    const filterText = pickerFilter.trim().toLowerCase();
    const availableItems = Object.entries(allItems)
        .filter(([id, item]) => !selectedIds.includes(Number(id)) && !item.IsHidden)
        .filter(([, item]) => !filterText ||
            [item.Prefix, item.Name, item.TeamName, item.ChurchName]
                .some(text => text?.toLowerCase().includes(filterText)))
        .map(([id, item]) => ({
            id: Number(id),
            item,
            otherDivisions: (item.MeetIds ?? [])
                .filter(meetId => meetId !== currentMeetId)
                .map(meetId => meetNames[meetId] ?? `Division ${meetId}`)
        }))
        .sort((a, b) => (a.item.Prefix ?? "").localeCompare(b.item.Prefix ?? "") || a.item.Name.localeCompare(b.item.Name));

    // Teams or quizzers already in another division are listed last; they can still be added
    // (e.g., for a playoff division).
    const unassignedItems = availableItems.filter(a => a.otherDivisions.length === 0);
    const assignedItems = availableItems.filter(a => a.otherDivisions.length > 0);

    const closePicker = () => {
        setIsPickerOpen(false);
        setPickedIds([]);
        setPickerFilter("");
    };

    const handleTogglePicked = (itemId: number) => {
        setPickedIds(prev => prev.includes(itemId)
            ? prev.filter(id => id !== itemId)
            : [...prev, itemId]);
    };

    const handleSelectAllUnassigned = () => {
        setPickedIds(prev => [...prev, ...unassignedItems.map(a => a.id).filter(id => !prev.includes(id))]);
    };

    const handleAddPicked = () => {
        const newIds = pickedIds.filter(id => !selectedIds.includes(id));
        if (newIds.length > 0) {
            onIdsChange([...selectedIds, ...newIds]);
        }

        closePicker();
    };

    const renderPickerItem = ({ id, item, otherDivisions }: typeof availableItems[number]) => (
        <label
            key={id}
            className="flex items-center gap-2 px-1 py-0.5 mt-0 rounded hover:bg-base-200 cursor-pointer"
        >
            <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-primary"
                checked={pickedIds.includes(id)}
                onChange={() => handleTogglePicked(id)}
                disabled={disabled}
            />
            <span className="flex-1">
                {item.Prefix} {item.Name}
                {item.ChurchName && (
                    <span className="text-base-content/60 text-sm ml-2">({item.ChurchName})</span>
                )}
                {otherDivisions.length > 0 && (
                    <span className="text-base-content/60 text-sm italic ml-2">
                        in {otherDivisions.join(", ")}
                    </span>
                )}
            </span>
        </label>
    );

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

    const handleRandomize = () => {
        const shuffled = [...selectedIds];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        onIdsChange(shuffled);
    };

    return (
        <div className="p-2 mt-0">
            {/* Add item dropdown */}
            {!isReadOnly && allowAddRemove && (
                <div className="mb-3 mt-0 flex gap-2">
                    <button
                        type="button"
                        className={`btn btn-sm mt-0 ${isPickerOpen ? "btn-active" : "btn-outline"}`}
                        onClick={() => isPickerOpen ? closePicker() : setIsPickerOpen(true)}
                        disabled={disabled || isReadOnly}
                    >
                        <FontAwesomeIcon icon="fas faPlus" />
                        Add {itemLabelPlural}
                    </button>
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
                        </>
                    )}
                    <button
                        type="button"
                        className="btn btn-sm btn-outline mt-0"
                        onClick={handleRandomize}
                        disabled={disabled || selectedIds.length <= 1 || isReadOnly}
                    >
                        <FontAwesomeIcon icon="fas faShuffle" />
                        Randomize
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline btn-error mt-0"
                        onClick={() => onIdsChange([])}
                        disabled={disabled || selectedIds.length === 0 || isReadOnly}
                    >
                        <FontAwesomeIcon icon="fas faTrash" />
                        Clear
                    </button>
                </div>
            )}

            {/* Add picker: check any number of items, then add them all at once */}
            {isPickerOpen && !isReadOnly && allowAddRemove && (
                <div className="mb-3 mt-0 p-2 border border-base-300 rounded-lg">
                    <input
                        type="search"
                        className="input input-bordered input-sm w-full"
                        placeholder={`Filter ${itemLabelPlural}...`}
                        value={pickerFilter}
                        onChange={(e) => setPickerFilter(e.target.value)}
                        disabled={disabled}
                        autoFocus
                    />
                    <div className="max-h-64 overflow-y-auto mt-2">
                        {availableItems.length === 0 && (
                            <p className="text-sm italic text-base-content/60 mt-0">
                                No {itemLabelPlural} {filterText ? "match the filter" : "left to add"}.
                            </p>
                        )}
                        {unassignedItems.map(renderPickerItem)}
                        {assignedItems.length > 0 && (
                            <div className="text-xs font-semibold text-base-content/60 mt-2 mb-1 px-1">
                                Already in another division
                            </div>
                        )}
                        {assignedItems.map(renderPickerItem)}
                    </div>
                    <div className="flex gap-2 mt-2">
                        <button
                            type="button"
                            className="btn btn-sm btn-primary mt-0"
                            onClick={handleAddPicked}
                            disabled={disabled || pickedIds.length === 0}
                        >
                            Add {pickedIds.length > 0 ? `${pickedIds.length} ` : ""}{pickedIds.length === 1 ? itemLabel : itemLabelPlural}
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-outline mt-0"
                            onClick={handleSelectAllUnassigned}
                            disabled={disabled || unassignedItems.every(a => pickedIds.includes(a.id))}
                        >
                            Select All{assignedItems.length > 0 ? " Unassigned" : ""}
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-ghost mt-0"
                            onClick={closePicker}
                            disabled={disabled}
                        >
                            Cancel
                        </button>
                    </div>
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
