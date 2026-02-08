import type { ScoringDatabaseProviderContext } from "./ScoringDatabaseProvider";
import { useOutletContext } from "react-router-dom";
import ScoringDatabaseScoreKeepAlert from "./ScoringDatabaseScoreKeepAlert";
import { useState, useEffect, useCallback } from "react";
import { useStore } from "@nanostores/react";
import ScoringDatabaseTeamsAndQuizzerImportButtons from "./ScoringDatabaseTeamsAndQuizzerImportButtons";
import {
    AstroTeamsAndQuizzersService,
    type OnlineTeamsAndQuizzersImportManifest,
    type OnlineTeamsAndQuizzers,
    type OnlineTeamsAndQuizzersChanges
} from "types/services/AstroTeamsAndQuizzersService";
import ImportManifestDialog from "./ImportManifestDialog";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import { Team, Quizzer } from "types/Meets";
import { sharedDirtyWindowState } from "utils/SharedState";
import TeamsAndQuizzersTable from "./teamsAndQuizzers/TeamsAndQuizzersTable";
import TeamDialog from "./teamsAndQuizzers/TeamDialog";
import QuizzerDialog from "./teamsAndQuizzers/QuizzerDialog";
import StatsDialog, { type StatsType } from "./teamsAndQuizzers/StatsDialog";
import ConfirmationDialog from "components/ConfirmationDialog";

interface Props {
}

interface PendingChanges {
    addedOrUpdatedTeams: Map<number, Team>;
    addedTeamIds: Set<number>;
    removedTeamIds: Set<number>;
    addedOrUpdatedQuizzers: Map<number, Quizzer>;
    addedQuizzerIds: Set<number>;
    removedQuizzerIds: Set<number>;
}

