import { useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { useStore } from "@nanostores/react";
import type { ScoringDatabaseProviderContext } from "./ScoringDatabaseProvider";
import type { OnlineDatabaseMeetDisplaySettings, OnlineDatabaseMeetSummary, OnlineDatabaseSummary } from "types/services/AstroDatabasesService";
import { AstroDatabasesService } from "types/services/AstroDatabasesService";
import { AstroMeetsService } from "types/services/AstroMeetsService";
import { sharedDirtyWindowState } from "utils/SharedState";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import ScoringDatabaseScoreKeepAlert from "./ScoringDatabaseScoreKeepAlert";
import DivisionCard from "./meets/DivisionCard";
import DivisionScheduleDialog from "./meets/DivisionScheduleDialog";
import DivisionPlayoffsDialog from "./meets/DivisionPlayoffsDialog";
import DivisionRankingDialog from "./meets/DivisionRankingDialog";
import ConfirmationDialog from "components/ConfirmationDialog";

interface PendingDisplayChanges {
    [meetId: number]: Partial<OnlineDatabaseMeetDisplaySettings>;
}

interface EditingMeet {
    meetId: number;
    meetName: string;
    type: "schedule" | "playoffs" | "ranking";
}

interface ConfirmDialogProps {
    title: string;
    message: string;
    action?: () => void;
    alertOnly?: boolean;
}

export default function ScoringDatabaseMeetsPage() {
    const {
        auth,
        eventId,
        eventType,
        databaseId,
        currentDatabase,
        setCurrentDatabase
    } = useOutletContext<ScoringDatabaseProviderContext>();

    const isDirty = useStore(sharedDirtyWindowState);

    // State
    const [meetOrder, setMeetOrder] = useState<number[]>(() =>
        currentDatabase?.Meets.map(m => m.Display.Id) || []
    );
    const [pendingDisplayChanges, setPendingDisplayChanges] = useState<PendingDisplayChanges>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Dialog state
    const [editingMeet, setEditingMeet] = useState<EditingMeet | null>(null);
    const [isAddingNewDivision, setIsAddingNewDivision] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogProps | undefined>();

    // Drag state
    const [draggedMeetId, setDraggedMeetId] = useState<number | null>(null);
    const [dragOverMeetId, setDragOverMeetId] = useState<number | null>(null);

    const isReadOnly = currentDatabase?.IsScoreKeep || false;

    // Get meets in current order
    const getOrderedMeets = useCallback(() => {
        if (!currentDatabase) return [];

        const meetsById = new Map(currentDatabase.Meets.map(m => [m.Display.Id, m]));
        return meetOrder
            .map(id => meetsById.get(id))
            .filter((m): m is NonNullable<typeof m> => m !== undefined);
    }, [currentDatabase, meetOrder]);

    // Get display settings with pending changes applied
    const getDisplaySettings = useCallback((meet: OnlineDatabaseMeetSummary): OnlineDatabaseMeetDisplaySettings | null => {
        const pending = pendingDisplayChanges[meet.Display.Id];
        if (!pending) return meet.Display;

        return {
            ...meet.Display,
            ...pending
        } as OnlineDatabaseMeetDisplaySettings;
    }, [currentDatabase, pendingDisplayChanges]);

    // Mark as dirty
    const markDirty = useCallback(() => {
        sharedDirtyWindowState.set(true);
        setIsSaved(false);
    }, []);

    // Handle display setting change
    const handleDisplaySettingsChange = useCallback((
        meetId: number,
        field: keyof OnlineDatabaseMeetDisplaySettings,
        value: boolean
    ) => {
        setPendingDisplayChanges(prev => {
            const currentMeet = currentDatabase?.Meets.find(m => m.Display.Id === meetId);
            if (!currentMeet) {
                return prev;
            }

            const meetsToUpdate: OnlineDatabaseMeetSummary[] = [currentMeet];
            if (currentMeet.LinkedMeetGroupId) {
                for (const meet of currentDatabase!.Meets) {
                    if (meet.Display.Id !== meetId && meet.LinkedMeetGroupId === currentMeet.LinkedMeetGroupId) {
                        meetsToUpdate.push(meet);
                    }
                }
            }

            const newChanges: PendingDisplayChanges = { ...prev };
            for (const meet of meetsToUpdate) {
                newChanges[meet.Display.Id] = {
                    ...newChanges[meet.Display.Id],
                    [field]: value
                };
            }
            return newChanges;
        });
        markDirty();
    }, [markDirty]);

    // Drag handlers
    const handleDragStart = useCallback((e: React.DragEvent, meetId: number) => {
        setDraggedMeetId(meetId);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", meetId.toString());
    }, []);

    const handleDragEnd = useCallback(() => {
        setDraggedMeetId(null);
        setDragOverMeetId(null);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    }, []);

    const handleDragLeave = useCallback(() => {
        setDragOverMeetId(null);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, targetMeetId: number) => {
        e.preventDefault();

        if (draggedMeetId === null || draggedMeetId === targetMeetId) {
            setDraggedMeetId(null);
            setDragOverMeetId(null);
            return;
        }

        const newOrder = [...meetOrder];
        const draggedIndex = newOrder.indexOf(draggedMeetId);
        const targetIndex = newOrder.indexOf(targetMeetId);

        if (draggedIndex !== -1 && targetIndex !== -1) {
            newOrder.splice(draggedIndex, 1);
            newOrder.splice(targetIndex, 0, draggedMeetId);
            setMeetOrder(newOrder);
            markDirty();
        }

        setDraggedMeetId(null);
        setDragOverMeetId(null);
    }, [draggedMeetId, meetOrder, markDirty]);

    const handleDragOverCard = useCallback((e: React.DragEvent, meetId: number) => {
        handleDragOver(e);
        setDragOverMeetId(meetId);
    }, [handleDragOver]);

    // Edit handlers
    const handleEditSchedule = useCallback((meetId: number) => {
        const meet = currentDatabase?.Meets.find(m => m.Display.Id === meetId);
        if (meet) {
            setEditingMeet({
                meetId,
                meetName: meet.Display.NameOverride || meet.Display.Name,
                type: "schedule"
            });
        }
    }, [currentDatabase]);

    const handleEditPlayoffs = useCallback((meetId: number) => {
        const meet = currentDatabase?.Meets.find(m => m.Display.Id === meetId);
        if (meet) {
            setEditingMeet({
                meetId,
                meetName: meet.Display.NameOverride || meet.Display.Name,
                type: "playoffs"
            });
        }
    }, [currentDatabase]);

    const handleEditRanking = useCallback((meetId: number) => {
        const meet = currentDatabase?.Meets.find(m => m.Display.Id === meetId);
        if (meet) {
            setEditingMeet({
                meetId,
                meetName: meet.Display.NameOverride || meet.Display.Name,
                type: "ranking"
            });
        }
    }, [currentDatabase]);

    // Add new division
    const handleAddDivision = useCallback(() => {
        setIsAddingNewDivision(true);
    }, []);

    // Delete division
    const handleDeleteDivision = useCallback((meetId: number) => {
        const meet = currentDatabase?.Meets.find(m => m.Display.Id === meetId);
        if (!meet) return;

        const meetName = meet.Display.NameOverride || meet.Display.Name;

        setConfirmDialog({
            title: "Delete Division",
            message: `Are you sure you want to delete "${meetName}"? This action cannot be undone and will remove all matches and scores for this division.`,
            action: async () => {
                setConfirmDialog(undefined);
                setIsSaving(true);
                setSaveError(null);

                try {
                    await AstroMeetsService.deleteMeet(auth, eventId, databaseId!, meetId);

                    // Refresh the database
                    const updatedDatabase = await AstroDatabasesService.getDatabase(auth, eventId, databaseId!);
                    setCurrentDatabase(updatedDatabase);

                    // Update meet order
                    setMeetOrder(updatedDatabase.Meets.map(m => m.Display.Id));

                    // Remove from pending changes
                    setPendingDisplayChanges(prev => {
                        const updated = { ...prev };
                        delete updated[meetId];
                        return updated;
                    });

                    setIsSaved(true);
                } catch (err: any) {
                    setSaveError(err.message || "Failed to delete division.");
                } finally {
                    setIsSaving(false);
                }
            }
        });
    }, [auth, eventId, databaseId, currentDatabase, setCurrentDatabase]);

    // Save all changes
    const handleSaveChanges = useCallback(async () => {
        if (!currentDatabase || !databaseId) return;

        setIsSaving(true);
        setIsSaved(false);
        setSaveError(null);

        try {
            // Build ordered array of all display settings with pending changes applied
            const orderedSettings: OnlineDatabaseMeetDisplaySettings[] = meetOrder
                .map(meetId => {
                    const meet = currentDatabase.Meets.find(m => m.Display.Id === meetId);
                    if (!meet) return null;

                    const pending = pendingDisplayChanges[meetId];
                    return pending
                        ? { ...meet.Display, ...pending } as OnlineDatabaseMeetDisplaySettings
                        : meet.Display;
                })
                .filter((s): s is OnlineDatabaseMeetDisplaySettings => s !== null);

            // Send all settings in the correct order with a single API call
            const result = await AstroDatabasesService.updateMeetDisplaySettings(
                auth,
                eventId,
                databaseId,
                orderedSettings);

            setCurrentDatabase(result);

            // Clear pending changes
            setPendingDisplayChanges({});
            sharedDirtyWindowState.set(false);
            setIsSaved(true);
        } catch (err: any) {
            setSaveError(err.message || "Failed to save changes.");
        } finally {
            setIsSaving(false);
        }
    }, [auth, eventId, databaseId, currentDatabase, meetOrder, pendingDisplayChanges, setCurrentDatabase]);

    // Dialog save handler
    const handleDialogSave = useCallback((updatedDatabase: OnlineDatabaseSummary) => {
        setCurrentDatabase(updatedDatabase);
        setMeetOrder(updatedDatabase.Meets.map(m => m.Display.Id));
        setEditingMeet(null);
        setIsAddingNewDivision(false);
    }, [setCurrentDatabase]);

    // Close dialog
    const handleDialogClose = useCallback(() => {
        setEditingMeet(null);
        setIsAddingNewDivision(false);
    }, []);

    if (!currentDatabase) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <span className="loading loading-spinner loading-lg"></span>
                            <span className="ml-4">Loading...</span>
                        </h1>
                    </div>
                </div>
            </div>
        );
    }

    const orderedMeets = getOrderedMeets();

    return (
        <div className="space-y-6">
            <ScoringDatabaseScoreKeepAlert isScoreKeep={isReadOnly} />

            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h3 className="text-lg font-semibold">Divisions</h3>
                <div className="flex flex-wrap gap-2">
                    {!isReadOnly && (
                        <>
                            <button
                                type="button"
                                className="btn btn-success btn-sm"
                                onClick={handleSaveChanges}
                                disabled={!isDirty || isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon="fas faSave" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={handleAddDivision}
                                disabled={isSaving}
                            >
                                <FontAwesomeIcon icon="fas faPlus" />
                                Add Division
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Error/Success Messages */}
            {saveError && (
                <div role="alert" className="alert alert-error">
                    <FontAwesomeIcon icon="fas faTriangleExclamation" />
                    <div>
                        <b>Error: </b>{saveError}
                    </div>
                </div>
            )}

            {isSaved && (
                <div className="alert alert-success rounded-2xl">
                    <FontAwesomeIcon icon="fas faCircleCheck" />
                    <span>Successfully saved changes.</span>
                </div>
            )}

            {/* Division Cards */}
            {orderedMeets.length === 0 ? (
                <div className="text-center py-12 text-base-content/60">
                    <FontAwesomeIcon icon="fas faLayerGroup" classNames={["text-4xl", "mb-4"]} />
                    <p className="text-lg mb-4">No divisions have been created yet.</p>
                    {!isReadOnly && (
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleAddDivision}
                        >
                            <FontAwesomeIcon icon="fas faPlus" />
                            Add Your First Division
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orderedMeets.map(meet => {
                        const displaySettings = getDisplaySettings(meet);
                        if (!displaySettings) return null;

                        return (
                            <DivisionCard
                                key={meet.Display.Id}
                                meetId={meet.Display.Id}
                                displaySettings={displaySettings}
                                hasAnyMissingQuestions={meet.HasAnyMissingQuestions}
                                isReadOnly={isReadOnly}
                                disabled={isSaving}
                                isDragOver={dragOverMeetId === meet.Display.Id}
                                onDisplaySettingsChange={handleDisplaySettingsChange}
                                onEditSchedule={handleEditSchedule}
                                onEditPlayoffs={handleEditPlayoffs}
                                onEditRanking={handleEditRanking}
                                onDelete={handleDeleteDivision}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => handleDragOverCard(e, meet.Display.Id)}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            />
                        );
                    })}
                </div>
            )}

            {/* Dialogs */}
            {editingMeet?.type === "schedule" && (
                <DivisionScheduleDialog
                    auth={auth}
                    eventId={eventId}
                    eventType={eventType}
                    databaseId={databaseId!}
                    meetId={editingMeet.meetId}
                    meetName={editingMeet.meetName}
                    defaultRules={currentDatabase.DefaultRules}
                    allMeets={currentDatabase.Meets}
                    isReadOnly={isReadOnly}
                    isNew={false}
                    onSave={handleDialogSave}
                    onClose={handleDialogClose}
                />
            )}

            {editingMeet?.type === "playoffs" && (
                <DivisionPlayoffsDialog
                    auth={auth}
                    eventId={eventId}
                    databaseId={databaseId!}
                    meetId={editingMeet.meetId}
                    meetName={editingMeet.meetName}
                    isReadOnly={isReadOnly}
                    onSave={handleDialogSave}
                    onClose={handleDialogClose}
                />
            )}

            {editingMeet?.type === "ranking" && (
                <DivisionRankingDialog
                    meetId={editingMeet.meetId}
                    meetName={editingMeet.meetName}
                    onClose={handleDialogClose}
                />
            )}

            {isAddingNewDivision && (
                <DivisionScheduleDialog
                    auth={auth}
                    eventId={eventId}
                    eventType={eventType}
                    databaseId={databaseId!}
                    meetId={0}
                    meetName="New Division"
                    allMeets={currentDatabase.Meets}
                    defaultRules={currentDatabase.DefaultRules}
                    isReadOnly={false}
                    isNew={true}
                    onSave={handleDialogSave}
                    onClose={handleDialogClose}
                />
            )}

            {confirmDialog && (
                <ConfirmationDialog
                    title={confirmDialog.title}
                    yesLabel={confirmDialog.alertOnly ? "Close" : "Delete"}
                    onYes={() => confirmDialog.action?.()}
                    noLabel={confirmDialog.alertOnly ? undefined : "Cancel"}
                    onNo={confirmDialog.alertOnly ? undefined : () => setConfirmDialog(undefined)}
                >
                    <p className="py-4">{confirmDialog.message}</p>
                </ConfirmationDialog>
            )}
        </div>
    );
}