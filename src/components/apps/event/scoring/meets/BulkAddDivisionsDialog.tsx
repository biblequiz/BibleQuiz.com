import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import ConfirmationDialog from "components/ConfirmationDialog";
import type { AuthManager } from "types/AuthManager";
import type { OnlineDatabaseSummary, OnlineDatabaseMeetSummary } from "types/services/AstroDatabasesService";
import { AstroMeetsService, type OnlineMeetSettings } from "types/services/AstroMeetsService";
import type { MatchRules } from "types/MatchRules";
import SeedFromDivisionsDialog from "./SeedFromDivisionsDialog";
import DivisionScheduleDialog from "./DivisionScheduleDialog";

interface Props {
    auth: AuthManager;
    eventId: string;
    eventType: string;
    databaseId: string;
    allMeets: OnlineDatabaseMeetSummary[];
    defaultRules: MatchRules;
    defaultMatchStartTime: string;
    isScoreKeepDatabase: boolean;
    onSave: (updatedDatabase: OnlineDatabaseSummary) => void;
    onClose: () => void;
}

/**
 * Dialog for bulk-creating team divisions from a seeding template:
 *  1. Export a seeding template based on selected source divisions (via SeedFromDivisionsDialog).
 *  2. Upload the filled-out template to receive an array of in-memory OnlineMeetSettings.
 *  3. List each parsed division with the ability to edit it via DivisionScheduleDialog
 *     (using the dialog's in-memory mode so no server round-trip is made per edit).
 *  4. Save all divisions in a single bulk request via AstroMeetsService.bulkCreateOrUpdateMeets.
 *
 * Escape closes this dialog only when no nested dialog is currently open; nested dialogs
 * stop propagation of their own Escape so the bulk dialog is unaffected.
 */