export default function ScoringDatabaseTeamsAndQuizzersPage({ }: Props) {

    const {
        auth,
        eventId,
        eventRegionId,
        eventDistrictId,
        eventType,
        eventSeason,
        databaseId,
        currentDatabase
    } = useOutletContext<ScoringDatabaseProviderContext>();

    const isDirty = useStore(sharedDirtyWindowState);

    const [isPreparingManifest, setIsPreparingManifest] = useState(false);
    const [downloadedManifest, setDownloadedManifest] = useState<OnlineTeamsAndQuizzersImportManifest | null>(null);
    const [currentTeamsAndQuizzers, setCurrentTeamsAndQuizzers] = useState<OnlineTeamsAndQuizzers | null>(null);
    const [isLoadingTeamsAndQuizzers, setIsLoadingTeamsAndQuizzers] = useState(false);
    const [teamsAndQuizzersError, setTeamsAndQuizzersError] = useState<string | null>(null);

    // UI state
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Dialog state
    const [teamDialogOpen, setTeamDialogOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [quizzerDialogOpen, setQuizzerDialogOpen] = useState(false);
    const [editingQuizzer, setEditingQuizzer] = useState<Quizzer | null>(null);
    const [defaultTeamIdForQuizzer, setDefaultTeamIdForQuizzer] = useState<number | undefined>(undefined);
    const [statsDialogOpen, setStatsDialogOpen] = useState(false);
    const [statsDialogType, setStatsDialogType] = useState<StatsType>("team");
    const [statsDialogId, setStatsDialogId] = useState(0);
    const [statsDialogName, setStatsDialogName] = useState("");

    // Confirmation dialog state
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [confirmDialogTitle, setConfirmDialogTitle] = useState("");
    const [confirmDialogMessage, setConfirmDialogMessage] = useState("");
    const [confirmDialogAction, setConfirmDialogAction] = useState<(() => void) | null>(null);

    // Pending changes tracking
    const [pendingChanges, setPendingChanges] = useState<PendingChanges>({
        addedOrUpdatedTeams: new Map(),
        addedTeamIds: new Set(),
        removedTeamIds: new Set(),
        addedOrUpdatedQuizzers: new Map(),
        addedQuizzerIds: new Set(),
        removedQuizzerIds: new Set()
    });

    // Fetch current teams and quizzers when component mounts or when databaseId changes
    useEffect(() => {
        if (databaseId && !currentTeamsAndQuizzers && !isLoadingTeamsAndQuizzers) {
            setIsLoadingTeamsAndQuizzers(true);
            setTeamsAndQuizzersError(null);

            AstroTeamsAndQuizzersService.getTeamsAndQuizzers(auth, eventId, databaseId)
                .then(data => {
                    setCurrentTeamsAndQuizzers(data);
                    setIsLoadingTeamsAndQuizzers(false);
                })
                .catch(error => {
                    setTeamsAndQuizzersError(error.message || "Failed to load teams and quizzers.");
                    setIsLoadingTeamsAndQuizzers(false);
                });
        }
    }, [auth, eventId, databaseId, isLoadingTeamsAndQuizzers]);

    const handleImportComplete = (updated: OnlineTeamsAndQuizzers | null) => {
        setDownloadedManifest(null);
        if (updated) {
            // Refresh the teams and quizzers data after successful import
            setCurrentTeamsAndQuizzers(updated);
            // Reset pending changes since we have fresh data
            resetPendingChanges();
        }
    };

    const resetPendingChanges = () => {
        setPendingChanges({
            addedOrUpdatedTeams: new Map(),
            addedTeamIds: new Set(),
            removedTeamIds: new Set(),
            addedOrUpdatedQuizzers: new Map(),
            addedQuizzerIds: new Set(),
            removedQuizzerIds: new Set()
        });
        sharedDirtyWindowState.set(false);
    };

    const markDirty = () => {
        sharedDirtyWindowState.set(true);
    };

    // Check if a quizzer can be dragged (not in a meet with scores)
    const canDragQuizzer = useCallback((quizzer: Quizzer): boolean => {
        if (!currentTeamsAndQuizzers) return true;

        const quizzerManifest = currentTeamsAndQuizzers.Quizzers[quizzer.Id];
        if (!quizzerManifest) return true;

        const meetIds = Object.keys(quizzerManifest.MeetTeamIds || {}).map(Number);
        const meetsWithScores = currentTeamsAndQuizzers.MeetIdsWithScores || [];

        return !meetIds.some(id => meetsWithScores.includes(id));
    }, [currentTeamsAndQuizzers]);

    // Get merged teams (original + pending changes)
    const getMergedTeams = useCallback(() => {
        if (!currentTeamsAndQuizzers) return {};

        const merged = { ...currentTeamsAndQuizzers.Teams };

        // Apply pending changes
        pendingChanges.addedOrUpdatedTeams.forEach((team, id) => {
            merged[id] = { Team: team, MeetIds: merged[id]?.MeetIds || [] };
        });

        pendingChanges.removedTeamIds.forEach(id => {
            delete merged[id];
        });

        return merged;
    }, [currentTeamsAndQuizzers, pendingChanges]);

    // Get merged quizzers (original + pending changes)
    const getMergedQuizzers = useCallback(() => {
        if (!currentTeamsAndQuizzers) return {};

        const merged = { ...currentTeamsAndQuizzers.Quizzers };

        // Apply pending changes
        pendingChanges.addedOrUpdatedQuizzers.forEach((quizzer, id) => {
            merged[id] = { Quizzer: quizzer, MeetTeamIds: merged[id]?.MeetTeamIds || {} };
        });

        pendingChanges.removedQuizzerIds.forEach(id => {
            delete merged[id];
        });

        return merged;
    }, [currentTeamsAndQuizzers, pendingChanges]);

    // Team handlers
    const handleAddTeam = () => {
        setEditingTeam(null);
        setTeamDialogOpen(true);
    };

    const handleEditTeam = (team: Team) => {
        setEditingTeam(team);
        setTeamDialogOpen(true);
    };

    const handleSaveTeam = (team: Team) => {
        const isNew = !editingTeam || pendingChanges.addedTeamIds.has(team.Id);

        if (isNew && team.Id === 0) {
            // Assign new ID
            team.Id = currentTeamsAndQuizzers?.NextTeamId || Date.now();
            if (currentTeamsAndQuizzers) {
                currentTeamsAndQuizzers.NextTeamId = team.Id + 1;
            }
        }

        setPendingChanges(prev => {
            const updated = { ...prev };
            updated.addedOrUpdatedTeams = new Map(prev.addedOrUpdatedTeams);
            updated.addedOrUpdatedTeams.set(team.Id, team);

            if (isNew) {
                updated.addedTeamIds = new Set(prev.addedTeamIds);
                updated.addedTeamIds.add(team.Id);
            }

            return updated;
        });

        markDirty();
        setTeamDialogOpen(false);
        setEditingTeam(null);
    };

    const handleDeleteTeam = (team: Team) => {
        setConfirmDialogTitle("Delete Team");
        setConfirmDialogMessage(`Are you sure you want to delete "${team.Name}"? This will also remove all quizzers from this team.`);
        setConfirmDialogAction(() => () => {
            setPendingChanges(prev => {
                const updated = { ...prev };

                // If this was a newly added team, just remove it from added
                if (prev.addedTeamIds.has(team.Id)) {
                    updated.addedTeamIds = new Set(prev.addedTeamIds);
                    updated.addedTeamIds.delete(team.Id);
                    updated.addedOrUpdatedTeams = new Map(prev.addedOrUpdatedTeams);
                    updated.addedOrUpdatedTeams.delete(team.Id);
                } else {
                    updated.removedTeamIds = new Set(prev.removedTeamIds);
                    updated.removedTeamIds.add(team.Id);
                }

                return updated;
            });

            markDirty();
            setConfirmDialogOpen(false);
        });
        setConfirmDialogOpen(true);
    };

    const handleShowTeamStats = (team: Team) => {
        setStatsDialogType("team");
        setStatsDialogId(team.Id);
        setStatsDialogName(team.Name);
        setStatsDialogOpen(true);
    };

    // Quizzer handlers
    const handleAddQuizzer = (teamId: number) => {
        setEditingQuizzer(null);
        setDefaultTeamIdForQuizzer(teamId);
        setQuizzerDialogOpen(true);
    };

    const handleEditQuizzer = (quizzer: Quizzer) => {
        setEditingQuizzer(quizzer);
        setDefaultTeamIdForQuizzer(quizzer.TeamId);
        setQuizzerDialogOpen(true);
    };

    const handleSaveQuizzer = (quizzer: Quizzer) => {
        const isNew = !editingQuizzer || pendingChanges.addedQuizzerIds.has(quizzer.Id);

        if (isNew && quizzer.Id === 0) {
            // Assign new ID
            quizzer.Id = currentTeamsAndQuizzers?.NextQuizzerId || Date.now();
            if (currentTeamsAndQuizzers) {
                currentTeamsAndQuizzers.NextQuizzerId = quizzer.Id + 1;
            }
        }

        setPendingChanges(prev => {
            const updated = { ...prev };
            updated.addedOrUpdatedQuizzers = new Map(prev.addedOrUpdatedQuizzers);
            updated.addedOrUpdatedQuizzers.set(quizzer.Id, quizzer);

            if (isNew) {
                updated.addedQuizzerIds = new Set(prev.addedQuizzerIds);
                updated.addedQuizzerIds.add(quizzer.Id);
            }

            return updated;
        });

        markDirty();
        setQuizzerDialogOpen(false);
        setEditingQuizzer(null);
    };

    const handleDeleteQuizzer = (quizzer: Quizzer) => {
        setConfirmDialogTitle("Delete Quizzer");
        setConfirmDialogMessage(`Are you sure you want to delete "${quizzer.Name}"?`);
        setConfirmDialogAction(() => () => {
            setPendingChanges(prev => {
                const updated = { ...prev };

                // If this was a newly added quizzer, just remove it from added
                if (prev.addedQuizzerIds.has(quizzer.Id)) {
                    updated.addedQuizzerIds = new Set(prev.addedQuizzerIds);
                    updated.addedQuizzerIds.delete(quizzer.Id);
                    updated.addedOrUpdatedQuizzers = new Map(prev.addedOrUpdatedQuizzers);
                    updated.addedOrUpdatedQuizzers.delete(quizzer.Id);
                } else {
                    updated.removedQuizzerIds = new Set(prev.removedQuizzerIds);
                    updated.removedQuizzerIds.add(quizzer.Id);
                }

                return updated;
            });

            markDirty();
            setConfirmDialogOpen(false);
        });
        setConfirmDialogOpen(true);
    };

    const handleShowQuizzerStats = (quizzer: Quizzer) => {
        setStatsDialogType("quizzer");
        setStatsDialogId(quizzer.Id);
        setStatsDialogName(quizzer.Name);
        setStatsDialogOpen(true);
    };

    const handleMoveQuizzer = (quizzerId: number, _fromTeamId: number | undefined, toTeamId: number) => {
        const quizzer = getMergedQuizzers()[quizzerId]?.Quizzer;
        if (!quizzer) return;

        const updatedQuizzer = { ...quizzer, TeamId: toTeamId };

        setPendingChanges(prev => {
            const updated = { ...prev };
            updated.addedOrUpdatedQuizzers = new Map(prev.addedOrUpdatedQuizzers);
            updated.addedOrUpdatedQuizzers.set(quizzerId, updatedQuizzer);
            return updated;
        });

        markDirty();
    };

    // Save all changes
    const handleSave = async () => {
        if (!currentTeamsAndQuizzers || !databaseId) return;

        setIsSaving(true);
        setIsSaved(false);
        setSaveError(null);

        try {
            const changes: OnlineTeamsAndQuizzersChanges = {
                AddedOrUpdatedTeams: Object.fromEntries(pendingChanges.addedOrUpdatedTeams),
                AddedTeamIds: Array.from(pendingChanges.addedTeamIds),
                RemovedTeamIds: Array.from(pendingChanges.removedTeamIds),
                AddedOrUpdatedQuizzers: Object.fromEntries(pendingChanges.addedOrUpdatedQuizzers),
                AddedQuizzerIds: Array.from(pendingChanges.addedQuizzerIds),
                RemovedQuizzerIds: Array.from(pendingChanges.removedQuizzerIds),
                VersionId: currentTeamsAndQuizzers.VersionId
            };

            const updated = await AstroTeamsAndQuizzersService.updateTeamsAndQuizzers(
                auth,
                eventId,
                databaseId,
                changes
            );

            setCurrentTeamsAndQuizzers(updated);
            setIsSaved(true);
            resetPendingChanges();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to save changes.";
            setSaveError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    // Get list of teams for quizzer dialog dropdown
    const getTeamsList = useCallback((): Team[] => {
        const mergedTeams = getMergedTeams();
        return Object.values(mergedTeams)
            .map(t => t.Team)
            .sort((a, b) => a.Name.localeCompare(b.Name));
    }, [getMergedTeams]);

    if (isLoadingTeamsAndQuizzers || !currentTeamsAndQuizzers) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <span className="loading loading-spinner loading-lg"></span>
                            <span className="ml-4">Loading Teams and Quizzers ...</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            The teams and quizzers data is being downloaded and prepared. This should just take a second or two ...
                        </p>
                    </div>
                </div>
            </div>);
    }

    return (
        <div className="space-y-6">
            <ScoringDatabaseScoreKeepAlert isScoreKeep={currentDatabase?.Settings.IsScoreKeep} />
            <ScoringDatabaseTeamsAndQuizzerImportButtons
                auth={auth}
                season={eventSeason}
                eventId={eventId}
                eventRegionId={eventRegionId}
                eventDistrictId={eventDistrictId}
                eventType={eventType}
                databaseId={databaseId!}
                setDownloadedManifest={m => {
                    setDownloadedManifest(m);
                    setIsPreparingManifest(true);
                }}
            />
            {isLoadingTeamsAndQuizzers && (
                <div className="flex items-center justify-center gap-2 mt-4">
                    <span className="loading loading-spinner loading-md"></span>
                    <span>Loading current teams and quizzers ...</span>
                </div>
            )}
            {isPreparingManifest && (
                <div className="flex items-center justify-center gap-2 mt-4">
                    <span className="loading loading-spinner loading-md"></span>
                    <span>Preparing teams and quizzers for import ...</span>
                </div>)}
            {teamsAndQuizzersError && (
                <div role="alert" className="alert alert-error mt-0 w-full">
                    <FontAwesomeIcon icon="fas faCircleExclamation" />
                    <div>
                        <b>Error: </b> {teamsAndQuizzersError}
                    </div>
                </div>
            )}
            {downloadedManifest && (
                <ImportManifestDialog
                    manifest={downloadedManifest}
                    currentTeamsAndQuizzers={currentTeamsAndQuizzers}
                    auth={auth}
                    eventId={eventId}
                    databaseId={databaseId!}
                    setIsPreparing={setIsPreparingManifest}
                    onComplete={updated => {
                        setIsPreparingManifest(false);
                        handleImportComplete(updated);
                    }}
                />
            )}

            <div className="divider mt-0" />

            {saveError && (
                <div role="alert" className="alert alert-error mt-0 w-full">
                    <FontAwesomeIcon icon="fas faCircleExclamation" />
                    <div>
                        <b>Save Error: </b> {saveError}
                    </div>
                </div>
            )}
            {isSaved && (
                <div className="alert alert-success rounded-2xl mb-0">
                    <div className="w-full">
                        <FontAwesomeIcon icon="fas faCircleCheck" />
                        <span className="pl-2">
                            Successfully saved changes to the teams and quizzers.
                        </span>
                    </div>
                </div>)}

            {/* Teams and Quizzers Table */}
            <TeamsAndQuizzersTable
                teams={getMergedTeams()}
                quizzers={getMergedQuizzers()}
                isSaving={isSaving}
                isReadOnly={currentDatabase!.Settings.IsScoreKeep}
                hasChanges={isDirty}
                canDragQuizzer={canDragQuizzer}
                onAddTeam={handleAddTeam}
                onEditTeam={handleEditTeam}
                onDeleteTeam={handleDeleteTeam}
                onShowTeamStats={handleShowTeamStats}
                onAddQuizzer={handleAddQuizzer}
                onEditQuizzer={handleEditQuizzer}
                onDeleteQuizzer={handleDeleteQuizzer}
                onShowQuizzerStats={handleShowQuizzerStats}
                onMoveQuizzer={handleMoveQuizzer}
                onSaveChanges={handleSave}
            />

            {/* Dialogs */}
            <TeamDialog
                team={editingTeam}
                isOpen={teamDialogOpen}
                isReadOnly={currentDatabase!.Settings.IsScoreKeep}
                onSave={handleSaveTeam}
                onCancel={() => {
                    setTeamDialogOpen(false);
                    setEditingTeam(null);
                }}
            />

            <QuizzerDialog
                quizzer={editingQuizzer}
                teams={getTeamsList()}
                defaultTeamId={defaultTeamIdForQuizzer}
                isOpen={quizzerDialogOpen}
                isReadOnly={currentDatabase!.Settings.IsScoreKeep}
                onSave={handleSaveQuizzer}
                onCancel={() => {
                    setQuizzerDialogOpen(false);
                    setEditingQuizzer(null);
                }}
            />

            <StatsDialog
                type={statsDialogType}
                id={statsDialogId}
                name={statsDialogName}
                isOpen={statsDialogOpen}
                onClose={() => setStatsDialogOpen(false)}
            />

            {confirmDialogOpen && (
                <ConfirmationDialog
                    title={confirmDialogTitle}
                    yesLabel="Delete"
                    onYes={() => confirmDialogAction?.()}
                    noLabel="Cancel"
                    onNo={() => setConfirmDialogOpen(false)}
                >
                    <p className="py-4">{confirmDialogMessage}</p>
                </ConfirmationDialog>
            )}
        </div>);
}