import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import ConfirmationDialog from "components/ConfirmationDialog";
import type { AuthManager } from "types/AuthManager";
import type { TeamOrQuizzerReference } from "types/Meets";
import {
    AstroMeetStatsService,
    type OnlineMeetStatsSummary,
    type OnlineMeetStatsSettings
} from "types/services/AstroMeetStatsService";

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

interface QuizzerWithOverride {
    id: number;
    name: string;
    teamName: string | null;
    churchName: string | null;
    originalMatches: number;
    matchOverride: number | null;
}

export default function DivisionStatsDialog({
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

    const [statsSummary, setStatsSummary] = useState<OnlineMeetStatsSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);

    // Local state for quizzer match overrides
    const [quizzerOverrides, setQuizzerOverrides] = useState<Record<number, number | null>>({});

    // Load stats data on mount
    useEffect(() => {
        setIsLoading(true);
        setError(null);

        AstroMeetStatsService.getStats(auth, eventId, databaseId, meetId)
            .then(data => {
                setStatsSummary(data);
                // Initialize overrides from settings
                const initialOverrides: Record<number, number | null> = {};
                for (const [quizzerId, matchCount] of Object.entries(data.Settings.QuizzerMatchOverrides)) {
                    initialOverrides[parseInt(quizzerId, 10)] = matchCount;
                }
                setQuizzerOverrides(initialOverrides);
                setIsLoading(false);
            })
            .catch(err => {
                setError(err.message || "Failed to load stats data.");
                setIsLoading(false);
            });
    }, [auth, eventId, databaseId, meetId]);

    // Build quizzer list with overrides
    const quizzersWithOverrides = useMemo((): QuizzerWithOverride[] => {
        if (!statsSummary) return [];

        return Object.entries(statsSummary.Quizzers).map(([idStr, quizzer]) => {
            const id = parseInt(idStr, 10);
            return {
                id,
                name: quizzer.Reference.Name,
                teamName: quizzer.Reference.TeamName || null,
                churchName: quizzer.Reference.ChurchName || null,
                originalMatches: quizzer.OriginalMatches,
                matchOverride: quizzerOverrides[id] ?? null
            };
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [statsSummary, quizzerOverrides]);

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

    // Handle match override change
    const handleMatchOverrideChange = useCallback((quizzerId: number, value: string) => {
        setQuizzerOverrides(prev => {
            const newOverrides = { ...prev };
            if (value === "" || value === null) {
                delete newOverrides[quizzerId];
            } else {
                const numValue = parseInt(value, 10);
                if (!isNaN(numValue) && numValue >= 1) {
                    newOverrides[quizzerId] = numValue;
                }
            }
            return newOverrides;
        });
        setIsDirty(true);
    }, []);

    // Clear all overrides
    const handleClearAllOverrides = useCallback(() => {
        setQuizzerOverrides({});
        setIsDirty(true);
    }, []);

    const handleSave = async () => {
        if (!statsSummary) return;

        setIsSaving(true);
        setSaveError(null);

        try {
            // Build the stats settings
            const settings: OnlineMeetStatsSettings = {
                VersionId: statsSummary.Settings.VersionId,
                QuizzerMatchOverrides: {}
            };

            // Only include quizzers with actual overrides
            for (const [quizzerIdStr, matchCount] of Object.entries(quizzerOverrides)) {
                if (matchCount !== null && matchCount !== undefined) {
                    settings.QuizzerMatchOverrides[parseInt(quizzerIdStr, 10)] = matchCount;
                }
            }

            await AstroMeetStatsService.updateStats(
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
            setSaveError(err.message || "Failed to save stats settings.");
        } finally {
            setIsSaving(false);
        }
    };

    const hasAnyOverrides = Object.keys(quizzerOverrides).length > 0;

    return (
        <dialog ref={dialogRef} className="modal" open>
            <div className="modal-box w-full max-w-4xl max-h-[90vh]">
                <h3 className="font-bold text-lg">
                    <FontAwesomeIcon icon="fas faChartBar" />
                    <span className="ml-2">Stats Settings - {meetName}</span>
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
                            <span className="ml-4">Loading stats data...</span>
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

                    {statsSummary && !isLoading && (
                        <>
                            {/* Info Alert */}
                            <div role="alert" className="alert alert-info mb-4">
                                <FontAwesomeIcon icon="fas faCircleInfo" />
                                <span>
                                    By default, the average is calculated based on the number of matches each team or quizzer competed in. In certain unusual circumstances, you may want to use a set number of matches instead to adjust for teams or quizzers with a high average who only competed at a single competition, which may force them higher in the averages.
                                </span>
                            </div>

                            {/* Clear all button */}
                            {!isReadOnly && (
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-sm text-base-content/60">
                                        <FontAwesomeIcon icon="fas faUser" />
                                        <span className="ml-2">Quizzers ({quizzersWithOverrides.length})</span>
                                    </span>
                                    <div className="flex-grow"></div>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-ghost"
                                        onClick={handleClearAllOverrides}
                                        disabled={isSaving || !hasAnyOverrides}
                                    >
                                        <FontAwesomeIcon icon="fas faRotateLeft" />
                                        Clear All Overrides
                                    </button>
                                </div>
                            )}

                            {/* Quizzers table */}
                            <div className="max-h-[50vh] overflow-y-auto border rounded-lg">
                                <div className="overflow-x-auto">
                                    <table className="table table-xs table-zebra w-full">
                                        <thead>
                                            <tr>
                                                <th>Quizzer</th>
                                                <th>Team</th>
                                                <th>Church</th>
                                                <th>Matches</th>
                                                <th className="w-32">Match Override</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {quizzersWithOverrides.map((quizzer) => (
                                                <tr key={quizzer.id}>
                                                    <td className="font-medium">{quizzer.name}</td>
                                                    <td>{quizzer.teamName || "-"}</td>
                                                    <td>{quizzer.churchName || "-"}</td>
                                                    <td>{quizzer.originalMatches}</td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="input input-bordered input-xs w-20"
                                                            min="1"
                                                            step="1"
                                                            value={quizzer.matchOverride ?? ""}
                                                            onChange={(e) => handleMatchOverrideChange(quizzer.id, e.target.value)}
                                                            disabled={isReadOnly || isSaving}
                                                            placeholder=""
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="mt-4 text-right gap-2 flex justify-end">
                    {!isReadOnly && statsSummary && (
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
                                    Save Settings
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