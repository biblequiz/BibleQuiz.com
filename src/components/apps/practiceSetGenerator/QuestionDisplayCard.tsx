/**
 * Question Display Card Component
 * Shows a single question with metadata
 */

import type { Question } from 'types/PracticeSetGenerator';

interface QuestionDisplayCardProps {
    question: Question;
    index: number;
    isExpanded: boolean;
    onToggle: () => void;
    includeMetadata?: boolean;
}

export default function QuestionDisplayCard({
    question,
    index,
    isExpanded,
    onToggle,
    includeMetadata = false,
}: QuestionDisplayCardProps) {
    const badgeColor =
        question.pointValue === 10 ? 'badge-info' : question.pointValue === 20 ? 'badge-warning' : 'badge-error';

    return (
        <div
            className="py-2 px-0 cursor-pointer print-question hover:bg-gray-50 transition-colors"
            onClick={onToggle}
        >
            {/* Question Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-500 text-sm">Q{index}</span>
                        <div className={`badge badge-sm ${badgeColor}`}>{question.pointValue} pts</div>
                        {question.isQuotation && (
                            <div className="badge badge-sm badge-secondary">Quotation</div>
                        )}
                    </div>
                    <h3 className="text-base font-semibold line-clamp-2">{question.text}</h3>
                </div>
                <div className={`transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
                    ▼
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="mt-2 pt-2 space-y-2 text-sm">
                    {/* Full Question Text */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-700">Full Question:</h4>
                        <p className="text-xs">{question.text}</p>
                    </div>

                    {/* Scripture Reference */}
                    {question.scriptureReference && (
                        <div>
                            <h4 className="text-xs font-bold text-gray-700">Scripture:</h4>
                            <p className="text-xs">{question.scriptureReference}</p>
                        </div>
                    )}

                    {/* Books */}
                    {question.books.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-gray-700">Books:</h4>
                            <div className="flex flex-wrap gap-1">
                                {question.books.map(book => (
                                    <span key={book} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                        {book}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Metadata */}
                    {includeMetadata && (
                        <>
                            <div className="divider my-1" />

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <h5 className="text-xs font-bold text-gray-700">
                                        Unique Words
                                    </h5>
                                    <p className="text-xs font-semibold">
                                        {question.analysis.uniqueWordCount}
                                    </p>
                                </div>
                                <div>
                                    <h5 className="text-xs font-bold text-gray-700">
                                        Total Words
                                    </h5>
                                    <p className="text-xs font-semibold">
                                        {question.analysis.totalWordCount}
                                    </p>
                                </div>
                                <div>
                                    <h5 className="text-xs font-bold text-gray-700">
                                        Complexity
                                    </h5>
                                    <p className="text-xs font-semibold">
                                        {question.analysis.complexityScore}/100
                                    </p>
                                </div>
                                <div>
                                    <h5 className="text-xs font-bold text-gray-700">
                                        Avg Word Length
                                    </h5>
                                    <p className="text-xs font-semibold">
                                        {question.analysis.averageWordLength.toFixed(1)}
                                    </p>
                                </div>
                            </div>

                            {/* Rare Words */}
                            {question.analysis.rareWords.length > 0 && (
                                <div>
                                    <h5 className="text-xs font-bold text-gray-700 mb-1">
                                        Rare Words:
                                    </h5>
                                    <div className="flex flex-wrap gap-1">
                                        {question.analysis.rareWords.map(word => (
                                            <span
                                                key={word}
                                                className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded"
                                            >
                                                {word}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Starting Phrase */}
                            <div>
                                <h5 className="text-xs font-bold text-gray-700 mb-1">
                                    Starts With:
                                </h5>
                                <p className="text-xs italic text-gray-600">
                                    "{question.analysis.startsWithPhrase}..."
                                </p>
                            </div>
                        </>
                    )}

                    {/* Meta Info */}
                    <div className="text-xs text-gray-500 mt-1 pt-1 border-t">
                        Season: {question.season} • Question #{question.id}
                    </div>
                </div>
            )}

            {/* Summary when collapsed */}
            {!isExpanded && includeMetadata && (
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                    <span>
                        <strong>{question.analysis.uniqueWordCount}</strong> unique words
                    </span>
                    <span>
                        <strong>{question.analysis.complexityScore}</strong> complexity
                    </span>
                    {question.analysis.rareWords.length > 0 && (
                        <span className="text-purple-600">
                            <strong>{question.analysis.rareWords.length}</strong> rare words
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