export default function BulkAddDivisionsDialog({
    auth,
    eventId,
    eventType,
    databaseId,
    allMeets,
    defaultRules,
    defaultMatchStartTime,
    isScoreKeepDatabase,
    onSave,
    onClose
}: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [parsedDivisions, setParsedDivisions] = useState<OnlineMeetSettings[]>([]);
    const [isDirty, setIsDirty] = useState(false);

    // Operation state
    const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Nested dialog state
    const [showSeedDialog, setShowSeedDialog] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);

    /**
     * Counts the teams (or quizzers, for individual competitions) included in a
     * parsed OnlineMeetSettings object so the list can show a brief summary.
     */
    const getTeamOrQuizzerCount = (settings: OnlineMeetSettings): number => {
        const schedule = settings.Schedule;
        if (!schedule) {
            return 0;
        }
        return settings.IsIndividualCompetition
            ? (schedule.QuizzerIds?.length ?? 0)
            : (schedule.TeamIds?.length ?? 0);
    };

    const hasParsedDivisions = parsedDivisions.length > 0;
    const isAnyNestedDialogOpen = showSeedDialog || editingIndex !== null || showCloseConfirmation;

    const handleClose = useCallback(() => {
        if (isDirty) {
            setShowCloseConfirmation(true);
        } else {
            onClose();
        }
    }, [isDirty, onClose]);

    // Escape key handler - only closes the bulk dialog when no nested dialog is open.
    // We also stopPropagation so this Escape doesn't bubble further up the DOM.
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                e.key === "Escape"
                && !isSaving
                && !isUploading
                && !isDownloadingTemplate
                && !isAnyNestedDialogOpen
            ) {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleClose, isSaving, isUploading, isDownloadingTemplate, isAnyNestedDialogOpen]);

    /**
     * Triggered when the user has selected a set of source divisions in the
     * SeedFromDivisionsDialog (in "selectIds" mode). Downloads the template file.
     */
    const handleSeedSelected = useCallback(async (sourceMeetIds: number[]) => {
        setShowSeedDialog(false);
        if (sourceMeetIds.length === 0) {
            return;
        }

        setError(null);
        setIsDownloadingTemplate(true);
        try {
            await AstroMeetsService.getBulkSeedTemplate(auth, eventId, databaseId, sourceMeetIds);
        } catch (err: any) {
            setError(err.message || "Failed to download the bulk seeding template.");
        } finally {
            setIsDownloadingTemplate(false);
        }
    }, [auth, eventId, databaseId]);

    /**
     * Handler invoked when a file is selected for upload. Parses the file and
     * replaces the in-memory list of divisions with the result.
     */
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        // Always reset the input so the same file can be re-uploaded after edits.
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        if (!file) {
            return;
        }

        setError(null);
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const result = await AstroMeetsService.parseBulkSeedTemplate(
                auth,
                eventId,
                databaseId,
                formData,
            );
            setParsedDivisions(result);
            setIsDirty(true);
        } catch (err: any) {
            setError(err.message || "Failed to parse the bulk seeding template.");
        } finally {
            setIsUploading(false);
        }
    };

    /**
     * Called when the nested DivisionScheduleDialog saves its in-memory edits. Updates
     * the corresponding entry in parsedDivisions and closes the nested dialog.
     */
    const handleDivisionEditSave = useCallback((updated: OnlineMeetSettings) => {
        if (editingIndex === null) {
            return;
        }
        setParsedDivisions(prev => {
            const next = [...prev];
            next[editingIndex] = updated;
            return next;
        });
        setIsDirty(true);
        setEditingIndex(null);
    }, [editingIndex]);

    const handleRemoveDivision = (index: number) => {
        setParsedDivisions(prev => prev.filter((_, i) => i !== index));
        setIsDirty(true);
    };

    /**
     * Saves all parsed divisions in a single bulk request, then closes the dialog.
     */
    const handleSave = async () => {
        if (parsedDivisions.length === 0) {
            setError("Upload a filled-out bulk seeding template before saving.");
            return;
        }

        setError(null);
        setIsSaving(true);
        try {
            const result = await AstroMeetsService.bulkCreateOrUpdateMeets(
                auth,
                eventId,
                databaseId,
                parsedDivisions,
            );
            onSave(result);
            dialogRef.current?.close();
        } catch (err: any) {
            setError(err.message || "Failed to save the divisions.");
            setIsSaving(false);
        }
    };

    const editingDivision = editingIndex !== null ? parsedDivisions[editingIndex] : null;

    const dialogContent = (
        <dialog ref={dialogRef} className="modal modal-open" open>
            <div className="modal-box w-full max-w-3xl max-h-[90vh]">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <FontAwesomeIcon icon="fas faFileImport" />
                    <span>Bulk Add Team Divisions</span>
                </h3>
                <button
                    type="button"
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    onClick={handleClose}
                    disabled={isSaving || isUploading || isDownloadingTemplate}
                >✕</button>

                {error && (
                    <div role="alert" className="alert alert-error mt-4">
                        <FontAwesomeIcon icon="fas faCircleExclamation" />
                        <div>
                            <span className="font-bold">Error: </span>
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                <div className="mt-4 overflow-y-auto max-h-[65vh]">
                    <div className="alert alert-info mb-4">
                        <FontAwesomeIcon icon="fas faCircleInfo" />
                        <div className="text-sm">
                            <p className="font-semibold">Bulk Create Team Divisions</p>
                            <p>
                                Export a seeding template based on one or more existing divisions,
                                fill it out with the new divisions you want to create, then upload
                                it here to create them all in a single step.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                        <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={() => setShowSeedDialog(true)}
                            disabled={isSaving || isUploading || isDownloadingTemplate}
                        >
                            {isDownloadingTemplate ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Downloading Template...
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon="fas faDownload" />
                                    Export Seeding Template
                                </>
                            )}
                        </button>

                        <label className={`btn btn-sm btn-outline ${isSaving || isUploading || isDownloadingTemplate ? "btn-disabled" : ""}`}>
                            {isUploading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon="fas faUpload" />
                                    Upload Seeding Template
                                </>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx"
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={isSaving || isUploading || isDownloadingTemplate}
                            />
                        </label>
                    </div>

                    <div>
                        <h4 className="font-semibold text-sm mb-2">
                            Divisions to Create
                            {hasParsedDivisions && (
                                <span className="badge badge-info badge-sm ml-2">
                                    {parsedDivisions.length}
                                </span>
                            )}
                        </h4>

                        {!hasParsedDivisions ? (
                            <div className="text-center py-8 text-base-content/60 border border-dashed border-base-300 rounded-lg">
                                <FontAwesomeIcon icon="fas faFileExcel" classNames={["text-3xl", "mb-2"]} />
                                <p className="text-sm">
                                    Upload a filled-out bulk seeding template to populate this list.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {parsedDivisions.map((division, index) => (
                                    <div
                                        key={`${index}-${division.Name}`}
                                        className="flex items-center justify-between gap-2 p-3 bg-base-200 rounded-lg"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{division.Name || "(Unnamed)"}</div>
                                            <div className="text-xs text-base-content/70 mt-1 flex flex-wrap gap-2">
                                                <span>
                                                    <FontAwesomeIcon icon={division.IsIndividualCompetition ? "fas faUser" : "fas faUsers"} classNames={["mr-1"]} />
                                                    {getTeamOrQuizzerCount(division)} {division.IsIndividualCompetition ? "quizzers" : "teams"}
                                                </span>
                                                <span>
                                                    <FontAwesomeIcon icon="fas faDoorOpen" classNames={["mr-1"]} />
                                                    {division.RoomNames?.length ?? 0} room{(division.RoomNames?.length ?? 0) === 1 ? "" : "s"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                type="button"
                                                className="btn btn-xs btn-primary"
                                                onClick={() => setEditingIndex(index)}
                                                disabled={isSaving || isUploading || isDownloadingTemplate}
                                            >
                                                <FontAwesomeIcon icon="fas faPencil" />
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-xs btn-error btn-outline"
                                                onClick={() => handleRemoveDivision(index)}
                                                disabled={isSaving || isUploading || isDownloadingTemplate}
                                            >
                                                <FontAwesomeIcon icon="fas faTrash" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-4 text-right gap-2 flex justify-end">
                    <button
                        type="button"
                        className="btn btn-sm btn-primary mt-0 mb-0"
                        onClick={handleSave}
                        disabled={isSaving || isUploading || isDownloadingTemplate || parsedDivisions.length === 0}
                    >
                        {isSaving ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon="fas faSave" />
                                Save All Divisions
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-secondary mt-0 mb-0"
                        onClick={handleClose}
                        disabled={isSaving || isUploading || isDownloadingTemplate}
                    >
                        Cancel
                    </button>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSaving || isUploading || isDownloadingTemplate}
                >close</button>
            </form>

            {/* Close confirmation when the user tries to close with unsaved changes */}
            {showCloseConfirmation && (
                <ConfirmationDialog
                    title="Unsaved Changes"
                    yesLabel="Discard Changes"
                    noLabel="Keep Editing"
                    onYes={() => {
                        setShowCloseConfirmation(false);
                        onClose();
                    }}
                    onNo={() => setShowCloseConfirmation(false)}
                    className="max-w-md"
                >
                    <p className="py-4">
                        You have unsaved bulk-import changes. Are you sure you want to close
                        without saving?
                    </p>
                </ConfirmationDialog>
            )}

            {/* Nested SeedFromDivisionsDialog used in selectIds mode to choose
                which source divisions feed into the seeding template. */}
            {showSeedDialog && (
                <SeedFromDivisionsDialog
                    auth={auth}
                    eventId={eventId}
                    databaseId={databaseId}
                    isIndividualCompetition={false}
                    mode="selectIds"
                    title="Select Source Divisions"
                    submitLabel="Download Template"
                    submitIcon="fas faDownload"
                    alertTitle="Export Bulk Seeding Template"
                    alertDescription="Select the divisions whose teams should be used to seed the new divisions. The order determines the priority when combining seedings across divisions."
                    onSeed={handleSeedSelected}
                    onClose={() => setShowSeedDialog(false)}
                />
            )}

            {/* Nested DivisionScheduleDialog used in in-memory mode to edit a
                single parsed division without any per-edit server round-trip. */}
            {editingDivision && (
                <DivisionScheduleDialog
                    auth={auth}
                    eventId={eventId}
                    eventType={eventType}
                    databaseId={databaseId}
                    meetId={0}
                    meetName={editingDivision.Name || "New Division"}
                    allMeets={allMeets}
                    defaultRules={defaultRules}
                    defaultMatchStartTime={defaultMatchStartTime}
                    isScoreKeepDatabase={isScoreKeepDatabase}
                    isNew={true}
                    isIndividualCompetition={editingDivision.IsIndividualCompetition}
                    initialSettings={editingDivision}
                    onSaveInMemory={handleDivisionEditSave}
                    // onSave is not used in in-memory mode but is required by the prop type.
                    onSave={() => { /* no-op in in-memory mode */ }}
                    onClose={() => setEditingIndex(null)}
                />
            )}
        </dialog>
    );

    return createPortal(dialogContent, document.body);
}