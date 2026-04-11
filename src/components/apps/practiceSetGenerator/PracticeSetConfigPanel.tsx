/**
 * Practice Set Configuration Panel
 * Allows configuring output options and export settings
 */

import { useState } from 'react';
import type { PracticeSetConfig } from 'types/PracticeSetGenerator';

interface PracticeSetConfigPanelProps {
    config: PracticeSetConfig;
    onChange: (config: PracticeSetConfig) => void;
}

export default function PracticeSetConfigPanel({ config, onChange }: PracticeSetConfigPanelProps) {
    const [expanded, setExpanded] = useState(false);

    const handleChange = (updates: Partial<PracticeSetConfig>) => {
        onChange({ ...config, ...updates });
    };

    return (
        <div className="collapse collapse-arrow border border-base-300 mb-4">
            <input
                type="checkbox"
                checked={expanded}
                onChange={e => setExpanded(e.target.checked)}
            />
            <div className="collapse-title font-semibold">⚙️ Advanced Settings</div>
            <div className="collapse-content">
                <div className="space-y-4">
                    {/* Set Name */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-semibold">Practice Set Name</span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered"
                            value={config.name}
                            onChange={e => handleChange({ name: e.target.value })}
                        />
                    </div>

                    {/* Description */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-semibold">Description (optional)</span>
                        </label>
                        <textarea
                            className="textarea textarea-bordered"
                            value={config.description || ''}
                            onChange={e => handleChange({ description: e.target.value })}
                            placeholder="E.g., Practice set for advanced learners"
                        />
                    </div>

                    <div className="divider">Output Options</div>

                    {/* Max Questions */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-semibold">Maximum Questions</span>
                            <span className="label-text-alt text-gray-500">
                                (leave blank for all)
                            </span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            className="input input-bordered"
                            value={config.maxQuestions || ''}
                            onChange={e =>
                                handleChange({
                                    maxQuestions: e.target.value ? parseInt(e.target.value) : undefined,
                                })
                            }
                        />
                    </div>

                    {/* Sorting */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-semibold">Sort Questions By</span>
                        </label>
                        <select
                            className="select select-bordered"
                            value={config.sortBy || 'questionId'}
                            onChange={e =>
                                handleChange({
                                    sortBy: e.target.value as any,
                                })
                            }
                        >
                            <option value="questionId">Question ID</option>
                            <option value="pointValue">Point Value (highest first)</option>
                            <option value="complexity">Complexity (most complex first)</option>
                            <option value="random">Random</option>
                        </select>
                    </div>

                    {/* Randomization */}
                    {config.maxQuestions && config.maxQuestions > 0 && (
                        <>
                            <label className="label cursor-pointer">
                                <span className="label-text">Randomize selection</span>
                                <input
                                    type="checkbox"
                                    className="checkbox"
                                    checked={config.randomize || false}
                                    onChange={e => handleChange({ randomize: e.target.checked })}
                                />
                            </label>

                            {config.randomize && (
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text text-sm">
                                            Random Seed (for reproducibility)
                                        </span>
                                    </label>
                                    <input
                                        type="number"
                                        className="input input-bordered input-sm"
                                        value={config.randomSeed || ''}
                                        onChange={e =>
                                            handleChange({
                                                randomSeed: e.target.value
                                                    ? parseInt(e.target.value)
                                                    : undefined,
                                            })
                                        }
                                        placeholder="Leave blank for random"
                                    />
                                </div>
                            )}
                        </>
                    )}

                    <div className="divider">PDF Export Options</div>

                    {/* PDF Layout */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-semibold">PDF Layout</span>
                        </label>
                        <select
                            className="select select-bordered"
                            value={config.exportFormat?.pdfLayout || 'standard'}
                            onChange={e =>
                                handleChange({
                                    exportFormat: {
                                        ...config.exportFormat,
                                        pdfLayout: e.target.value as any,
                                    },
                                })
                            }
                        >
                            <option value="compact">Compact (more questions per page)</option>
                            <option value="standard">Standard (balanced)</option>
                            <option value="detailed">Detailed (more whitespace)</option>
                        </select>
                    </div>

                    {/* Include Solutions */}
                    <label className="label cursor-pointer">
                        <span className="label-text">Include answer key/solutions</span>
                        <input
                            type="checkbox"
                            className="checkbox"
                            checked={config.exportFormat?.includeSolution || false}
                            onChange={e =>
                                handleChange({
                                    exportFormat: {
                                        ...config.exportFormat,
                                        includeSolution: e.target.checked,
                                    },
                                })
                            }
                        />
                    </label>

                    {/* Include Metadata */}
                    <label className="label cursor-pointer">
                        <span className="label-text">Include question metadata (complexity, word count)</span>
                        <input
                            type="checkbox"
                            className="checkbox"
                            checked={config.includeMetadata || false}
                            onChange={e => handleChange({ includeMetadata: e.target.checked })}
                        />
                    </label>
                </div>
            </div>
        </div>
    );
}
