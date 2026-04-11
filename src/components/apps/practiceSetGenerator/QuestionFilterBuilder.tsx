/**
 * Question Filter Builder Component
 * Allows creating complex filter rules for practice set generation
 */

import { useState } from 'react';
import type { FilterRule, FilterCondition } from 'types/PracticeSetGenerator';
import FilterConditionBuilder from './FilterConditionBuilder';

interface QuestionFilterBuilderProps {
    rules: FilterRule[];
    onAddRule: (rule: FilterRule) => void;
    onRemoveRule: (ruleId: string) => void;
    onClearRules: () => void;
}

export default function QuestionFilterBuilder({
    rules,
    onAddRule,
    onRemoveRule,
    onClearRules,
}: QuestionFilterBuilderProps) {
    const [ruleName, setRuleName] = useState('');
    const [ruleDescription, setRuleDescription] = useState('');
    const [conditions, setConditions] = useState<FilterCondition[]>([]);
    const [useOrLogic, setUseOrLogic] = useState(false);

    const handleAddCondition = (condition: FilterCondition) => {
        setConditions([...conditions, condition]);
    };

    const handleRemoveCondition = (index: number) => {
        setConditions(conditions.filter((_, i) => i !== index));
    };

    const handleCreateRule = () => {
        if (!ruleName.trim() || conditions.length === 0) {
            alert('Please enter a rule name and at least one condition');
            return;
        }

        const newRule: FilterRule = {
            id: `rule-${Date.now()}`,
            name: ruleName,
            description: ruleDescription,
            conditions,
            useOrLogic,
        };

        onAddRule(newRule);

        // Reset form
        setRuleName('');
        setRuleDescription('');
        setConditions([]);
        setUseOrLogic(false);
    };

    return (
        <div className="question-filter-builder">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Rule Builder Form */}
                <div className="lg:col-span-2">
                    <div className="card bg-base-100 shadow">
                        <div className="card-body">
                            <h2 className="card-title mb-4">Create Custom Filter Rule</h2>

                            {/* Rule Name */}
                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text font-semibold">Rule Name</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Complex Quotations"
                                    className="input input-bordered"
                                    value={ruleName}
                                    onChange={e => setRuleName(e.target.value)}
                                />
                            </div>

                            {/* Rule Description */}
                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text font-semibold">Description (optional)</span>
                                </label>
                                <textarea
                                    placeholder="Describe what this rule filters for..."
                                    className="textarea textarea-bordered"
                                    value={ruleDescription}
                                    onChange={e => setRuleDescription(e.target.value)}
                                />
                            </div>

                            {/* Conditions */}
                            <div className="divider">Filter Conditions</div>
                            <FilterConditionBuilder onAddCondition={handleAddCondition} />

                            {/* Display Current Conditions */}
                            {conditions.length > 0 && (
                                <div className="mt-4">
                                    <div className="text-sm font-semibold mb-2">
                                        Current Conditions ({conditions.length}):
                                    </div>
                                    <div className="space-y-2">
                                        {conditions.map((condition, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between bg-gray-100 p-3 rounded"
                                            >
                                                <div className="text-sm font-mono">
                                                    {renderConditionText(condition)}
                                                </div>
                                                <button
                                                    className="btn btn-xs btn-error"
                                                    onClick={() => handleRemoveCondition(index)}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Logic Mode */}
                            {conditions.length > 1 && (
                                <div className="form-control mt-4">
                                    <label className="label cursor-pointer">
                                        <span className="label-text">
                                            Combine with OR logic (instead of AND)
                                        </span>
                                        <input
                                            type="checkbox"
                                            className="checkbox"
                                            checked={useOrLogic}
                                            onChange={e => setUseOrLogic(e.target.checked)}
                                        />
                                    </label>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="card-actions justify-end mt-6">
                                <button
                                    className="btn btn-primary"
                                    onClick={handleCreateRule}
                                    disabled={!ruleName.trim() || conditions.length === 0}
                                >
                                    Add Filter Rule
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Rules Sidebar */}
                <div className="lg:col-span-1">
                    <div className="card bg-base-100 shadow">
                        <div className="card-body">
                            <h2 className="card-title text-lg mb-4">Active Rules ({rules.length})</h2>

                            {rules.length === 0 ? (
                                <p className="text-gray-500 text-sm">No rules created yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {rules.map(rule => (
                                        <div
                                            key={rule.id}
                                            className="p-3 bg-gray-50 rounded border border-gray-200"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-sm">{rule.name}</h4>
                                                    {rule.description && (
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            {rule.description}
                                                        </p>
                                                    )}
                                                    <div className="text-xs text-gray-500 mt-2">
                                                        {rule.conditions.length} condition(s)
                                                    </div>
                                                </div>
                                                <button
                                                    className="btn btn-xs btn-error ml-2"
                                                    onClick={() => onRemoveRule(rule.id)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {rules.length > 0 && (
                                        <button
                                            className="btn btn-sm btn-outline w-full mt-4"
                                            onClick={onClearRules}
                                        >
                                            Clear All Rules
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function renderConditionText(condition: FilterCondition): string {
    switch (condition.type) {
        case 'uniqueWordCount':
            const uwcVal = Array.isArray(condition.value)
                ? `${condition.value[0]}-${condition.value[1]}`
                : condition.value;
            return `Unique words ${condition.operator} ${uwcVal}`;
        case 'startingWith':
            return `Starts with: ${condition.phrases.join(' or ')}`;
        case 'wordFrequency':
            return `Contains ${condition.mode} words`;
        case 'questionLength':
            const qlVal = Array.isArray(condition.value)
                ? `${condition.value[0]}-${condition.value[1]}`
                : condition.value;
            return `Length ${condition.operator} ${qlVal} words`;
        case 'complexity':
            const cVal = Array.isArray(condition.value)
                ? `${condition.value[0]}-${condition.value[1]}`
                : condition.value;
            return `Complexity ${condition.operator} ${cVal}`;
        case 'pointValue':
            return `Point values: ${condition.values.join(', ')}`;
        case 'pattern':
            return `Regex: /${condition.regex}/`;
        case 'scriptureReference':
            return `Books: ${condition.books.join(', ')}`;
        default:
            return 'Unknown condition';
    }
}
