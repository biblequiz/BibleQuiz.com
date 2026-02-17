import { useRef, useState } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { OnlineDatabaseMeetSummary } from "types/services/AstroDatabasesService";

interface Props {
    currentMeetId: number;
    currentMeetName: string;
    allMeets: OnlineDatabaseMeetSummary[];
    linkedMeetIds: number[];
    isReadOnly: boolean;
    onSave: (linkedMeetIds: number[]) => void;
    onClose: () => void;
}

/**
 * Dialog for selecting meets to link together.
 * Following the frmLinkedMeets pattern from ScoreKeep.
 */
export default function LinkedMeetsDialog({
    currentMeetId,
    currentMeetName,
    allMeets,
    linkedMeetIds,
    isReadOnly,
    onSave,
    onClose
}: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    // Initialize selected meets - always include current meet
    const [selectedMeetIds, setSelectedMeetIds] = useState<Set<number>>(() => {
        const initial = new Set(linkedMeetIds);
        initial.add(currentMeetId);
        return initial;
    });

    // Get other meets (excluding current)
    const otherMeets = allMeets.filter(m => m.Display.Id !== currentMeetId);

    const handleToggleMeet = (meetId: number) => {
        setSelectedMeetIds(prev => {
            const updated = new Set(prev);
            if (updated.has(meetId)) {
                updated.delete(meetId);
            } else {
                updated.add(meetId);
            }
            return updated;
        });
    };

    const handleSave = () => {
        // Convert to array, ensuring current meet is included
        const linkedIds = Array.from(selectedMeetIds);
        
        // If only current meet is selected, that means no linked meets
        if (linkedIds.length <= 1) {
            onSave([]);
        } else {
            onSave(linkedIds);
        }
    };

    const hasLinkedMeets = selectedMeetIds.size > 1;

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
                        </div>
                    </div>

                    {/* Current Meet (always included) */}
                    <div className="mb-4">
                        <h4 className="font-semibold text-sm mb-2">Current Division</h4>
                        <div className="bg-base-200 p-3 rounded-lg">
                            <label className="flex items-center gap-3 cursor-not-allowed">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm checkbox-primary"
                                    checked={true}
                                    disabled={true}
                                />
                                <span className="font-medium">{currentMeetName}</span>
                                <span className="badge badge-primary badge-sm">Current</span>
                            </label>
                        </div>
                    </div>

                    {/* Other Meets */}
                    <div>
                        <h4 className="font-semibold text-sm mb-2">
                            {isReadOnly ? "Linked Divisions" : "Select Divisions to Link"}
                        </h4>
                        
                        {otherMeets.length === 0 ? (
                            <div className="text-center py-4 text-base-content/60">
                                <p className="text-sm italic">
                                    No other divisions available to link.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {otherMeets.map(meet => {
                                    const meetName = meet.Display.NameOverride || meet.Display.Name;
                                    const isSelected = selectedMeetIds.has(meet.Display.Id);
                                    const isLinkedToAnother = meet.LinkedMeetGroupId && 
                                        !linkedMeetIds.includes(meet.Display.Id) &&
                                        linkedMeetIds.length > 0;

                                    return (
                                        <div
                                            key={meet.Display.Id}
                                            className={`p-3 rounded-lg border ${
                                                isSelected ? "bg-primary/10 border-primary" : "bg-base-200 border-transparent"
                                            }`}
                                        >
                                            <label className={`flex items-center gap-3 ${isReadOnly ? "cursor-not-allowed" : "cursor-pointer"}`}>
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-sm checkbox-primary"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleMeet(meet.Display.Id)}
                                                    disabled={isReadOnly}
                                                />
                                                <div className="flex-1">
                                                    <span className="font-medium">{meetName}</span>
                                                    {isLinkedToAnother && (
                                                        <span className="badge badge-warning badge-sm ml-2">
                                                            Already Linked
                                                        </span>
                                                    )}
                                                </div>
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
                            {hasLinkedMeets ? `Link ${selectedMeetIds.size} Divisions` : "Remove Links"}
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