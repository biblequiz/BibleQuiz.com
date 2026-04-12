/**
 * Practice Set Preview Component
 * Displays generated questions and provides export options
 */

import { useState, useEffect } from 'react';
import type { PracticeSetResult, PracticeSetConfig } from 'types/PracticeSetGenerator';

interface PracticeSetPreviewProps {
    result: PracticeSetResult;
    config: PracticeSetConfig;
    onConfigChange?: (config: PracticeSetConfig) => void;
}

export default function PracticeSetPreview({ result, config, onConfigChange }: PracticeSetPreviewProps) {
    const [activePanel, setActivePanel] = useState<'settings' | 'analytics' | 'export' | null>(null);
    const [maxQuestions, setMaxQuestions] = useState<string>(config.maxQuestions?.toString() || '');
    const [boldQuestionText, setBoldQuestionText] = useState<boolean>(config.boldQuestionText || false);

    useEffect(() => {
        setMaxQuestions(config.maxQuestions?.toString() || '');
        setBoldQuestionText(config.boldQuestionText || false);
    }, [config.maxQuestions, config.boldQuestionText]);

    const pointDistribution = Object.entries(result.metadata.pointValueDistribution).map(
        ([points, count]) => ({
            points: parseInt(points),
            count,
            percentage: ((count / result.questions.length) * 100).toFixed(1),
        })
    );

    const handleMaxQuestionsChange = (value: string) => {
        setMaxQuestions(value);
        const numValue = value ? parseInt(value) : undefined;
        const updatedConfig = { ...config, maxQuestions: numValue };
        onConfigChange?.(updatedConfig);
    };

    const handleBoldQuestionTextChange = (value: boolean) => {
        setBoldQuestionText(value);
        const updatedConfig = { ...config, boldQuestionText: value };
        onConfigChange?.(updatedConfig);
    };



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
            {/* Title Bar with Icon Buttons */}
            <div className="screen-only sticky top-0 z-50 bg-white border-b border-gray-300 mb-4">
                <div className="flex items-start justify-between gap-4 p-3 md:p-4">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold">{config.name}</h2>
                        {config.description && (
                            <p className="text-xs md:text-sm text-gray-600">{config.description}</p>
                        )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <button
                            className={`btn btn-sm md:btn-md gap-2 ${activePanel === 'settings' ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setActivePanel(activePanel === 'settings' ? null : 'settings')}
                            title="Advanced Settings"
                        >
                            <span>⚙️</span>
                            <span className="hidden sm:inline text-xs">Settings</span>
                        </button>
                        <button
                            className={`btn btn-sm md:btn-md gap-2 ${activePanel === 'analytics' ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setActivePanel(activePanel === 'analytics' ? null : 'analytics')}
                            title="Analytics"
                        >
                            <span>📊</span>
                            <span className="hidden sm:inline text-xs">Analytics</span>
                        </button>
                        <button
                            className={`btn btn-sm md:btn-md gap-2 ${activePanel === 'export' ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setActivePanel(activePanel === 'export' ? null : 'export')}
                            title="Export Options"
                        >
                            <span>📤</span>
                            <span className="hidden sm:inline text-xs">Export</span>
                        </button>
                    </div>
                </div>

                {/* Settings Panel */}
                {activePanel === 'settings' && (
                    <div className="border-t border-gray-200 p-3 md:p-4 bg-base-50">
                        <div className="max-h-96 overflow-y-auto">
                            <h3 className="font-semibold mb-3">Advanced Settings</h3>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <p className="font-semibold text-gray-700">Set Name:</p>
                                    <p className="text-gray-600">{config.name}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-700">Description:</p>
                                    <p className="text-gray-600">{config.description || 'No description'}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-700">Max Questions:</p>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Leave blank for all"
                                        value={maxQuestions}
                                        onChange={(e) => handleMaxQuestionsChange(e.target.value)}
                                        className="input input-bordered input-sm w-full mt-1"
                                    />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-700">Sort By:</p>
                                    <p className="text-gray-600 capitalize">{config.sortBy || 'Question ID'}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-700">Randomize:</p>
                                    <p className="text-gray-600">{config.randomize ? 'Yes' : 'No'}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-700">PDF Layout:</p>
                                    <p className="text-gray-600 capitalize">{config.exportFormat?.pdfLayout || 'Compact'}</p>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={boldQuestionText}
                                            onChange={(e) => handleBoldQuestionTextChange(e.target.checked)}
                                            className="checkbox checkbox-sm"
                                        />
                                        <span className="font-semibold text-gray-700">Bold Question Text</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Analytics Panel */}
                {activePanel === 'analytics' && (
                    <div className="border-t border-gray-200 p-3 md:p-4 bg-base-50">
                        <div className="max-h-96 overflow-y-auto">
                            <h3 className="font-semibold mb-3">Analytics</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                <div>
                                    <div className="text-lg md:text-xl font-bold">
                                        {result.metadata.totalSelected}
                                    </div>
                                    <div className="text-xs text-gray-600">Questions Selected</div>
                                </div>
                                <div>
                                    <div className="text-lg md:text-xl font-bold">
                                        {result.metadata.averageComplexity.toFixed(1)}
                                    </div>
                                    <div className="text-xs text-gray-600">Avg Complexity</div>
                                </div>
                                <div>
                                    <div className="text-lg md:text-xl font-bold">
                                        {result.metadata.averageUniqueWords.toFixed(1)}
                                    </div>
                                    <div className="text-xs text-gray-600">Avg Unique Words</div>
                                </div>
                                <div>
                                    <div className="text-lg md:text-xl font-bold">
                                        {result.metadata.totalMatched}
                                    </div>
                                    <div className="text-xs text-gray-600">Total Matched</div>
                                </div>
                            </div>
                            <h4 className="font-semibold mb-2 text-sm">Point Value Distribution</h4>
                            <div className="flex flex-wrap gap-2">
                                {pointDistribution.map(dist => (
                                    <div key={dist.points} className="flex items-center gap-1">
                                        <div className="badge badge-sm badge-primary text-xs">
                                            {dist.points} pts
                                        </div>
                                        <div className="text-xs">
                                            {dist.count} ({dist.percentage}%)
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Export Panel */}
                {activePanel === 'export' && (
                    <div className="border-t border-gray-200 p-3 md:p-4 bg-base-50">
                        <h3 className="font-semibold mb-3">Export Options</h3>
                        <div className="flex flex-wrap gap-2">
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={handleExportJSON}
                            >
                                📋 JSON
                            </button>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={handleExportCSV}
                            >
                                📊 CSV
                            </button>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={handlePrint}
                            >
                                🖨️ Print/PDF
                            </button>
                        </div>
                        <p className="text-xs text-gray-600 mt-3">
                            Generated: {new Date(result.metadata.generatedAt).toLocaleString()}
                        </p>
                    </div>
                )}
            </div>

            {/* Questions Display - Responsive Compact Layout */}
            <div className="mb-6">
                <h3 className="text-xl md:text-2xl font-bold mb-4 screen-only">
                    Questions ({result.questions.length})
                </h3>

                {/* Screen Layout: Single column for mobile, 2-3 columns for desktop with compact spacing */}
                <div className="screen-layout grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                    {result.questions.map((question, index) => (
                        <div
                            key={question.id}
                            className="bg-white rounded p-2 md:p-3 hover:shadow-md transition-all break-inside-avoid shadow-sm"
                        >
                            {/* Compact Header */}
                            <div className="mb-2 pb-1">
                                <p className="text-xs font-bold text-gray-600">
                                    Q{index + 1} • {question.pointValue}pts
                                    {question.isQuotation && <span className="ml-1">📖</span>}
                                </p>
                            </div>

                            {/* Question Text - Compact */}
                            <div className="mb-2">
                                <p className={`text-xs md:text-sm leading-snug line-clamp-3 ${config.boldQuestionText ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                                    {question.text}
                                </p>
                            </div>

                            {/* Answer - Compact */}
                            <div className="mb-2 text-xs bg-blue-50 p-1.5 md:p-2 rounded border border-blue-100">
                                <p className="text-gray-700 leading-snug line-clamp-2">{question.answer}</p>
                            </div>

                            {/* Scripture Reference - Minimal */}
                            {question.scriptureReference && (
                                <p className="text-xs text-gray-600 truncate">
                                    Ref: {question.scriptureReference}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Print Layout: Optimized 2-column for 12-14 questions per page */}
                <style>{`
                    @media print {
                        .screen-layout {
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 0.15in;
                            grid-auto-rows: max-content;
                        }

                        .screen-layout > div {
                            page-break-inside: avoid;
                            break-inside: avoid;
                            padding: 0.15in;
                            margin: 0;
                            font-size: 9pt;
                            line-height: 1.2;
                        }

                        .screen-layout p {
                            margin: 0;
                            padding: 0;
                            line-height: 1.1;
                        }

                        .screen-layout > div > div:nth-child(1) {
                            margin-bottom: 0.04in;
                        }

                        .screen-layout > div > div:nth-child(2) {
                            margin-bottom: 0.06in;
                            margin-top: 0.04in;
                        }

                        .screen-layout > div > div:nth-child(3) {
                            margin-bottom: 0.06in;
                        }

                        .screen-layout > div > div:nth-child(4) {
                            background-color: #f0f4ff;
                            padding: 0.08in;
                            margin-bottom: 0.04in;
                        }

                        .screen-layout > div > p:last-child {
                            font-size: 8pt;
                            color: #666;
                            margin-top: 0.03in;
                        }
                    }
                `}</style>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    .btn, .card, .screen-only {
                        display: none !important;
                    }

                    body {
                        margin: 0.3in;
                        padding: 0;
                    }

                    .practice-set-preview {
                        margin: 0;
                        padding: 0;
                    }

                    .practice-set-preview h2 {
                        font-size: 16pt;
                        margin: 0 0 0.1in 0;
                        page-break-after: avoid;
                    }

                    .practice-set-preview h3 {
                        display: none;
                    }

                    .practice-set-preview > div:first-child {
                        margin-bottom: 0.15in;
                        page-break-after: avoid;
                    }

                    .practice-set-preview > div:first-child p {
                        margin: 0;
                        font-size: 10pt;
                    }
                }
            `}</style>
        </div>
    );
}
