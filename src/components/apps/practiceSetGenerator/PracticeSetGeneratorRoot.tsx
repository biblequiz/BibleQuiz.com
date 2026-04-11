/**
 * Practice Set Generator - Main Root Component
 * Advanced filtering for generating custom practice question sets
 */

import { useEffect, useState } from 'react';
import type {
    Question,
    FilterRule,
    PracticeSetConfig,
    PracticeSetResult,
} from 'types/PracticeSetGenerator';
import { generatePracticeSet } from 'utils/questionFiltering';
import QuestionFilterBuilder from './QuestionFilterBuilder';
import PracticeSetPreview from './PracticeSetPreview';
import PracticeSetConfigPanel from './PracticeSetConfigPanel';
import TemplateSelector from './TemplateSelector';

export interface PracticeSetGeneratorRootProps {
    questions: Question[];
}

type TabType = 'templates' | 'custom' | 'preview';

export default function PracticeSetGeneratorRoot({ questions }: PracticeSetGeneratorRootProps) {
    const [activeTab, setActiveTab] = useState<TabType>('templates');
    const [filterRules, setFilterRules] = useState<FilterRule[]>([]);
    const [practiceSetConfig, setPracticeSetConfig] = useState<PracticeSetConfig>({
        name: 'My Practice Set',
        description: '',
        filterRules: [],
    });
    const [result, setResult] = useState<PracticeSetResult | null>(null);

    // Check if questions loaded
    if (questions.length === 0) {
        return (
            <div className="alert alert-error">
                <div>
                    <h3 className="font-bold">❌ No Questions Loaded</h3>
                    <p className="text-sm">
                        The practice set generator couldn't load questions. Please run:
                    </p>
                    <code className="text-xs bg-gray-900 text-white p-2 rounded mt-2 block">
                        npm run process-questions
                    </code>
                    <p className="text-sm mt-2">
                        Then restart your dev server with: <code className="bg-gray-900 text-white px-1">npm run dev</code>
                    </p>
                </div>
            </div>
        );
    }

    // Generate practice set when rules change
    useEffect(() => {
        if (filterRules.length > 0) {
            const config = { ...practiceSetConfig, filterRules };
            const newResult = generatePracticeSet(questions, config);
            setResult(newResult);
        }
    }, [filterRules, questions]);

    const handleTemplateSelect = (template: any) => {
        const newRules: FilterRule[] = [
            {
                id: `rule-${Date.now()}`,
                name: template.name,
                description: template.description,
                conditions: template.conditions,
            },
        ];
        setFilterRules(newRules);
        setPracticeSetConfig(prev => ({
            ...prev,
            name: template.name,
            filterRules: newRules,
            maxQuestions: template.maxQuestions ?? undefined,
            randomize: template.randomize ?? false,
            sortBy: template.randomize ? 'random' : 'questionId',
            randomSeed: template.randomize ? Date.now() : undefined,
        }));
        setActiveTab('preview');
    };

    const handleAddRule = (rule: FilterRule) => {
        const newRules = [...filterRules, rule];
        setFilterRules(newRules);
    };

    const handleRemoveRule = (ruleId: string) => {
        const newRules = filterRules.filter(r => r.id !== ruleId);
        setFilterRules(newRules);
    };

    const handleConfigUpdate = (config: PracticeSetConfig) => {
        setPracticeSetConfig(config);
        if (config.filterRules.length > 0) {
            const newResult = generatePracticeSet(questions, config);
            setResult(newResult);
        }
    };

    const handleClearRules = () => {
        setFilterRules([]);
        setResult(null);
        setPracticeSetConfig(prev => ({
            ...prev,
            name: 'My Practice Set',
            filterRules: [],
        }));
    };

    return (
        <div className="practice-set-generator space-y-6">
            {/* Tabs Navigation */}
            <div role="tablist" className="tabs tabs-bordered">
                <input
                    type="radio"
                    name="generator_tabs"
                    role="tab"
                    className="tab"
                    aria-label="Predefined Templates"
                    checked={activeTab === 'templates'}
                    onChange={() => setActiveTab('templates')}
                />
                <div role="tabpanel" className="tab-content p-4">
                    {activeTab === 'templates' && (
                        <TemplateSelector onSelectTemplate={handleTemplateSelect} />
                    )}
                </div>

                <input
                    type="radio"
                    name="generator_tabs"
                    role="tab"
                    className="tab"
                    aria-label="Custom Filters"
                    checked={activeTab === 'custom'}
                    onChange={() => setActiveTab('custom')}
                />
                <div role="tabpanel" className="tab-content p-4">
                    {activeTab === 'custom' && (
                        <QuestionFilterBuilder
                            rules={filterRules}
                            onAddRule={handleAddRule}
                            onRemoveRule={handleRemoveRule}
                            onClearRules={handleClearRules}
                        />
                    )}
                </div>

                <input
                    type="radio"
                    name="generator_tabs"
                    role="tab"
                    className="tab"
                    aria-label={`Preview & Export${result ? ` (${result.questions.length})` : ''}`}
                    checked={activeTab === 'preview'}
                    onChange={() => setActiveTab('preview')}
                    disabled={!result}
                />
                <div role="tabpanel" className="tab-content p-4">
                    {activeTab === 'preview' && result && (
                        <div>
                            <PracticeSetConfigPanel
                                config={practiceSetConfig}
                                onChange={handleConfigUpdate}
                            />
                            <PracticeSetPreview result={result} config={practiceSetConfig} />
                        </div>
                    )}
                    {activeTab === 'preview' && !result && (
                        <div className="alert alert-info">
                            <span>Create custom filters or select a template to preview results.</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Info Section */}
            {result && (
                <div className="info-section">
                    <div className="stats shadow w-full">
                        <div className="stat">
                            <div className="stat-title">Total Questions</div>
                            <div className="stat-value">{result.metadata.totalMatched}</div>
                        </div>
                        <div className="stat">
                            <div className="stat-title">Selected</div>
                            <div className="stat-value text-primary">{result.metadata.totalSelected}</div>
                        </div>
                        <div className="stat">
                            <div className="stat-title">Avg Complexity</div>
                            <div className="stat-value">
                                {result.metadata.averageComplexity.toFixed(1)}
                            </div>
                        </div>
                        <div className="stat">
                            <div className="stat-title">Avg Unique Words</div>
                            <div className="stat-value">
                                {result.metadata.averageUniqueWords.toFixed(1)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
