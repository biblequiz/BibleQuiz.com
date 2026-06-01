import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { AuthManager } from "types/AuthManager";
import { AstroDatabasesService } from "types/services/AstroDatabasesService";

interface Props {
    auth: AuthManager;
    eventId: string;
    databaseId: string;
    isIndividualCompetition: boolean;
    /**
     * Operating mode for the dialog.
     * - "seed" (default): The selected meet ids are resolved into ranked team/quizzer ids via
     *   AstroDatabasesService.getRankedTeamsOrQuizzers, and the resulting ids are passed to onSeed.
     * - "selectIds": The selected meet ids are passed to onSeed directly without any server round-trip.
     */
    mode?: "seed" | "selectIds";
    /**
     * Override for the dialog title. Defaults to "Seed from Division(s)".
     */
    title?: string;
    /**
     * Override for the submit button label. Defaults to "Seed" (or "Working..." while running).
     */
    submitLabel?: string;
    /**
     * Override for the icon shown on the submit button. Defaults to "fas faSeedling".
     */
    submitIcon?: string;
    /**
     * Override for the alert title. Defaults to "Seed Quizzers from Rankings".
     */
    alertTitle?: string;
    /**
     * Override for the alert body. Defaults to the seed-from-rankings description.
     */
    alertDescription?: string;
    onSeed: (ids: number[]) => void;
    onClose: () => void;
}

/**
 * Dialog for selecting meets to seed quizzers from their rankings.
 * Supports drag-and-drop reordering of selected meets.
 */
