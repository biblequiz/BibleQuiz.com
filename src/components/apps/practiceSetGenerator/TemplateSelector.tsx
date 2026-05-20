/**
 * Template Selector Component
 * Displays predefined filter templates for quick selection
 */

import { FILTER_RULE_TEMPLATES } from 'utils/questionFiltering';

interface TemplateSelectorProps {
    onSelectTemplate: (template: any) => void;
}

export default function TemplateSelector({ onSelectTemplate }: TemplateSelectorProps) {
    const templates = Object.entries(FILTER_RULE_TEMPLATES).map(([key, template]) => ({
        id: key,
        ...template,
    }));

    return (
        <div className="template-selector">
            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Predefined Templates</h2>
                <p className="text-gray-600">
                    Select a template to quickly generate a practice set with predefined filter rules.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(template => (
                    <div
                        key={template.id}
                        className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => onSelectTemplate(template)}
                    >
                        <div className="card-body">
                            <h3 className="card-title">{template.name}</h3>
                            <p className="text-sm text-gray-600">{template.description}</p>

                            <div className="mt-2 space-y-1">
                                {template.maxQuestions && (
                                    <div className="text-xs font-semibold text-blue-600">
                                        📋 Max Questions: {template.maxQuestions}
                                    </div>
                                )}
                                {template.randomize && (
                                    <div className="text-xs font-semibold text-green-600">
                                        🔀 Questions Randomized
                                    </div>
                                )}
                                <div className="text-xs font-semibold text-gray-500 uppercase mt-2">
                                    Filter Rules:
                                </div>
                                {template.conditions.map((condition: any, idx: number) => (
                                    <div key={idx} className="text-xs bg-gray-100 p-2 rounded">
                                        <span className="font-mono">
                                            {renderConditionPreview(condition)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="card-actions justify-end mt-4">
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => onSelectTemplate(template)}
                                >
                                    Use Template
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Reference */}
            <div className="mt-8 alert alert-info">
                <div>
                    <h4 className="font-bold">💡 Tip:</h4>
                    <p>
                        You can also create completely custom filter rules by clicking the "Custom Filters" tab
                        to combine multiple conditions like word count, phrase matching, and more.
                    </p>
                </div>
            </div>
        </div>
    );
}

function renderConditionPreview(condition: any): string {
    switch (condition.type) {
        case 'uniqueWordCount':
            return `Unique words ${condition.operator} ${
                Array.isArray(condition.value)
                    ? `${condition.value[0]}-${condition.value[1]}`
                    : condition.value
            }`;
        case 'startingWith':
            return `Starts with: ${condition.phrases.join(' or ')}`;
        case 'wordFrequency':
            return `Contains ${condition.mode} words`;
        case 'questionLength':
            return `Length ${condition.operator} ${
                Array.isArray(condition.value)
                    ? `${condition.value[0]}-${condition.value[1]}`
                    : condition.value
            } words`;
        case 'complexity':
            return `Complexity ${condition.operator} ${
                Array.isArray(condition.value)
                    ? `${condition.value[0]}-${condition.value[1]}`
                    : condition.value
            }`;
        case 'pointValue':
            return `Point values: ${condition.values.join(', ')}`;
        case 'pattern':
            return `Regex pattern: ${condition.regex}`;
        case 'scriptureReference':
            return `Scripture: ${condition.books.join(', ')}`;
        default:
            return 'Unknown condition';
    }
}
