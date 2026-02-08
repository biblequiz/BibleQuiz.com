import { useRef, useState, useMemo, useEffect } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { AuthManager } from "types/AuthManager";
import {
    AstroTeamsAndQuizzersService,
    type OnlineTeamsAndQuizzersImportManifest,
    type OnlineTeamsAndQuizzers,
    type OnlineTeamsAndQuizzersChanges
} from "types/services/AstroTeamsAndQuizzersService";
import type { Team, Quizzer } from "types/Meets";

interface Props {
    manifest: OnlineTeamsAndQuizzersImportManifest;
    currentTeamsAndQuizzers: OnlineTeamsAndQuizzers | null;
    auth: AuthManager;
    eventId: string;
    databaseId: string;
    setIsPreparing: (isPreparing: boolean) => void;
    onComplete: (updatedManifest: OnlineTeamsAndQuizzers | null) => void;
}

interface TypeStats {
    total: number;
    new: number;
    existing: number;
    unchanged: number;
}

interface ChangeDescription {
    type: "team" | "quizzer";
    action: "add" | "update" | "unchanged";
    description: string;
}

enum ImportMode {
    Reuse,
    CreateNew
}

/**
 * Checks if a team from the manifest has changes compared to an existing team.
 */
function isTeamChanged(manifestTeam: Team, existingTeam: Team): boolean {
    return manifestTeam.Name !== existingTeam.Name ||
        manifestTeam.Church !== existingTeam.Church ||
        manifestTeam.City !== existingTeam.City ||
        manifestTeam.State !== existingTeam.State ||
        manifestTeam.League !== existingTeam.League ||
        manifestTeam.FullChurchName !== existingTeam.FullChurchName;
}

/**
 * Checks if a quizzer from the manifest has changes compared to an existing quizzer.
 */
function isQuizzerChanged(manifestQuizzer: Quizzer, existingQuizzer: Quizzer): boolean {
    return manifestQuizzer.Name !== existingQuizzer.Name ||
        manifestQuizzer.TeamId !== existingQuizzer.TeamId ||
        manifestQuizzer.Grade !== existingQuizzer.Grade ||
        manifestQuizzer.DateOfBirth !== existingQuizzer.DateOfBirth ||
        manifestQuizzer.YearsQuizzing !== existingQuizzer.YearsQuizzing;
}

