import { useState, useCallback, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import type { ScoringDatabaseProviderContext } from "./ScoringDatabaseProvider";
import {
    AstroDatabaseQuestionsService,
    type OnlineDatabaseQuestionSet,
    type OnlineMatchQuestion,
    MatchQuestionUsage,
} from "types/services/AstroDatabaseQuestionsService";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import ScoringDatabaseScoreKeepAlert from "./ScoringDatabaseScoreKeepAlert";
import QuestionImportDialog from "./questions/QuestionImportDialog";

/**
 * Question type patterns to search for in question text.
 */
const QUESTION_TYPE_PATTERNS: { search: string; label: string }[] = [
    { search: "QUOTATION", label: "Quotation" },
    { search: "COMPLETION", label: "Completion" },
    { search: "ESSENCE", label: "Essence" },
    { search: "ANALYSIS", label: "Analysis" },
    { search: "SCRIPTURE TEXT", label: "Scripture Text" },
    { search: "COMPLETE ANSWER", label: "Complete Answer" },
    { search: " STATEMENT ", label: "Statement" },
    { search: "PART ANSWER", label: "Part Answer" },
    { search: "PART QUESTION", label: "Part Question" },
    { search: "TITLED", label: "Section Titled" },
];

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

interface SelectedCell {
    meetId: number;
    matchNumber: number;
    questionNumber: number;
}

interface QuestionCounts {
    tens: number;
    twenties: number;
    thirties: number;
    total: number;
}

interface AnalysisResult {
    errors: string[];
    setCountAnalysis: string[];
    questionTypeCounts: Record<string, number>;
}

export default function ScoringDatabaseQuestionsPage() {
    const {
        auth,
        eventId,
        databaseId,
        currentDatabase,
        setCurrentDatabase,
    } = useOutletContext<ScoringDatabaseProviderContext>();

    // State
    const [questionSets, setQuestionSets] = useState<OnlineDatabaseQuestionSet[]>([]);
    const [selectedMeetId, setSelectedMeetId] = useState<number | null>(null);
    const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
    const [viewMode, setViewMode] = useState<"plain" | "html">("plain");
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [showImportDialog, setShowImportDialog] = useState(false);

    const isReadOnly = currentDatabase?.IsScoreKeep || false;

    // Get meets from database
    const meets = useMemo(() => {
        return currentDatabase?.Meets || [];
    }, [currentDatabase]);

    // Load question sets on mount
    useEffect(() => {
        if (!databaseId) return;

        setIsLoading(true);
        setLoadError(null);

        AstroDatabaseQuestionsService.getAllQuestionSets(auth, eventId, databaseId)
            .then(sets => {
                setQuestionSets(sets);
                // Auto-select first meet with questions, or first meet
                if (sets.length > 0) {
                    setSelectedMeetId(sets[0].MeetId);
                } else if (meets.length > 0) {
                    setSelectedMeetId(meets[0].Display.Id);
                }
                setIsLoading(false);
            })
            .catch(err => {
                setLoadError(err.message || "Failed to load questions.");
                setIsLoading(false);
            });
    }, [auth, eventId, databaseId, meets]);

    // Get selected question set
    const selectedQuestionSet = useMemo(() => {
        if (!selectedMeetId) return null;
        return questionSets.find(qs => qs.MeetId === selectedMeetId) || null;
    }, [questionSets, selectedMeetId]);

    // Get selected meet info
    const selectedMeet = useMemo(() => {
        if (!selectedMeetId) return null;
        return meets.find(m => m.Display.Id === selectedMeetId) || null;
    }, [meets, selectedMeetId]);

    // Get the selected question
    const selectedQuestion = useMemo((): OnlineMatchQuestion | null => {
        if (!selectedCell || !selectedQuestionSet) return null;

        const matchSet = selectedQuestionSet.Matches[selectedCell.matchNumber];
        if (!matchSet) return null;

        return matchSet.Questions[selectedCell.questionNumber] || null;
    }, [selectedCell, selectedQuestionSet]);

    // Calculate grid dimensions
    const gridData = useMemo(() => {
        if (!selectedQuestionSet) {
            return { matchNumbers: [] as number[], questionNumbers: [] as number[], maxQuestions: 0 };
        }

        const matchNumbers = Object.keys(selectedQuestionSet.Matches)
            .map(Number)
            .sort((a, b) => a - b);

        let maxQuestions = 0;
        for (const matchNum of matchNumbers) {
            const match = selectedQuestionSet.Matches[matchNum];
            const questionNums = Object.keys(match.Questions).map(Number);
            maxQuestions = Math.max(maxQuestions, ...questionNums, 0);
        }

        const questionNumbers = Array.from({ length: maxQuestions }, (_, i) => i + 1);

        return { matchNumbers, questionNumbers, maxQuestions };
    }, [selectedQuestionSet]);

    // Calculate question counts
    const questionCounts = useMemo((): QuestionCounts => {
        if (!selectedQuestionSet || gridData.matchNumbers.length === 0) {
            return { tens: 0, twenties: 0, thirties: 0, total: 0 };
        }

        // Get counts from first match as representative
        const firstMatchNum = gridData.matchNumbers[0];
        const firstMatch = selectedQuestionSet.Matches[firstMatchNum];
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
    }, [selectedQuestionSet, gridData]);

    // Calculate analysis results
    const analysisResult = useMemo((): AnalysisResult => {
        const result: AnalysisResult = {
            errors: [],
            setCountAnalysis: [],
            questionTypeCounts: {},
        };

        // Initialize question type counts
        for (const pattern of QUESTION_TYPE_PATTERNS) {
            result.questionTypeCounts[pattern.label] = 0;
        }

        if (!selectedQuestionSet) return result;

        // Track point value counts per match for consistency check
        const matchPointCounts: Map<number, Map<number, number>> = new Map();

        for (const [matchNumStr, matchSet] of Object.entries(selectedQuestionSet.Matches)) {
            const matchNum = parseInt(matchNumStr);
            const pointCounts = new Map<number, number>();

            for (const question of Object.values(matchSet.Questions)) {
                if (question.Usage === MatchQuestionUsage.Regular) {
                    // Count point values
                    const current = pointCounts.get(question.PointValue) || 0;
                    pointCounts.set(question.PointValue, current + 1);

                    // Count question types
                    const plainText = question.PlainText?.toUpperCase() || "";
                    for (const pattern of QUESTION_TYPE_PATTERNS) {
                        if (plainText.includes(pattern.search)) {
                            result.questionTypeCounts[pattern.label]++;
                        }
                    }
                }
            }

            matchPointCounts.set(matchNum, pointCounts);
        }

        // Check consistency
        let firstCounts: Map<number, number> | null = null;
        let isConsistent = true;

        for (const [, counts] of matchPointCounts) {
            if (!firstCounts) {
                firstCounts = counts;
                continue;
            }

            // Compare with first
            if (counts.size !== firstCounts.size) {
                isConsistent = false;
                break;
            }

            for (const [pointValue, count] of counts) {
                if (firstCounts.get(pointValue) !== count) {
                    isConsistent = false;
                    break;
                }
            }

            if (!isConsistent) break;
        }

        if (isConsistent && firstCounts) {
            result.setCountAnalysis.push("All set counts are consistent ✓");
        } else {
            result.setCountAnalysis.push("⚠ Inconsistent set counts detected");
        }

        // Average question type counts
        const matchCount = gridData.matchNumbers.length || 1;
        for (const key of Object.keys(result.questionTypeCounts)) {
            result.questionTypeCounts[key] = Math.round(result.questionTypeCounts[key] / matchCount);
        }

        return result;
    }, [selectedQuestionSet, gridData]);

    // Handler for cell click
    const handleCellClick = useCallback((matchNumber: number, questionNumber: number) => {
        if (!selectedMeetId) return;

        setSelectedCell({
            meetId: selectedMeetId,
            matchNumber,
            questionNumber,
        });
    }, [selectedMeetId]);

    // Handler for meet selection
    const handleMeetSelect = useCallback((meetId: number) => {
        setSelectedMeetId(meetId);
        setSelectedCell(null);
    }, []);

    // Handler for import dialog save
    const handleImportSave = useCallback((updatedSet: OnlineDatabaseQuestionSet) => {
        setQuestionSets(prev => {
            const index = prev.findIndex(qs => qs.MeetId === updatedSet.MeetId);
            setCurrentDatabase(null); // Clear current database to force refresh of summaries in provider
            if (index >= 0) {
                const newSets = [...prev];
                newSets[index] = updatedSet;
                return newSets;
            } else {
                return [...prev, updatedSet];
            }
        });
        setShowImportDialog(false);
    }, []);

    // Loading state
    if (isLoading) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <span className="loading loading-spinner loading-lg"></span>
                            <span className="ml-4">Loading Questions...</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            The questions are being downloaded from the server. If you have a lot of questions,
                            this can take a little bit. Please avoid refreshing the page.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (loadError) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <FontAwesomeIcon icon="fas faTriangleExclamation" />
                            <span className="ml-4">Error</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">{loadError}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <ScoringDatabaseScoreKeepAlert isScoreKeep={isReadOnly} />

            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h3 className="text-lg font-semibold">
                    <FontAwesomeIcon icon="fas faFileLines" />
                    <span className="ml-2">Questions</span>
                </h3>
                {!isReadOnly && selectedMeetId && (
                    <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => setShowImportDialog(true)}
                    >
                        <FontAwesomeIcon icon="fas faFileImport" />
                        Import Questions
                    </button>
                )}
            </div>

            {/* Main Layout */}
            <div className="flex flex-col lg:flex-row gap-4">
                {/* Left: Questions Grid and Preview */}
                <div className="flex-1 space-y-4">
                    {/* Questions Grid */}
                    {selectedQuestionSet && gridData.matchNumbers.length > 0 ? (
                        <div className="card bg-base-100 shadow">
                            <div className="card-body p-4">
                                <h4 className="card-title text-sm">Question Grid</h4>
                                <div className="overflow-x-auto">
                                    <table className="table table-xs">
                                        <thead>
                                            <tr>
                                                <th className="bg-base-200">Match</th>
                                                {gridData.questionNumbers.map(qNum => (
                                                    <th key={qNum} className="bg-base-200 text-center">
                                                        {qNum}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {gridData.matchNumbers.map(matchNum => {
                                                const matchSet = selectedQuestionSet.Matches[matchNum];
                                                return (
                                                    <tr key={matchNum}>
                                                        <td className="bg-base-200 font-semibold">
                                                            {matchNum}
                                                        </td>
                                                        {gridData.questionNumbers.map(qNum => {
                                                            const question = matchSet?.Questions[qNum];
                                                            const pointValue = question?.PointValue ?? 0;
                                                            const isSelected =
                                                                selectedCell?.matchNumber === matchNum &&
                                                                selectedCell?.questionNumber === qNum;

                                                            return (
                                                                <td
                                                                    key={qNum}
                                                                    className={`text-center cursor-pointer select-none ${getPointValueColorClass(pointValue)} ${isSelected ? "ring-2 ring-primary ring-offset-1" : ""}`}
                                                                    onClick={() => handleCellClick(matchNum, qNum)}
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
                    ) : (
                        <div className="card bg-base-100 shadow">
                            <div className="card-body text-center py-12">
                                <FontAwesomeIcon icon="fas faFileLines" classNames={["text-4xl", "text-base-content/30", "mb-4"]} />
                                <p className="text-base-content/60">
                                    {selectedMeetId
                                        ? "No questions have been imported for this division yet."
                                        : "Select a division to view questions."}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Bottom Row: Preview and Analysis */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Question Preview */}
                        <div className="card bg-base-100 shadow">
                            <div className="card-body p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="card-title text-sm">Question Preview</h4>
                                    <div className="join">
                                        <button
                                            type="button"
                                            className={`btn btn-xs join-item ${viewMode === "plain" ? "btn-active" : ""}`}
                                            onClick={() => setViewMode("plain")}
                                        >
                                            Plain Text
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn btn-xs join-item ${viewMode === "html" ? "btn-active" : ""}`}
                                            onClick={() => setViewMode("html")}
                                            disabled={!selectedQuestion?.HtmlText}
                                        >
                                            HTML
                                        </button>
                                    </div>
                                </div>

                                {selectedQuestion ? (
                                    viewMode === "plain" ? (
                                        <div className="bg-base-200 p-3 rounded-lg text-sm font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                                            {selectedQuestion.PlainText || "(No text)"}
                                        </div>
                                    ) : (
                                        <div
                                            className="bg-white p-3 rounded-lg text-sm max-h-48 overflow-y-auto prose prose-sm"
                                            dangerouslySetInnerHTML={{
                                                __html: selectedQuestion.HtmlText || "<p>(No HTML)</p>",
                                            }}
                                        />
                                    )
                                ) : (
                                    <div className="bg-base-200 p-3 rounded-lg text-sm text-base-content/50 italic">
                                        Click a cell in the grid to preview the question.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Analysis Results */}
                        <div className="card bg-base-100 shadow">
                            <div className="card-body p-4">
                                <h4 className="card-title text-sm">Analysis</h4>
                                <div className="bg-base-200 p-3 rounded-lg text-sm max-h-48 overflow-y-auto">
                                    {analysisResult.errors.length > 0 && (
                                        <div className="text-error mb-2">
                                            {analysisResult.errors.map((err, i) => (
                                                <div key={i}>{err}</div>
                                            ))}
                                        </div>
                                    )}

                                    {analysisResult.setCountAnalysis.map((line, i) => (
                                        <div key={i} className="mb-1">
                                            {line}
                                        </div>
                                    ))}

                                    {Object.keys(analysisResult.questionTypeCounts).length > 0 && (
                                        <>
                                            <div className="divider my-2"></div>
                                            <div className="font-semibold mb-1">Avg. Counts Per Set:</div>
                                            {Object.entries(analysisResult.questionTypeCounts)
                                                .filter(([_, count]) => count > 0)
                                                .map(([type, count]) => (
                                                    <div key={type} className="text-xs">
                                                        {count} - {type}
                                                    </div>
                                                ))}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="w-full lg:w-64 space-y-4">
                    {/* Division Selector */}
                    <div className="card bg-base-100 shadow">
                        <div className="card-body p-4">
                            <h4 className="card-title text-sm">Select Division</h4>
                            <div className="space-y-1 max-h-64 overflow-y-auto">
                                {meets.length === 0 ? (
                                    <p className="text-sm text-base-content/50 italic">
                                        No divisions available.
                                    </p>
                                ) : (
                                    meets.map(meet => {
                                        const hasQuestions = questionSets.some(
                                            qs => qs.MeetId === meet.Display.Id
                                        );
                                        const isSelected = selectedMeetId === meet.Display.Id;

                                        return (
                                            <button
                                                key={meet.Display.Id}
                                                type="button"
                                                className={`btn btn-sm w-full justify-start ${isSelected ? "btn-primary" : "btn-ghost"}`}
                                                onClick={() => handleMeetSelect(meet.Display.Id)}
                                            >
                                                <span className="truncate">
                                                    {meet.Display.NameOverride || meet.Display.Name}
                                                </span>
                                                {hasQuestions && (
                                                    <FontAwesomeIcon
                                                        icon="fas faCheck"
                                                        classNames={["text-success", "ml-auto"]}
                                                    />
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Question Counts */}
                    <div className="card bg-base-100 shadow">
                        <div className="card-body p-4">
                            <h4 className="card-title text-sm">Question Counts</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>10-point questions:</span>
                                    <span className="font-semibold">{questionCounts.tens}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>20-point questions:</span>
                                    <span className="font-semibold">{questionCounts.twenties}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>30-point questions:</span>
                                    <span className="font-semibold">{questionCounts.thirties}</span>
                                </div>
                                <div className="divider my-1"></div>
                                <div className="flex justify-between text-sm font-bold">
                                    <span>Total per match:</span>
                                    <span>{questionCounts.total}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scoring Started Warning */}
                    {selectedQuestionSet?.HasScoringStarted && (
                        <div role="alert" className="alert alert-warning text-sm">
                            <FontAwesomeIcon icon="fas faTriangleExclamation" />
                            <span>Scoring has started for this division.</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Import Dialog */}
            {showImportDialog && selectedMeetId && selectedMeet && (
                <QuestionImportDialog
                    auth={auth}
                    eventId={eventId}
                    databaseId={databaseId!}
                    meetId={selectedMeetId}
                    meetName={selectedMeet.Display.NameOverride || selectedMeet.Display.Name}
                    hasScoringStarted={selectedQuestionSet?.HasScoringStarted ?? false}
                    onSave={handleImportSave}
                    onClose={() => setShowImportDialog(false)}
                />
            )}
        </div>
    );
}