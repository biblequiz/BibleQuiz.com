/**
 * Practice Set Preview Component
 * Displays generated questions and provides export options
 */

import { useState } from 'react';
import type { PracticeSetResult, PracticeSetConfig } from 'types/PracticeSetGenerator';

interface PracticeSetPreviewProps {
    result: PracticeSetResult;
    config: PracticeSetConfig;
}

export default function PracticeSetPreview({ result, config }: PracticeSetPreviewProps) {
    const [showAnalytics, setShowAnalytics] = useState(true);

    const pointDistribution = Object.entries(result.metadata.pointValueDistribution).map(
        ([points, count]) => ({
            points: parseInt(points),
            count,
            percentage: ((count / result.questions.length) * 100).toFixed(1),
        })
    );



    const handleExportJSON = () => {
        const jsonData = JSON.stringify(
            {
                config: {
                    name: config.name,
                    description: config.description,
                    generatedAt: new Date().toISOString(),
                },
                metadata: result.metadata,
                questions: result.questions.map(q => ({
                    id: q.id,
                    text: q.text,
                    answer: q.answer,
                    pointValue: q.pointValue,
                    isQuotation: q.isQuotation,
                    scriptureReference: q.scriptureReference,
                    books: q.books,
                    season: q.season,
                    analysis: config.includeMetadata ? q.analysis : undefined,
                })),
            },
            null,
            2
        );

        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${config.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExportCSV = () => {
        const headers = [
            'Question ID',
            'Point Value',
            'Type',
            'Scripture Reference',
            'Books',
            'Question Text',
            'Answer',
            ...(config.includeMetadata
                ? [
                      'Unique Words',
                      'Total Words',
                      'Complexity',
                      'Rare Words',
                  ]
                : []),
        ];

        const rows = result.questions.map(q => [
            q.id,
            q.pointValue,
            q.isQuotation ? 'Quotation' : 'Regular',
            q.scriptureReference,
            q.books.join('; '),
            `"${q.text.replace(/"/g, '""')}"`,
            `"${q.answer.replace(/"/g, '""')}"`,
            ...(config.includeMetadata
                ? [
                      q.analysis.uniqueWordCount,
                      q.analysis.totalWordCount,
                      q.analysis.complexityScore,
                      q.analysis.rareWords.join('; '),
                  ]
                : []),
        ]);

        const csv =
            [headers, ...rows]
                .map(row => row.map(cell => (typeof cell === 'string' ? cell : cell)).join(','))
                .join('\n') + '\n';

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${config.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="practice-set-preview">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2">{config.name}</h2>
                {config.description && (
                    <p className="text-gray-600">{config.description}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                    Generated: {new Date(result.metadata.generatedAt).toLocaleString()}
                </p>
            </div>

            {/* Analytics Section */}
            {showAnalytics && (
                <div className="card bg-base-100 shadow mb-6">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="card-title">Analytics</h3>
                            <button
                                className="btn btn-sm btn-ghost"
                                onClick={() => setShowAnalytics(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <div className="text-2xl font-bold">
                                    {result.metadata.totalSelected}
                                </div>
                                <div className="text-sm text-gray-600">Questions Selected</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    {result.metadata.averageComplexity.toFixed(1)}
                                </div>
                                <div className="text-sm text-gray-600">Avg Complexity</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    {result.metadata.averageUniqueWords.toFixed(1)}
                                </div>
                                <div className="text-sm text-gray-600">Avg Unique Words</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    {result.metadata.totalMatched}
                                </div>
                                <div className="text-sm text-gray-600">Total Matched</div>
                            </div>
                        </div>

                        {/* Point Value Distribution */}
                        <div className="mt-6">
                            <h4 className="font-semibold mb-3">Point Value Distribution</h4>
                            <div className="flex flex-wrap gap-4">
                                {pointDistribution.map(dist => (
                                    <div key={dist.points} className="flex items-center gap-2">
                                        <div className="badge badge-lg badge-primary">
                                            {dist.points} pts
                                        </div>
                                        <div>
                                            {dist.count} questions ({dist.percentage}%)
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Section */}
            <div className="card bg-base-100 shadow mb-6">
                <div className="card-body">
                    <h3 className="card-title mb-4">Export Options</h3>
                    <div className="flex flex-wrap gap-2">
                        <button
                            className="btn btn-primary"
                            onClick={handleExportJSON}
                        >
                            📋 Export as JSON
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleExportCSV}
                        >
                            📊 Export as CSV/Excel
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handlePrint}
                        >
                            🖨️ Print / Save as PDF
                        </button>
                        <button
                            className="btn btn-outline"
                            onClick={() => setShowAnalytics(true)}
                        >
                            📈 Show Analytics
                        </button>
                    </div>
                </div>
            </div>

            {/* Questions Display - Two Column Layout */}
            <div className="mb-6">
                <h3 className="text-2xl font-bold mb-4">
                    Questions ({result.questions.length})
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2">
                    {result.questions.map((question, index) => (
                        <div
                            key={question.id}
                            className="border border-gray-300 p-4 bg-white print:break-inside-avoid print:page-break-inside-avoid"
                        >
                            {/* Header with Question Number and Points */}
                            <div className="mb-2 pb-2 border-b border-gray-200">
                                <p className="font-bold text-xs text-gray-700">
                                    Question: Question #{index + 1} for {question.pointValue} points
                                </p>
                            </div>

                            {/* Question Text */}
                            <div className="mb-3">
                                <p className="text-sm font-semibold text-gray-800">{question.text}</p>
                            </div>

                            {/* Answer */}
                            <div className="mb-3 text-sm bg-blue-50 p-2 rounded">
                                <p className="text-xs text-gray-800">{question.answer}</p>
                            </div>

                            {/* Scripture Reference and Metadata */}
                            <div className="text-xs text-gray-600 space-y-1">
                                {question.scriptureReference && (
                                    <p>
                                        <span className="font-semibold">Scripture:</span> {question.scriptureReference}
                                    </p>
                                )}
                                {question.isQuotation && (
                                    <p className="font-semibold text-purple-600">📖 Quotation Question</p>
                                )}
                            </div>

                            {/* Divider Line for PDF */}
                            <div className="mt-3 pt-3 border-t border-dashed border-gray-300 text-center">
                                <span className="text-xs text-gray-400">_____ 4 3 2 1 – 1 2 3 4 _____</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    .btn, .card {
                        display: none !important;
                    }
                    .practice-set-preview {
                        break-after: avoid;
                    }
                    .practice-set-preview h2,
                    .practice-set-preview h3 {
                        break-after: avoid;
                    }
                    .grid {
                        display: grid;
                    }
                }
            `}</style>
        </div>
    );
}