export default function ImportManifestDialog({
    manifest,
    currentTeamsAndQuizzers,
    auth,
    eventId,
    databaseId,
    setIsPreparing,
    onComplete
}: Props) {

    const dialogRef = useRef<HTMLDialogElement>(null);
    const [importMode, setImportMode] = useState<ImportMode>(ImportMode.Reuse);
    const [isImporting, setIsImporting] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);

    // Calculate stats and changes based on manifest comparison
    const { teamStats, quizzerStats, changes } = useMemo(() => {
        const teamStats: TypeStats = { total: 0, new: 0, existing: 0, unchanged: 0 };
        const quizzerStats: TypeStats = { total: 0, new: 0, existing: 0, unchanged: 0 };
        const changes: ChangeDescription[] = [];

        const existingTeams = currentTeamsAndQuizzers?.Teams ?? {};
        const existingQuizzers = currentTeamsAndQuizzers?.Quizzers ?? {};

        // Build lookup maps for existing items by remote ID
        const existingTeamsByRemoteId = new Map<string, { id: number; team: Team }>();
        const existingQuizzersByRemoteId = new Map<string, { id: number; quizzer: Quizzer }>();

        for (const [idStr, teamWrapper] of Object.entries(existingTeams)) {
            const team = teamWrapper.Team;
            if (team.RemoteTeamId) {
                existingTeamsByRemoteId.set(team.RemoteTeamId, { id: parseInt(idStr), team });
            }
            if (team.RemotePersistentId) {
                existingTeamsByRemoteId.set(team.RemotePersistentId, { id: parseInt(idStr), team });
            }
        }

        for (const [idStr, quizzerWrapper] of Object.entries(existingQuizzers)) {
            const quizzer = quizzerWrapper.Quizzer;
            if (quizzer.RemotePersonId) {
                existingQuizzersByRemoteId.set(quizzer.RemotePersonId, { id: parseInt(idStr), quizzer });
            }
        }

        // Process teams from manifest
        for (const [, team] of Object.entries(manifest.Teams)) {
            teamStats.total++;

            const existingMatch = team.RemoteTeamId
                ? existingTeamsByRemoteId.get(team.RemoteTeamId)
                : team.RemotePersistentId
                    ? existingTeamsByRemoteId.get(team.RemotePersistentId)
                    : undefined;

            if (existingMatch) {
                const hasChanges = isTeamChanged(team, existingMatch.team);
                if (hasChanges) {
                    teamStats.existing++;
                    changes.push({
                        type: "team",
                        action: "update",
                        description: `Update Team: ${team.Name}`
                    });
                } else {
                    teamStats.unchanged++;
                    changes.push({
                        type: "team",
                        action: "unchanged",
                        description: `Unchanged Team: ${team.Name}`
                    });
                }
            } else {
                teamStats.new++;
                changes.push({
                    type: "team",
                    action: "add",
                    description: `Add Team: ${team.Name}`
                });
            }
        }

        // Process quizzers from manifest
        for (const [, quizzer] of Object.entries(manifest.Quizzers)) {
            quizzerStats.total++;

            const existingMatch = quizzer.RemotePersonId
                ? existingQuizzersByRemoteId.get(quizzer.RemotePersonId)
                : undefined;

            if (existingMatch) {
                const hasChanges = isQuizzerChanged(quizzer, existingMatch.quizzer);
                if (hasChanges) {
                    quizzerStats.existing++;
                    const teamName = quizzer.TeamId ? manifest.Teams[quizzer.TeamId]?.Name : undefined;
                    changes.push({
                        type: "quizzer",
                        action: "update",
                        description: teamName
                            ? `Update Quizzer: ${quizzer.Name} → Team: ${teamName}`
                            : `Update Quizzer: ${quizzer.Name}`
                    });
                } else {
                    quizzerStats.unchanged++;
                    changes.push({
                        type: "quizzer",
                        action: "unchanged",
                        description: `Unchanged Quizzer: ${quizzer.Name}`
                    });
                }
            } else {
                quizzerStats.new++;
                const teamName = quizzer.TeamId ? manifest.Teams[quizzer.TeamId]?.Name : undefined;
                changes.push({
                    type: "quizzer",
                    action: "add",
                    description: teamName
                        ? `Add Quizzer: ${quizzer.Name} → Team: ${teamName}`
                        : `Add Quizzer: ${quizzer.Name}`
                });
            }
        }

        return { teamStats, quizzerStats, changes };
    }, [manifest, currentTeamsAndQuizzers]);

    // Filter changes based on import mode
    const filteredChanges = useMemo(() => {
        if (importMode === ImportMode.CreateNew) {
            // In create new mode, all items become "add" actions
            return changes.map(c => ({
                ...c,
                action: "add" as const,
                description: c.description.replace(/^(Update|Unchanged) /, "Add ")
            }));
        }
        // In reuse mode, filter out unchanged items
        return changes.filter(c => c.action !== "unchanged");
    }, [changes, importMode]);

    useEffect(() => {
        if (teamStats && quizzerStats && changes && filteredChanges) {
            setIsPreparing(false);
        }
    }, [teamStats, quizzerStats, changes, filteredChanges]);

    const hasChanges = filteredChanges.length > 0;

    const handleImport = async () => {
        setIsImporting(true);
        setImportError(null);

        try {
            const existingTeams = currentTeamsAndQuizzers?.Teams ?? {};
            const existingQuizzers = currentTeamsAndQuizzers?.Quizzers ?? {};

            // Build lookup maps for existing items by remote ID
            const existingTeamsByRemoteId = new Map<string, number>();
            const existingQuizzersByRemoteId = new Map<string, number>();

            for (const [idStr, teamWrapper] of Object.entries(existingTeams)) {
                const team = teamWrapper.Team;
                if (team.RemoteTeamId) {
                    existingTeamsByRemoteId.set(team.RemoteTeamId, parseInt(idStr));
                }
                if (team.RemotePersistentId) {
                    existingTeamsByRemoteId.set(team.RemotePersistentId, parseInt(idStr));
                }
            }

            for (const [idStr, quizzerWrapper] of Object.entries(existingQuizzers)) {
                const quizzer = quizzerWrapper.Quizzer;
                if (quizzer.RemotePersonId) {
                    existingQuizzersByRemoteId.set(quizzer.RemotePersonId, parseInt(idStr));
                }
            }

            const shouldReuse = importMode === ImportMode.Reuse;

            // Build the changes object
            const addedOrUpdatedTeams: Record<number, Team> = {};
            const addedTeamIds: number[] = [];
            const addedOrUpdatedQuizzers: Record<number, Quizzer> = {};
            const addedQuizzerIds: number[] = [];

            // Track ID mapping from manifest IDs to final IDs
            const teamIdMapping = new Map<number, number>();

            let nextTeamId = currentTeamsAndQuizzers?.NextTeamId ?? 1;
            let nextQuizzerId = currentTeamsAndQuizzers?.NextQuizzerId ?? 1;

            // Process teams
            for (const [manifestIdStr, team] of Object.entries(manifest.Teams)) {
                const manifestId = parseInt(manifestIdStr);

                let existingId: number | undefined;
                if (shouldReuse) {
                    existingId = team.RemoteTeamId
                        ? existingTeamsByRemoteId.get(team.RemoteTeamId)
                        : team.RemotePersistentId
                            ? existingTeamsByRemoteId.get(team.RemotePersistentId)
                            : undefined;
                }

                let finalId: number;
                if (existingId !== undefined) {
                    finalId = existingId;
                    // Check if there are actual changes
                    const existingTeam = existingTeams[existingId]?.Team;
                    if (existingTeam && isTeamChanged(team, existingTeam)) {
                        addedOrUpdatedTeams[finalId] = { ...team, Id: finalId };
                    }
                } else {
                    finalId = nextTeamId++;
                    addedTeamIds.push(finalId);
                    addedOrUpdatedTeams[finalId] = { ...team, Id: finalId };
                }

                teamIdMapping.set(manifestId, finalId);
            }

            // Process quizzers
            for (const [, quizzer] of Object.entries(manifest.Quizzers)) {
                let existingId: number | undefined;
                if (shouldReuse && quizzer.RemotePersonId) {
                    existingId = existingQuizzersByRemoteId.get(quizzer.RemotePersonId);
                }

                // Map the team ID from manifest to final
                const mappedTeamId = quizzer.TeamId !== undefined
                    ? teamIdMapping.get(quizzer.TeamId)
                    : undefined;

                let finalId: number;
                if (existingId !== undefined) {
                    finalId = existingId;
                    // Check if there are actual changes
                    const existingQuizzer = existingQuizzers[existingId]?.Quizzer;
                    if (existingQuizzer && isQuizzerChanged(quizzer, existingQuizzer)) {
                        addedOrUpdatedQuizzers[finalId] = {
                            ...quizzer,
                            Id: finalId,
                            TeamId: mappedTeamId
                        };
                    }
                } else {
                    finalId = nextQuizzerId++;
                    addedQuizzerIds.push(finalId);
                    addedOrUpdatedQuizzers[finalId] = {
                        ...quizzer,
                        Id: finalId,
                        TeamId: mappedTeamId
                    };
                }
            }

            const changesPayload: OnlineTeamsAndQuizzersChanges = {
                AddedOrUpdatedTeams: addedOrUpdatedTeams,
                AddedTeamIds: addedTeamIds,
                RemovedTeamIds: [],
                AddedOrUpdatedQuizzers: addedOrUpdatedQuizzers,
                AddedQuizzerIds: addedQuizzerIds,
                RemovedQuizzerIds: [],
                VersionId: currentTeamsAndQuizzers?.VersionId ?? ""
            };

            const updatedManifest = await AstroTeamsAndQuizzersService.updateTeamsAndQuizzers(
                auth,
                eventId,
                databaseId,
                changesPayload
            );

            setIsImporting(false);
            onComplete(updatedManifest);
            dialogRef.current?.close();
        } catch (error: unknown) {
            setIsImporting(false);
            const errorMessage = error instanceof Error
                ? error.message
                : "An error occurred while importing.";
            setImportError(errorMessage);
        }
    };

    const handleCancel = () => {
        onComplete(null);
        dialogRef.current?.close();
    };

    return (
        <dialog ref={dialogRef} className="modal" open>
            {importError && (
                <div role="alert" className="alert alert-error">
                    <FontAwesomeIcon icon="fas faCircleExclamation" />
                    <div>
                        <b>Error: </b>
                        <span>{importError}</span>
                    </div>
                </div>)}

            <div className="modal-box w-full max-w-3xl">
                <h3 className="font-bold text-lg">Import Teams & Quizzers</h3>
                <button
                    type="button"
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-0"
                    onClick={handleCancel}
                    disabled={isImporting}
                >✕</button>

                <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="radio"
                            name="importMode"
                            className="radio radio-primary mt-1"
                            checked={importMode === ImportMode.Reuse}
                            onChange={() => setImportMode(ImportMode.Reuse)}
                            disabled={isImporting}
                        />
                        <div>
                            <span className="font-semibold">Add New or Update Existing Teams & Quizzers</span>
                            <p className="text-sm text-base-content/70 mt-1">
                                Teams and quizzers that match existing entries will be updated with any changes.
                                New entries will be added.
                            </p>
                        </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="radio"
                            name="importMode"
                            className="radio radio-primary mt-1"
                            checked={importMode === ImportMode.CreateNew}
                            onChange={() => setImportMode(ImportMode.CreateNew)}
                            disabled={isImporting}
                        />
                        <div>
                            <span className="font-semibold">Create All as New Teams & Quizzers</span>
                            <p className="text-sm text-base-content/70 mt-1">
                                All teams and quizzers will be added as new entries, even if they match existing items.
                            </p>
                        </div>
                    </label>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 mb-0 text-right gap-2 flex justify-end">
                    <button
                        className="btn btn-sm btn-primary mt-0"
                        type="button"
                        onClick={handleImport}
                        disabled={!hasChanges || isImporting}
                    >
                        {isImporting ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                Importing...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon="fas faFileImport" />
                                Import Teams & Quizzers
                            </>
                        )}
                    </button>
                    <button
                        className="btn btn-sm btn-secondary mt-0"
                        type="button"
                        onClick={handleCancel}
                        disabled={isImporting}
                    >
                        Cancel
                    </button>
                </div>
                
                <div className="divider mt-2 mb-2" />

                <div className="mt-0 space-y-4">
                    <div className="overflow-x-auto mt-0">
                        <table className="table table-sm mt-0">
                            <thead>
                                <tr>
                                    <th></th>
                                    <th className="text-center">Total</th>
                                    <th className="text-center">Existing</th>
                                    <th className="text-center">New</th>
                                    <th className="text-center">Same</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="font-semibold">Teams</td>
                                    <td className="text-center">{teamStats.total}</td>
                                    <td className="text-center">{teamStats.existing}</td>
                                    <td className="text-center">{teamStats.new}</td>
                                    <td className="text-center">{teamStats.unchanged}</td>
                                </tr>
                                <tr>
                                    <td className="font-semibold">Quizzers</td>
                                    <td className="text-center">{quizzerStats.total}</td>
                                    <td className="text-center">{quizzerStats.existing}</td>
                                    <td className="text-center">{quizzerStats.new}</td>
                                    <td className="text-center">{quizzerStats.unchanged}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-base-100 rounded-lg p-3 max-h-48 overflow-y-auto">
                        {hasChanges ? (
                            <ul className="text-sm space-y-1">
                                {filteredChanges.map((change, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                        {change.action === "add" && (
                                            <span className="text-success w-4">
                                                <FontAwesomeIcon icon="fas faPlus" />
                                            </span>
                                        )}
                                        {change.action === "update" && (
                                            <span className="text-warning w-4">
                                                <FontAwesomeIcon icon="fas faPen" />
                                            </span>
                                        )}
                                        <span>{change.description}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-base-content/70 text-sm">No Changes</p>
                        )}
                    </div>
                </div>
            </div>
        </dialog>);
}