export default function SeedFromDivisionsDialog({
    auth,
    eventId,
    databaseId,
    isIndividualCompetition,
    mode = "seed",
    title,
    submitLabel,
    submitIcon,
    alertTitle,
    alertDescription,
    onSeed,
    onClose
}: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    // Loading state
    const [isLoading, setIsLoading] = useState(true);
    const [isSeeding, setIsSeeding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Meets data: meetId -> meetName
    const [meetsWithRanks, setMeetsWithRanks] = useState<Record<number, string>>({});

    // Selected meet IDs in order
    const [selectedMeetIds, setSelectedMeetIds] = useState<number[]>([]);

    // Drag state
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const [dragOverId, setDragOverId] = useState<number | null>(null);

    // Load meets with ranks on mount
    useEffect(() => {
        setIsLoading(true);
        setError(null);

        AstroDatabasesService.getMeetsWithRanks(auth, eventId, databaseId, isIndividualCompetition)
            .then(data => {
                setMeetsWithRanks(data);
                setIsLoading(false);
            })
            .catch(err => {
                setError(err.message || "Failed to load divisions with rankings.");
                setIsLoading(false);
            });
    }, [auth, eventId, databaseId, isIndividualCompetition]);

    // Handle Escape key to close dialog without propagating to parent dialogs.
    // Use stopImmediatePropagation to prevent other listeners on document from firing.
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !isSeeding) {
                e.preventDefault();
                e.stopImmediatePropagation();
                onClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown, { capture: true });
        return () => document.removeEventListener("keydown", handleKeyDown, { capture: true });
    }, [onClose, isSeeding]);

    // Get the order of a meet in the selected list
    const getOrderIndex = (meetId: number): number => {
        return selectedMeetIds.indexOf(meetId);
    };

    const handleToggleMeet = (meetId: number) => {
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

    // Drag and drop handlers
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

    const handleSeed = async () => {
        if (selectedMeetIds.length === 0) {
            setError("Please select at least one division to seed from.");
            return;
        }

        // In "selectIds" mode, the caller wants the raw selected meet ids without any
        // server-side resolution. This is used by callers such as the bulk-add flow
        // where the meet ids feed into a separate template generation step.
        if (mode === "selectIds") {
            onSeed([...selectedMeetIds]);
            return;
        }

        setIsSeeding(true);
        setError(null);

        try {
            const rankedIds = await AstroDatabasesService.getRankedTeamsOrQuizzers(
                auth,
                eventId,
                databaseId,
                {
                    Individuals: isIndividualCompetition,
                    MeetIds: selectedMeetIds
                }
            );

            onSeed(rankedIds);
        } catch (err: any) {
            setError(err.message || "Failed to retrieve rankings.");
            setIsSeeding(false);
        }
    };

    // Build sorted list of meets for display
    // Selected meets first (in their order), then unselected alphabetically
    const allMeetEntries = Object.entries(meetsWithRanks).map(([id, name]) => ({
        id: Number(id),
        name
    }));

    const sortedMeetItems = [...allMeetEntries].sort((a, b) => {
        const aChecked = selectedMeetIds.includes(a.id);
        const bChecked = selectedMeetIds.includes(b.id);

        if (aChecked && bChecked) {
            // Both checked: sort by their position in selectedMeetIds
            return getOrderIndex(a.id) - getOrderIndex(b.id);
        } else if (aChecked && !bChecked) {
            return -1;
        } else if (!aChecked && bChecked) {
            return 1;
        } else {
            // Both unchecked: sort alphabetically
            return a.name.localeCompare(b.name);
        }
    });

    const hasSelectedMeets = selectedMeetIds.length > 0;

    const resolvedTitle = title ?? "Seed from Division(s)";
    const resolvedSubmitLabel = submitLabel ?? "Seed";
    const resolvedSubmitWorkingLabel = submitLabel ? `${submitLabel}...` : "Seeding...";
    const resolvedSubmitIcon = submitIcon ?? "fas faSeedling";
    const resolvedAlertTitle = alertTitle ?? "Seed Quizzers from Rankings";
    const resolvedAlertDescription = alertDescription ?? "Select divisions to seed quizzers based on their rankings. The order of divisions determines the priority when combining rankings.";

    const dialogContent = (
        <dialog ref={dialogRef} className="modal modal-open" open>
            <div className="modal-box w-full max-w-lg">
                <h3 className="font-bold text-lg">
                    <FontAwesomeIcon icon={resolvedSubmitIcon} />
                    <span className="ml-2">{resolvedTitle}</span>
                </h3>
                <button
                    type="button"
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    onClick={onClose}
                    disabled={isSeeding}
                >✕</button>

                <div className="mt-4">
                    <div className="alert alert-info mb-4">
                        <FontAwesomeIcon icon="fas faCircleInfo" />
                        <div className="text-sm">
                            <p className="font-semibold">{resolvedAlertTitle}</p>
                            <p>{resolvedAlertDescription}</p>
                            {hasSelectedMeets && (
                                <p className="mt-1 text-info-content/80">
                                    <FontAwesomeIcon icon="fas faGripVertical" classNames={["mr-1"]} />
                                    Drag checked divisions to reorder them.
                                </p>
                            )}
                        </div>
                    </div>

                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <span className="loading loading-spinner loading-lg"></span>
                            <span className="ml-4">Loading divisions...</span>
                        </div>
                    )}

                    {error && (
                        <div role="alert" className="alert alert-error mb-4">
                            <FontAwesomeIcon icon="fas faCircleExclamation" />
                            <span>{error}</span>
                        </div>
                    )}

                    {!isLoading && (
                        <div>
                            <h4 className="font-semibold text-sm mb-2">
                                Select Divisions
                            </h4>

                            {allMeetEntries.length === 0 ? (
                                <div className="text-center py-4 text-base-content/60">
                                    <p className="text-sm italic">
                                        No divisions with rankings available.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-80 overflow-y-auto mt-0">
                                    {sortedMeetItems.map(meet => {
                                        const isSelected = selectedMeetIds.includes(meet.id);
                                        const orderIndex = getOrderIndex(meet.id);
                                        const isDragging = draggedId === meet.id;
                                        const isDragOver = dragOverId === meet.id;
                                        const canDrag = isSelected && !isSeeding;

                                        return (
                                            <div
                                                key={meet.id}
                                                className={`p-1 rounded-lg border transition-all mt-0 mb-0 ${
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
                                                    canDrag
                                                        ? "cursor-grab"
                                                        : isSeeding
                                                        ? "cursor-not-allowed"
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
                                                        disabled={isSeeding}
                                                    />
                                                    <div className="flex-1">
                                                        <span className="font-medium">{meet.name}</span>
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
                    )}
                </div>

                <div className="mt-4 text-right gap-2 flex justify-end">
                    <button
                        className="btn btn-sm btn-primary"
                        type="button"
                        onClick={handleSeed}
                        disabled={isLoading || isSeeding || selectedMeetIds.length === 0}
                    >
                        {isSeeding ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                {resolvedSubmitWorkingLabel}
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={resolvedSubmitIcon} />
                                {resolvedSubmitLabel}
                            </>
                        )}
                    </button>
                    <button
                        className="btn btn-sm btn-secondary"
                        type="button"
                        onClick={onClose}
                        disabled={isSeeding}
                    >
                        Cancel
                    </button>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button type="button" onClick={onClose} disabled={isSeeding}>close</button>
            </form>
        </dialog>
    );

    // Use portal to render at document.body level, escaping parent stacking contexts
    return createPortal(dialogContent, document.body);
}
