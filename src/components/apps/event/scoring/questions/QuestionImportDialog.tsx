import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import ConfirmationDialog from "components/ConfirmationDialog";
import type { AuthManager } from "types/AuthManager";
import {
    AstroDatabaseQuestionsService,
    type OnlineDatabaseQuestionSet,
    type OnlineDatabaseQuestionSetManifest,
    MatchQuestionUsage,
} from "types/services/AstroDatabaseQuestionsService";

interface Props {
    auth: AuthManager;
    eventId: string;
    databaseId: string;
    meetId: number;
    meetName: string;
    hasScoringStarted: boolean;
    onSave: (updatedSet: OnlineDatabaseQuestionSet) => void;
    onClose: () => void;
}

/**
 * Get the background color class for a point value.
 */
function getPointValueColorClass(pointValue: number): string {
    switch (pointValue) {
        case 0:
            return "bg-black text-white";
        case 10:
            return "bg-white text-black border border-base-300";
        case 20:
            return "bg-yellow-300 text-black";
        case 30:
            return "bg-green-200 text-black";
        default:
            return "bg-red-200 text-black";
    }
}

export default function QuestionImportDialog({
    auth,
    eventId,
    databaseId,
    meetId,
    meetName,
    hasScoringStarted,
    onSave,
    onClose,
}: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [parsedManifest, setParsedManifest] = useState<OnlineDatabaseQuestionSetManifest | null>(null);
    const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
    const [showScoringWarning, setShowScoringWarning] = useState(false);

    // Calculate grid dimensions from parsed questions
    const gridData = useMemo(() => {
        if (!parsedManifest?.Set) {
            return { matchNumbers: [] as number[], questionNumbers: [] as number[], maxQuestions: 0 };
        }

        const matchNumbers = Object.keys(parsedManifest.Set.Matches)
            .map(Number)
            .sort((a, b) => a - b);

        let maxQuestions = 0;
        for (const matchNum of matchNumbers) {
            const match = parsedManifest.Set.Matches[matchNum];
            const questionNums = Object.keys(match.Questions).map(Number);
            maxQuestions = Math.max(maxQuestions, ...questionNums, 0);
        }

        const questionNumbers = Array.from({ length: maxQuestions }, (_, i) => i + 1);

        return { matchNumbers, questionNumbers, maxQuestions };
    }, [parsedManifest]);

    // Calculate question counts summary
    const questionCounts = useMemo(() => {
        if (!parsedManifest?.Set || gridData.matchNumbers.length === 0) {
            return { tens: 0, twenties: 0, thirties: 0, total: 0 };
        }

        // Get counts from first match as representative
        const firstMatchNum = gridData.matchNumbers[0];
        const firstMatch = parsedManifest.Set.Matches[firstMatchNum];
        if (!firstMatch) {
            return { tens: 0, twenties: 0, thirties: 0, total: 0 };
        }

        let tens = 0;
        let twenties = 0;
        let thirties = 0;

        for (const question of Object.values(firstMatch.Questions)) {
            if (question.Usage === MatchQuestionUsage.Regular) {
                switch (question.PointValue) {
                    case 10:
                        tens++;
                        break;
                    case 20:
                        twenties++;
                        break;
                    case 30:
                        thirties++;
                        break;
                }
            }
        }

        return {
            tens,
            twenties,
            thirties,
            total: tens + twenties + thirties,
        };
    }, [parsedManifest, gridData]);

    // Handle file selection
    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setSelectedFile(file);
        setParsedManifest(null);
        setUploadError(null);
    }, []);

    // Handle file upload and parse
    const handleUpload = useCallback(async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setUploadError(null);
        setParsedManifest(null);

        try {
            const formData = new FormData();
            formData.append("file", selectedFile);

            const manifest = await AstroDatabaseQuestionsService.parseQuestions(
                auth,
                eventId,
                databaseId,
                meetId,
                formData
            );

            setParsedManifest(manifest);

            if (manifest.ErrorMessage) {
                setUploadError(manifest.ErrorMessage);
            }
        } catch (err: any) {
            setUploadError(err.message || "Failed to parse the questions file.");
        } finally {
            setIsUploading(false);
        }
    }, [auth, eventId, databaseId, meetId, selectedFile]);

    // Handle save - with scoring warning check
    const handleSaveClick = useCallback(() => {
        if (hasScoringStarted) {
            setShowScoringWarning(true);
        } else {
            handleSave();
        }
    }, [hasScoringStarted, parsedManifest]);

    // Actual save operation
    const handleSave = useCallback(async () => {
        if (!parsedManifest?.Set) return;

        setShowScoringWarning(false);
        setIsSaving(true);
        setSaveError(null);

        try {
            await AstroDatabaseQuestionsService.updateQuestionSet(
                auth,
                eventId,
                databaseId,
                parsedManifest.Set
            );

            onSave(parsedManifest.Set);
        } catch (err: any) {
            setSaveError(err.message || "Failed to save the questions.");
        } finally {
            setIsSaving(false);
        }
    }, [auth, eventId, databaseId, parsedManifest, onSave]);

    // Handle close with confirmation
    const handleClose = useCallback(() => {
        if (parsedManifest && !isSaving) {
            setShowCloseConfirmation(true);
        } else {
            onClose();
        }
    }, [parsedManifest, isSaving, onClose]);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !isSaving && !isUploading) {
                e.preventDefault();
                handleClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleClose, isSaving, isUploading]);

    return (
        <dialog ref={dialogRef} className="modal" open>
            <div className="modal-box w-full max-w-5xl max-h-[90vh]">
                <h3 className="font-bold text-lg">
                    <FontAwesomeIcon icon="fas faFileImport" />
                    <span className="ml-2">Import Questions - {meetName}</span>
                </h3>
                <button
                    type="button"
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 mt-0 mb-0"
                    onClick={handleClose}
                    disabled={isSaving || isUploading}
                >
                    ✕
                </button>

                <div className="mt-4 space-y-4">
                    {/* Scoring Warning Banner */}
                    {hasScoringStarted && (
                        <div role="alert" className="alert alert-warning mt-2 mb-2">
                            <FontAwesomeIcon icon="fas faTriangleExclamation" />
                            <div>
                                <strong>Warning:</strong> Scoring has already started for this division.
                                Importing new questions may affect existing scores.
                            </div>
                        </div>
                    )}

                    {/* File Selection */}
                    <div className="card bg-base-200">
                        <div className="card-body p-4">
                            <h4 className="card-title text-sm">Select Questions File</h4>
                            <div className="flex flex-wrap gap-2 items-center">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".txt,.rtf,.doc,.docx"
                                    onChange={handleFileChange}
                                    className="file-input file-input-bordered file-input-sm flex-1 min-w-48"
                                    disabled={isUploading || isSaving}
                                />
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={handleUpload}
                                    disabled={!selectedFile || isUploading || isSaving}
                                >
                                    {isUploading ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            Parsing...
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon="fas faUpload" />
                                            Upload & Parse
                                        </>
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-base-content/60 mt-1">
                                Supported formats: .txt, .rtf, .doc, .docx
                            </p>
                        </div>
                    </div>

                    {/* Error Messages */}
                    {uploadError && (
                        <div role="alert" className="alert alert-error">
                            <FontAwesomeIcon icon="fas faCircleExclamation" />
                            <div>
                                <strong>Parsing Error: </strong>
                                <span className="whitespace-pre-wrap">{uploadError}</span>
                            </div>
                        </div>
                    )}

                    {saveError && (
                        <div role="alert" className="alert alert-error">
                            <FontAwesomeIcon icon="fas faTriangleExclamation" />
                            <div>
                                <strong>Save Error: </strong>{saveError}
                            </div>
                        </div>
                    )}

                    {/* Parsed Results Preview */}
                    {parsedManifest?.Set && (
                        <div className="space-y-4">
                            <div className="divider">Preview of Parsed Questions</div>

                            {/* Summary Stats */}
                            <div className="stats stats-vertical lg:stats-horizontal shadow w-full mb-0 mt-0">
                                <div className="stat mb-0 mt-0">
                                    <div className="stat-title mb-0 mt-0">Matches</div>
                                    <div className="stat-value text-2xl mb-0 mt-0">{gridData.matchNumbers.length}</div>
                                </div>
                                <div className="stat mb-0 mt-0">
                                    <div className="stat-title mb-0 mt-0">Questions/Match</div>
                                    <div className="stat-value text-2xl mb-0 mt-0">{questionCounts.total}</div>
                                </div>
                                <div className="stat mb-0 mt-0">
                                    <div className="stat-title mb-0 mt-0">10-pt</div>
                                    <div className="stat-value text-2xl mb-0 mt-0">{questionCounts.tens}</div>
                                </div>
                                <div className="stat mb-0 mt-0">
                                    <div className="stat-title mb-0 mt-0">20-pt</div>
                                    <div className="stat-value text-2xl mb-0 mt-0">{questionCounts.twenties}</div>
                                </div>
                                <div className="stat mb-0 mt-0">
                                    <div className="stat-title mb-0 mt-0">30-pt</div>
                                    <div className="stat-value text-2xl mb-0 mt-0">{questionCounts.thirties}</div>
                                </div>
                            </div>

                            {/* Preview Grid */}
                            <div className="card bg-base-100 shadow">
                                <div className="card-body p-4">
                                    <h4 className="card-title text-sm mb-1">Question Grid Preview</h4>
                                    <div className="overflow-x-auto max-h-64 mt-0 mb-0">
                                        <table className="table table-xs">
                                            <thead>
                                                <tr>
                                                    <th className="bg-base-200 sticky top-0">Match</th>
                                                    {gridData.questionNumbers.map(qNum => (
                                                        <th key={qNum} className="bg-base-200 text-center sticky top-0">
                                                            {qNum}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {gridData.matchNumbers.map(matchNum => {
                                                    const matchSet = parsedManifest.Set.Matches[matchNum];
                                                    return (
                                                        <tr key={matchNum}>
                                                            <td className="bg-base-200 font-semibold">
                                                                {matchNum}
                                                            </td>
                                                            {gridData.questionNumbers.map(qNum => {
                                                                const question = matchSet?.Questions[qNum];
                                                                const pointValue = question?.PointValue ?? 0;

                                                                return (
                                                                    <td
                                                                        key={qNum}
                                                                        className={`text-center ${getPointValueColorClass(pointValue)}`}
                                                                    >
                                                                        {pointValue}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Color Legend */}
                                    <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                        <span className="badge badge-sm bg-black text-white">0 pts</span>
                                        <span className="badge badge-sm bg-white text-black border">10 pts</span>
                                        <span className="badge badge-sm bg-yellow-300 text-black">20 pts</span>
                                        <span className="badge badge-sm bg-green-200 text-black">30 pts</span>
                                        <span className="badge badge-sm bg-red-200 text-black">Other</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* No parsed content message */}
                    {!parsedManifest && !isUploading && (
                        <div className="text-center py-8 text-base-content/60">
                            <FontAwesomeIcon icon="fas faFileLines" classNames={["text-4xl", "mb-4"]} />
                            <p>Select a file and click "Upload & Parse" to preview the questions.</p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex justify-end gap-2">
                    {parsedManifest?.Set && (
                        <button
                            type="button"
                            className="btn btn-primary btn-sm mt-0 mb-0"
                            onClick={handleSaveClick}
                            disabled={isSaving || isUploading}
                        >
                            {isSaving ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon="fas faCheck" />
                                    Approve & Save
                                </>
                            )}
                        </button>
                    )}
                    <button
                        type="button"
                        className="btn btn-secondary btn-sm mt-0 mb-0"
                        onClick={handleClose}
                        disabled={isSaving || isUploading}
                    >
                        Cancel
                    </button>
                </div>
            </div>

            {/* Close Confirmation */}
            {showCloseConfirmation && (
                <ConfirmationDialog
                    title="Discard Changes?"
                    yesLabel="Discard"
                    noLabel="Keep Editing"
                    onYes={onClose}
                    onNo={() => setShowCloseConfirmation(false)}
                    className="max-w-md"
                >
                    <p className="py-4">
                        You have parsed questions that haven't been saved. Are you sure you want to close without saving?
                    </p>
                </ConfirmationDialog>
            )}

            {/* Scoring Started Warning */}
            {showScoringWarning && (
                <ConfirmationDialog
                    title="Scoring Has Started"
                    yesLabel="Continue Anyway"
                    noLabel="Cancel"
                    onYes={handleSave}
                    onNo={() => setShowScoringWarning(false)}
                    className="max-w-md"
                >
                    <p className="py-4">
                        <strong className="text-warning">Warning:</strong> Scoring has already started for the "{meetName}" division.
                        Existing scores may be impacted and all future changes will use the new point values.
                    </p>
                    <p className="text-sm text-base-content/70">
                        It is <strong>strongly recommended</strong> not to import questions to this division.
                    </p>
                </ConfirmationDialog>
            )}
        </dialog>
    );
}