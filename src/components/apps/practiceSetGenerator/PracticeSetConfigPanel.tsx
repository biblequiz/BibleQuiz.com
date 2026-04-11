/**
 * Practice Set Configuration Panel
 * Allows configuring output options and export settings
 */

import type { PracticeSetConfig } from 'types/PracticeSetGenerator';

interface PracticeSetConfigPanelProps {
    config: PracticeSetConfig;
    onChange: (config: PracticeSetConfig) => void;
}

export default function PracticeSetConfigPanel({ config, onChange }: PracticeSetConfigPanelProps) {
    const handleChange = (updates: Partial<PracticeSetConfig>) => {
        onChange({ ...config, ...updates });
    };

    return (
        <div className="screen-only mb-4 text-sm md:text-base">
            <div className="collapse collapse-arrow border border-base-300" tabIndex={0}>
                <input type="checkbox" />
                <div className="collapse-title font-semibold">⚙️ Advanced Settings</div>
                <div className="collapse-content p-3 md:p-4">
                    <div className="space-y-3 md:space-y-4">
                    {/* Set Name */}
                    <div className="form-control">
                        <label className="label py-2 md:py-3">
                            <span className="label-text text-sm md:text-base font-semibold">Practice Set Name</span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered input-sm md:input-md"
                            value={config.name}
                            onChange={e => handleChange({ name: e.target.value })}
                        />
                    </div>

                    {/* Description */}
                    <div className="form-control">
                        <label className="label py-2 md:py-3">
                            <span className="label-text text-sm md:text-base font-semibold">Description (optional)</span>
                        </label>
                        <textarea
                            className="textarea textarea-bordered textarea-sm md:textarea-md"
                            value={config.description || ''}
                            onChange={e => handleChange({ description: e.target.value })}
                            placeholder="E.g., Practice set for advanced learners"
                        />
                    </div>

                    <div className="divider my-2 md:my-3">Output Options</div>

                    {/* Max Questions */}
                    <div className="form-control">
                        <label className="label py-2">
                            <span className="label-text text-sm md:text-base font-semibold">Maximum Questions</span>
                            <span className="label-text-alt text-xs md:text-sm text-gray-500">
                                (leave blank for all)
                            </span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            className="input input-bordered input-sm md:input-md"
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
                        <label className="label py-2">
                            <span className="label-text text-sm md:text-base font-semibold">Sort Questions By</span>
                        </label>
                        <select
                            className="select select-bordered select-sm md:select-md"
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
                            <label className="label cursor-pointer py-2">
                                <span className="label-text text-sm md:text-base">Randomize selection</span>
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm md:checkbox-md"
                                    checked={config.randomize || false}
                                    onChange={e => handleChange({ randomize: e.target.checked })}
                                />
                            </label>

                            {config.randomize && (
                                <div className="form-control">
                                    <label className="label py-2">
                                        <span className="label-text text-xs md:text-sm">
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

                    <div className="divider my-2 md:my-3">PDF Export Options</div>

                    {/* PDF Layout */}
                    <div className="form-control">
                        <label className="label py-2">
                            <span className="label-text text-sm md:text-base font-semibold">PDF Layout</span>
                        </label>
                        <select
                            className="select select-bordered select-sm md:select-md"
                            value={config.exportFormat?.pdfLayout || 'compact'}
                            onChange={e =>
                                handleChange({
                                    exportFormat: {
                                        ...config.exportFormat,
                                        pdfLayout: e.target.value as any,
                                    },
                                })
                            }
                        >
                            <option value="compact">Compact (12-14 per page)</option>
                            <option value="standard">Standard (8-10 per page)</option>
                            <option value="detailed">Detailed (5-7 per page)</option>
                        </select>
                    </div>

                    {/* Include Solutions */}
                    <label className="label cursor-pointer py-2">
                        <span className="label-text text-sm md:text-base">Include answer key/solutions</span>
                        <input
                            type="checkbox"
                            className="checkbox checkbox-sm md:checkbox-md"
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
                    <label className="label cursor-pointer py-2">
                        <span className="label-text text-sm md:text-base">Include question metadata (complexity, word count)</span>
                        <input
                            type="checkbox"
                            className="checkbox checkbox-sm md:checkbox-md"
                            checked={config.includeMetadata || false}
                            onChange={e => handleChange({ includeMetadata: e.target.checked })}
                        />
                    </label>
                </div>
                </div>
            </div>
        </div>
    );
}
