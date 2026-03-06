import { useRef, useState, useEffect, useCallback } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import ConfirmationDialog from "components/ConfirmationDialog";
import type { AuthManager } from "types/AuthManager";
import type { OnlineDatabaseSummary } from "types/services/AstroDatabasesService";
import type { ScoringReportTeam, ScoringReportQuizzer } from "types/EventScoringReport";
import {
    AstroMeetRankingService,
    type OnlineMeetRankingSummary,
    type OnlineMeetRankingSettings
} from "types/services/AstroMeetRankingService";

interface Props {
    auth: AuthManager;
    eventId: string;
    databaseId: string;
    meetId: number;
    meetName: string;
    isReadOnly: boolean;
    onSave: () => void;
    onClose: () => void;
}

type RankingTab = "teams" | "quizzers";

export default function DivisionRankingDialog({
    auth,
    eventId,
    databaseId,
    meetId,
    meetName,
    isReadOnly,
    onSave,
    onClose
}: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    const [activeTab, setActiveTab] = useState<RankingTab>("teams");
    const [rankingSummary, setRankingSummary] = useState<OnlineMeetRankingSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);

    // Local state for ranked items (can be reordered)
    const [rankedTeams, setRankedTeams] = useState<ScoringReportTeam[]>([]);
    const [rankedQuizzers, setRankedQuizzers] = useState<ScoringReportQuizzer[]>([]);

    // Override messages
    const [teamOverrideMessage, setTeamOverrideMessage] = useState<string>("");
    const [quizzerOverrideMessage, setQuizzerOverrideMessage] = useState<string>("");

    // Drag state
    const [draggedTeamIndex, setDraggedTeamIndex] = useState<number | null>(null);
    const [dragOverTeamIndex, setDragOverTeamIndex] = useState<number | null>(null);
    const [draggedQuizzerIndex, setDraggedQuizzerIndex] = useState<number | null>(null);
    const [dragOverQuizzerIndex, setDragOverQuizzerIndex] = useState<number | null>(null);

    // Load ranking data on mount
    useEffect(() => {
        setIsLoading(true);
        setError(null);

        AstroMeetRankingService.getRanking(auth, eventId, databaseId, meetId)
            .then(data => {
                setRankingSummary(data);
                setRankedTeams([...data.RankedTeams]);
                setRankedQuizzers([...data.RankedQuizzers]);
                setTeamOverrideMessage(data.Settings.TeamOverrideMessage || "");
                setQuizzerOverrideMessage(data.Settings.QuizzerOverrideMessage || "");
                setIsLoading(false);
            })
            .catch(err => {
                setError(err.message || "Failed to load ranking data.");
                setIsLoading(false);
            });
    }, [auth, eventId, databaseId, meetId]);

    // Handle close with unsaved changes check
    const handleClose = useCallback(() => {
        if (isDirty && !isReadOnly) {
            setShowCloseConfirmation(true);
        } else {
            onClose();
        }
    }, [isDirty, isReadOnly, onClose]);

    // Handle Escape key to close dialog
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !isSaving) {
                e.preventDefault();
                handleClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleClose, isSaving]);

    // Team drag handlers
    const handleTeamDragStart = useCallback((e: React.DragEvent, index: number) => {
        if (isReadOnly) return;
        setDraggedTeamIndex(index);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", index.toString());
    }, [isReadOnly]);

    const handleTeamDragEnd = useCallback(() => {
        setDraggedTeamIndex(null);
        setDragOverTeamIndex(null);
    }, []);

    const handleTeamDragOver = useCallback((e: React.DragEvent, index: number) => {
        if (isReadOnly) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverTeamIndex(index);
    }, [isReadOnly]);

    const handleTeamDragLeave = useCallback(() => {
        setDragOverTeamIndex(null);
    }, []);

    const handleTeamDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        if (isReadOnly || draggedTeamIndex === null || draggedTeamIndex === targetIndex) {
            setDraggedTeamIndex(null);
            setDragOverTeamIndex(null);
            return;
        }

        const newRankedTeams = [...rankedTeams];
        const [movedTeam] = newRankedTeams.splice(draggedTeamIndex, 1);
        newRankedTeams.splice(targetIndex, 0, movedTeam);
        setRankedTeams(newRankedTeams);
        setIsDirty(true);
        setDraggedTeamIndex(null);
        setDragOverTeamIndex(null);
    }, [isReadOnly, draggedTeamIndex, rankedTeams]);

    // Quizzer drag handlers
    const handleQuizzerDragStart = useCallback((e: React.DragEvent, index: number) => {
        if (isReadOnly) return;
        setDraggedQuizzerIndex(index);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", index.toString());
    }, [isReadOnly]);

    const handleQuizzerDragEnd = useCallback(() => {
        setDraggedQuizzerIndex(null);
        setDragOverQuizzerIndex(null);
    }, []);

    const handleQuizzerDragOver = useCallback((e: React.DragEvent, index: number) => {
        if (isReadOnly) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverQuizzerIndex(index);
    }, [isReadOnly]);

    const handleQuizzerDragLeave = useCallback(() => {
        setDragOverQuizzerIndex(null);
    }, []);

    const handleQuizzerDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        if (isReadOnly || draggedQuizzerIndex === null || draggedQuizzerIndex === targetIndex) {
            setDraggedQuizzerIndex(null);
            setDragOverQuizzerIndex(null);
            return;
        }

        const newRankedQuizzers = [...rankedQuizzers];
        const [movedQuizzer] = newRankedQuizzers.splice(draggedQuizzerIndex, 1);
        newRankedQuizzers.splice(targetIndex, 0, movedQuizzer);
        setRankedQuizzers(newRankedQuizzers);
        setIsDirty(true);
        setDraggedQuizzerIndex(null);
        setDragOverQuizzerIndex(null);
    }, [isReadOnly, draggedQuizzerIndex, rankedQuizzers]);

    const handleClearTeamRanking = () => {
        if (!rankingSummary) return;

        // Create a lookup for all teams.
        const currentTeams = new Map<number, ScoringReportTeam>();
        rankedTeams.forEach(team => {
            currentTeams.set(parseInt(team.Id, 10), team);
        });

        // Generate a new ordered list of teams based on the default ranking.
        const newRankedTeams: ScoringReportTeam[] = [];
        rankingSummary.DefaultRankedTeams.forEach(teamId => {
            newRankedTeams.push(currentTeams.get(teamId)!);
            currentTeams.delete(teamId);
        });

        // Add any remaining teams in the order they were previously.
        rankedTeams.forEach(team => {
            const teamId = parseInt(team.Id, 10);
            if (currentTeams.has(teamId)) {
                newRankedTeams.push(team);
                currentTeams.delete(teamId);
            }
        });
        
        setRankedTeams(newRankedTeams);
        setTeamOverrideMessage("");
        setIsDirty(true);
    };

    const handleClearQuizzerRanking = () => {
        if (!rankingSummary) return;

        // Create a lookup for all quizzers.
        const currentQuizzers = new Map<number, ScoringReportQuizzer>();
        rankedQuizzers.forEach(quizzer => {
            currentQuizzers.set(parseInt(quizzer.Id, 10), quizzer);
        });

        // Generate a new ordered list of quizzers based on the default ranking.
        const newRankedQuizzers: ScoringReportQuizzer[] = [];
        rankingSummary.DefaultRankedQuizzers.forEach(quizzerId => {
            newRankedQuizzers.push(currentQuizzers.get(quizzerId)!);
            currentQuizzers.delete(quizzerId);
        });

        // Add any remaining quizzers in the order they were previously.
        rankedQuizzers.forEach(quizzer => {
            const quizzerId = parseInt(quizzer.Id, 10);
            if (currentQuizzers.has(quizzerId)) {
                newRankedQuizzers.push(quizzer);
                currentQuizzers.delete(quizzerId);
            }
        });
        
        setRankedQuizzers(newRankedQuizzers);
        setQuizzerOverrideMessage("");
        setIsDirty(true);
    };

    const handleSave = async () => {
        if (!rankingSummary) return;

        setIsSaving(true);
        setSaveError(null);

        try {
            // Build the ranking settings
            const settings: OnlineMeetRankingSettings = {
                VersionId: rankingSummary.Settings.VersionId,
                TeamOverrideMessage: teamOverrideMessage || null,
                TeamRankOverrides: rankedTeams.map(t => parseInt(t.Id, 10)),
                QuizzerOverrideMessage: quizzerOverrideMessage || null,
                QuizzerRankOverrides: rankedQuizzers.map(q => parseInt(q.Id, 10))
            };

            await AstroMeetRankingService.updateRanking(
                auth,
                eventId,
                databaseId,
                meetId,
                settings
            );

            setIsDirty(false);
            onSave();
            onClose();
        } catch (err: any) {
            setSaveError(err.message || "Failed to save ranking settings.");
        } finally {
            setIsSaving(false);
        }
    };

    const renderTeamsTable = () => (
        <div className="overflow-x-auto">
            <table className="table table-xs table-zebra w-full">
                <thead>
                    <tr>
                        {!isReadOnly && <th className="w-8"></th>}
                        <th className="w-10">#</th>
                        <th>Team</th>
                        <th>Church</th>
                        <th className="text-center w-12">Win</th>
                        <th className="text-center w-12">Loss</th>
                        <th className="text-right w-16">Total</th>
                        <th className="text-center w-12">QO</th>
                        <th className="text-right w-16">Avg</th>
                        <th className="text-center w-12">10s</th>
                        <th className="text-center w-12">20s</th>
                        <th className="text-center w-12">30s</th>
                    </tr>
                </thead>
                <tbody>
                    {rankedTeams.map((team, index) => (
                        <tr
                            key={team.Id}
                            draggable={!isReadOnly}
                            onDragStart={(e) => handleTeamDragStart(e, index)}
                            onDragEnd={handleTeamDragEnd}
                            onDragOver={(e) => handleTeamDragOver(e, index)}
                            onDragLeave={handleTeamDragLeave}
                            onDrop={(e) => handleTeamDrop(e, index)}
                            className={`
                                ${!isReadOnly ? "cursor-grab active:cursor-grabbing" : ""}
                                ${draggedTeamIndex === index ? "opacity-50" : ""}
                                ${dragOverTeamIndex === index && draggedTeamIndex !== index ? "bg-primary/30 border-t-2 border-primary" : ""}
                            `}
                        >
                            {!isReadOnly && (
                                <td className="text-base-content/40">
                                    <FontAwesomeIcon icon="fas faGripVertical" />
                                </td>
                            )}
                            <td>{index + 1}</td>
                            <td className="font-medium">{team.Name}</td>
                            <td>{team.ChurchName}</td>
                            <td className="text-center">{team.Scores?.Wins ?? "-"}</td>
                            <td className="text-center">{team.Scores?.Losses ?? "-"}</td>
                            <td className="text-right">{team.Scores?.TotalPoints ?? "-"}</td>
                            <td className="text-center">{team.Scores?.QuizOuts ?? "-"}</td>
                            <td className="text-right">{team.Scores?.AveragePoints?.toFixed(1) ?? "-"}</td>
                            <td className="text-center">{team.Scores?.Correct10s ?? "-"}</td>
                            <td className="text-center">{team.Scores?.Correct20s ?? "-"}</td>
                            <td className="text-center">{team.Scores?.Correct30s ?? "-"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderQuizzersTable = () => (
        <div className="overflow-x-auto">
            <table className="table table-xs table-zebra w-full">
                <thead>
                    <tr>
                        {!isReadOnly && <th className="w-8"></th>}
                        <th className="w-10">#</th>
                        <th>Quizzer</th>
                        <th>Team</th>
                        <th className="text-right w-16">Total</th>
                        <th className="text-center w-12">QO</th>
                        <th className="text-right w-16">Avg</th>
                        <th className="text-center w-12">10s</th>
                        <th className="text-center w-12">20s</th>
                        <th className="text-center w-12">30s</th>
                    </tr>
                </thead>
                <tbody>
                    {rankedQuizzers.map((quizzer, index) => (
                        <tr
                            key={quizzer.Id}
                            draggable={!isReadOnly}
                            onDragStart={(e) => handleQuizzerDragStart(e, index)}
                            onDragEnd={handleQuizzerDragEnd}
                            onDragOver={(e) => handleQuizzerDragOver(e, index)}
                            onDragLeave={handleQuizzerDragLeave}
                            onDrop={(e) => handleQuizzerDrop(e, index)}
                            className={`
                                ${!isReadOnly ? "cursor-grab active:cursor-grabbing" : ""}
                                ${draggedQuizzerIndex === index ? "opacity-50" : ""}
                                ${dragOverQuizzerIndex === index && draggedQuizzerIndex !== index ? "bg-primary/30 border-t-2 border-primary" : ""}
                            `}
                        >
                            {!isReadOnly && (
                                <td className="text-base-content/40">
                                    <FontAwesomeIcon icon="fas faGripVertical" />
                                </td>
                            )}
                            <td>{index + 1}</td>
                            <td className="font-medium">{quizzer.Name}</td>
                            <td>{quizzer.TeamName}</td>
                            <td className="text-right">{quizzer.Scores?.TotalPoints ?? "-"}</td>
                            <td className="text-center">{quizzer.Scores?.QuizOuts ?? "-"}</td>
                            <td className="text-right">{quizzer.Scores?.AveragePoints?.toFixed(1) ?? "-"}</td>
                            <td className="text-center">{quizzer.Scores?.Correct10s ?? "-"}</td>
                            <td className="text-center">{quizzer.Scores?.Correct20s ?? "-"}</td>
                            <td className="text-center">{quizzer.Scores?.Correct30s ?? "-"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <dialog ref={dialogRef} className="modal" open>
            <div className="modal-box w-full max-w-5xl max-h-[90vh]">
                <h3 className="font-bold text-lg">
                    <FontAwesomeIcon icon="fas faMedal" />
                    <span className="ml-2">Ranking Settings - {meetName}</span>
                </h3>
                <button
                    type="button"
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    onClick={handleClose}
                    disabled={isSaving}
                >✕</button>

                <div className="mt-4">
                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <span className="loading loading-spinner loading-lg"></span>
                            <span className="ml-4">Loading ranking data...</span>
                        </div>
                    )}

                    {error && (
                        <div role="alert" className="alert alert-error">
                            <FontAwesomeIcon icon="fas faCircleExclamation" />
                            <div>
                                <b>Error: </b>{error}
                            </div>
                        </div>
                    )}

                    {saveError && (
                        <div role="alert" className="alert alert-error mb-4">
                            <FontAwesomeIcon icon="fas faTriangleExclamation" />
                            <div>
                                <b>Save Error: </b>{saveError}
                            </div>
                        </div>
                    )}

                    {rankingSummary && !isLoading && (
                        <>
                            {/* Tabs */}
                            <div role="tablist" className="tabs tabs-boxed mb-4">
                                <button
                                    type="button"
                                    role="tab"
                                    className={`tab ${activeTab === "teams" ? "tab-active" : ""}`}
                                    onClick={() => setActiveTab("teams")}
                                >
                                    <FontAwesomeIcon icon="fas faUsers" />
                                    <span className="ml-2">Teams ({rankedTeams.length})</span>
                                </button>
                                <button
                                    type="button"
                                    role="tab"
                                    className={`tab ${activeTab === "quizzers" ? "tab-active" : ""}`}
                                    onClick={() => setActiveTab("quizzers")}
                                >
                                    <FontAwesomeIcon icon="fas faUser" />
                                    <span className="ml-2">Quizzers ({rankedQuizzers.length})</span>
                                </button>
                            </div>

                            {/* Teams Tab Content */}
                            {activeTab === "teams" && (
                                <div className="space-y-4">
                                    {/* Drag hint and reset button */}
                                    {!isReadOnly && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-base-content/60">
                                                <FontAwesomeIcon icon="fas faGripVertical" />
                                                <span className="ml-2">Drag rows to reorder rankings</span>
                                            </span>
                                            <div className="flex-grow"></div>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-ghost"
                                                onClick={handleClearTeamRanking}
                                                disabled={isSaving}
                                            >
                                                <FontAwesomeIcon icon="fas faRotateLeft" />
                                                Reset to Default
                                            </button>
                                        </div>
                                    )}

                                    {/* Teams table */}
                                    <div className="max-h-[40vh] overflow-y-auto border rounded-lg">
                                        {renderTeamsTable()}
                                    </div>

                                    {/* Override message */}
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Override Message</span>
                                        </label>
                                        <textarea
                                            className="textarea textarea-bordered h-20"
                                            placeholder="Enter a message explaining the ranking override..."
                                            value={teamOverrideMessage}
                                            onChange={(e) => {
                                                setTeamOverrideMessage(e.target.value);
                                                setIsDirty(true);
                                            }}
                                            disabled={isReadOnly || isSaving}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Quizzers Tab Content */}
                            {activeTab === "quizzers" && (
                                <div className="space-y-4">
                                    {/* Drag hint and reset button */}
                                    {!isReadOnly && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-base-content/60">
                                                <FontAwesomeIcon icon="fas faGripVertical" />
                                                <span className="ml-2">Drag rows to reorder rankings</span>
                                            </span>
                                            <div className="flex-grow"></div>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-ghost"
                                                onClick={handleClearQuizzerRanking}
                                                disabled={isSaving}
                                            >
                                                <FontAwesomeIcon icon="fas faRotateLeft" />
                                                Reset to Default
                                            </button>
                                        </div>
                                    )}

                                    {/* Quizzers table */}
                                    <div className="max-h-[40vh] overflow-y-auto border rounded-lg">
                                        {renderQuizzersTable()}
                                    </div>

                                    {/* Override message */}
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Override Message</span>
                                        </label>
                                        <textarea
                                            className="textarea textarea-bordered h-20"
                                            placeholder="Enter a message explaining the ranking override..."
                                            value={quizzerOverrideMessage}
                                            onChange={(e) => {
                                                setQuizzerOverrideMessage(e.target.value);
                                                setIsDirty(true);
                                            }}
                                            disabled={isReadOnly || isSaving}
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="mt-4 text-right gap-2 flex justify-end">
                    {!isReadOnly && rankingSummary && (
                        <button
                            className="btn btn-sm btn-primary"
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving || isLoading || !isDirty}
                        >
                            {isSaving ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon="fas faSave" />
                                    Save Rankings
                                </>
                            )}
                        </button>
                    )}
                    <button
                        className="btn btn-sm btn-secondary"
                        type="button"
                        onClick={handleClose}
                        disabled={isSaving}
                    >
                        {isReadOnly ? "Close" : "Cancel"}
                    </button>
                </div>
            </div>

            {/* Close Confirmation Dialog */}
            {showCloseConfirmation && (
                <ConfirmationDialog
                    title="Unsaved Changes"
                    yesLabel="Discard Changes"
                    noLabel="Keep Editing"
                    onYes={onClose}
                    onNo={() => setShowCloseConfirmation(false)}
                    className="max-w-md"
                >
                    <p className="py-4">
                        You have unsaved changes. Are you sure you want to close without saving?
                    </p>
                </ConfirmationDialog>
            )}
        </dialog>
    );
}