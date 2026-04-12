/**
 * Filter Condition Builder Component
 * Creates individual filter conditions
 */

import { useState } from 'react';
import type { FilterCondition } from 'types/PracticeSetGenerator';

interface FilterConditionBuilderProps {
    onAddCondition: (condition: FilterCondition) => void;
}

type ConditionType =
    | 'uniqueWordCount'
    | 'startingWith'
    | 'wordFrequency'
    | 'questionLength'
    | 'complexity'
    | 'pointValue'
    | 'pattern'
    | 'scriptureReference';

export default function FilterConditionBuilder({ onAddCondition }: FilterConditionBuilderProps) {
    const [conditionType, setConditionType] = useState<ConditionType>('uniqueWordCount');

    const handleAddCondition = (condition: FilterCondition) => {
        onAddCondition(condition);
    };

    return (
        <div className="filter-condition-builder">
            {/* Condition Type Selector */}
            <div className="form-control mb-4">
                <label className="label">
                    <span className="label-text font-semibold">Select Condition Type</span>
                </label>
                <select
                    className="select select-bordered"
                    value={conditionType}
                    onChange={e => setConditionType(e.target.value as ConditionType)}
                >
                    <option value="uniqueWordCount">Unique Word Count</option>
                    <option value="startingWith">Question Starting Phrase</option>
                    <option value="wordFrequency">Word Frequency</option>
                    <option value="questionLength">Question Length (Total Words)</option>
                    <option value="complexity">Complexity Score</option>
                    <option value="pointValue">Point Value</option>
                    <option value="pattern">Text Pattern (Regex)</option>
                    <option value="scriptureReference">Scripture Reference</option>
                </select>
            </div>

            {/* Condition-Specific Builders */}
            {conditionType === 'uniqueWordCount' && (
                <UniqueWordCountBuilder onAddCondition={handleAddCondition} />
            )}
            {conditionType === 'startingWith' && (
                <StartingWithBuilder onAddCondition={handleAddCondition} />
            )}
            {conditionType === 'wordFrequency' && (
                <WordFrequencyBuilder onAddCondition={handleAddCondition} />
            )}
            {conditionType === 'questionLength' && (
                <QuestionLengthBuilder onAddCondition={handleAddCondition} />
            )}
            {conditionType === 'complexity' && (
                <ComplexityBuilder onAddCondition={handleAddCondition} />
            )}
            {conditionType === 'pointValue' && (
                <PointValueBuilder onAddCondition={handleAddCondition} />
            )}
            {conditionType === 'pattern' && (
                <PatternBuilder onAddCondition={handleAddCondition} />
            )}
            {conditionType === 'scriptureReference' && (
                <ScriptureReferenceBuilder onAddCondition={handleAddCondition} />
            )}
        </div>
    );
}

/* Unique Word Count Builder */
function UniqueWordCountBuilder({ onAddCondition }: { onAddCondition: (c: FilterCondition) => void }) {
    const [operator, setOperator] = useState<'equals' | 'lessThan' | 'greaterThan' | 'between'>(
        'greaterThan'
    );
    const [value, setValue] = useState('3');
    const [min, setMin] = useState('3');
    const [max, setMax] = useState('10');

    return (
        <div className="space-y-3 p-3 bg-gray-50 rounded">
            <div className="form-control">
                <label className="label">
                    <span className="label-text">Operator</span>
                </label>
                <select
                    className="select select-sm select-bordered"
                    value={operator}
                    onChange={e => setOperator(e.target.value as any)}
                >
                    <option value="equals">Equals</option>
                    <option value="lessThan">Less Than</option>
                    <option value="greaterThan">Greater Than</option>
                    <option value="between">Between</option>
                </select>
            </div>

            {operator === 'between' ? (
                <>
                    <input
                        type="number"
                        min="1"
                        placeholder="Minimum"
                        className="input input-sm input-bordered w-full"
                        value={min}
                        onChange={e => setMin(e.target.value)}
                    />
                    <input
                        type="number"
                        min="1"
                        placeholder="Maximum"
                        className="input input-sm input-bordered w-full"
                        value={max}
                        onChange={e => setMax(e.target.value)}
                    />
                </>
            ) : (
                <input
                    type="number"
                    min="1"
                    placeholder="Value"
                    className="input input-sm input-bordered w-full"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                />
            )}

            <button
                className="btn btn-sm btn-accent w-full"
                onClick={() =>
                    onAddCondition({
                        type: 'uniqueWordCount',
                        operator,
                        value: operator === 'between' ? [parseInt(min), parseInt(max)] : parseInt(value),
                    })
                }
            >
                Add Condition
            </button>
        </div>
    );
}

/* Starting With Builder */
function StartingWithBuilder({ onAddCondition }: { onAddCondition: (c: FilterCondition) => void }) {
    const [phrases, setPhrases] = useState('What are');
    const [matchType, setMatchType] = useState<'exact' | 'contains'>('exact');
    const [caseSensitive, setCaseSensitive] = useState(false);

    return (
        <div className="space-y-3 p-3 bg-gray-50 rounded">
            <div className="form-control">
                <label className="label">
                    <span className="label-text">Phrases (comma-separated)</span>
                </label>
                <input
                    type="text"
                    placeholder="e.g., What are, How many, Who was"
                    className="input input-sm input-bordered"
                    value={phrases}
                    onChange={e => setPhrases(e.target.value)}
                />
            </div>

            <div className="form-control">
                <label className="label">
                    <span className="label-text">Match Type</span>
                </label>
                <select
                    className="select select-sm select-bordered"
                    value={matchType}
                    onChange={e => setMatchType(e.target.value as any)}
                >
                    <option value="exact">Starts With (Exact)</option>
                    <option value="contains">Contains Phrase</option>
                </select>
            </div>

            <label className="label cursor-pointer">
                <span className="label-text">Case Sensitive</span>
                <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={caseSensitive}
                    onChange={e => setCaseSensitive(e.target.checked)}
                />
            </label>

            <button
                className="btn btn-sm btn-accent w-full"
                onClick={() =>
                    onAddCondition({
                        type: 'startingWith',
                        phrases: phrases.split(',').map(p => p.trim()),
                        matchType,
                        caseSensitive,
                    })
                }
            >
                Add Condition
            </button>
        </div>
    );
}

/* Word Frequency Builder */
function WordFrequencyBuilder({ onAddCondition }: { onAddCondition: (c: FilterCondition) => void }) {
    const [mode, setMode] = useState<'rareWords' | 'hardsWords' | 'commonWords'>('rareWords');
    const [minimumCount, setMinimumCount] = useState('1');

    return (
        <div className="space-y-3 p-3 bg-gray-50 rounded">
            <div className="form-control">
                <label className="label">
                    <span className="label-text">Word Type</span>
                </label>
                <select
                    className="select select-sm select-bordered"
                    value={mode}
                    onChange={e => setMode(e.target.value as any)}
                >
                    <option value="rareWords">Rare Words (appear in &lt;10% of questions)</option>
                    <option value="hardsWords">Hard Words (complex vocabulary)</option>
                    <option value="commonWords">Common Words (appear in &gt;50% of questions)</option>
                </select>
            </div>

            <input
                type="number"
                min="1"
                placeholder="Minimum count"
                className="input input-sm input-bordered w-full"
                value={minimumCount}
                onChange={e => setMinimumCount(e.target.value)}
            />

            <button
                className="btn btn-sm btn-accent w-full"
                onClick={() =>
                    onAddCondition({
                        type: 'wordFrequency',
                        mode,
                        minimumRareWordCount: parseInt(minimumCount),
                    })
                }
            >
                Add Condition
            </button>
        </div>
    );
}

/* Question Length Builder */
function QuestionLengthBuilder({ onAddCondition }: { onAddCondition: (c: FilterCondition) => void }) {
    const [operator, setOperator] = useState<'equals' | 'lessThan' | 'greaterThan' | 'between'>(
        'between'
    );
    const [value, setValue] = useState('30');
    const [min, setMin] = useState('20');
    const [max, setMax] = useState('40');

    return (
        <div className="space-y-3 p-3 bg-gray-50 rounded">
            <div className="form-control">
                <label className="label">
                    <span className="label-text">Operator</span>
                </label>
                <select
                    className="select select-sm select-bordered"
                    value={operator}
                    onChange={e => setOperator(e.target.value as any)}
                >
                    <option value="equals">Equals</option>
                    <option value="lessThan">Less Than</option>
                    <option value="greaterThan">Greater Than</option>
                    <option value="between">Between</option>
                </select>
            </div>

            {operator === 'between' ? (
                <>
                    <input
                        type="number"
                        min="1"
                        placeholder="Minimum words"
                        className="input input-sm input-bordered w-full"
                        value={min}
                        onChange={e => setMin(e.target.value)}
                    />
                    <input
                        type="number"
                        min="1"
                        placeholder="Maximum words"
                        className="input input-sm input-bordered w-full"
                        value={max}
                        onChange={e => setMax(e.target.value)}
                    />
                </>
            ) : (
                <input
                    type="number"
                    min="1"
                    placeholder="Word count"
                    className="input input-sm input-bordered w-full"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                />
            )}

            <button
                className="btn btn-sm btn-accent w-full"
                onClick={() =>
                    onAddCondition({
                        type: 'questionLength',
                        operator,
                        value: operator === 'between' ? [parseInt(min), parseInt(max)] : parseInt(value),
                    })
                }
            >
                Add Condition
            </button>
        </div>
    );
}

/* Complexity Builder */
function ComplexityBuilder({ onAddCondition }: { onAddCondition: (c: FilterCondition) => void }) {
    const [operator, setOperator] = useState<'equals' | 'lessThan' | 'greaterThan' | 'between'>(
        'greaterThan'
    );
    const [value, setValue] = useState('60');
    const [min, setMin] = useState('50');
    const [max, setMax] = useState('100');

    return (
        <div className="space-y-3 p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-600 mb-2">Complexity: 0 (very simple) to 100 (very complex)</p>
            <div className="form-control">
                <label className="label">
                    <span className="label-text">Operator</span>
                </label>
                <select
                    className="select select-sm select-bordered"
                    value={operator}
                    onChange={e => setOperator(e.target.value as any)}
                >
                    <option value="equals">Equals</option>
                    <option value="lessThan">Less Than</option>
                    <option value="greaterThan">Greater Than</option>
                    <option value="between">Between</option>
                </select>
            </div>

            {operator === 'between' ? (
                <>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Minimum"
                        className="input input-sm input-bordered w-full"
                        value={min}
                        onChange={e => setMin(e.target.value)}
                    />
                    <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Maximum"
                        className="input input-sm input-bordered w-full"
                        value={max}
                        onChange={e => setMax(e.target.value)}
                    />
                </>
            ) : (
                <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Score"
                    className="input input-sm input-bordered w-full"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                />
            )}

            <button
                className="btn btn-sm btn-accent w-full"
                onClick={() =>
                    onAddCondition({
                        type: 'complexity',
                        operator,
                        value: operator === 'between' ? [parseInt(min), parseInt(max)] : parseInt(value),
                    })
                }
            >
                Add Condition
            </button>
        </div>
    );
}

/* Point Value Builder */
function PointValueBuilder({ onAddCondition }: { onAddCondition: (c: FilterCondition) => void }) {
    const [values, setValues] = useState<(10 | 20 | 30)[]>([20, 30]);
    const [includeQuotes, setIncludeQuotes] = useState(true);

    const toggleValue = (val: 10 | 20 | 30) => {
        setValues(
            values.includes(val) ? values.filter(v => v !== val) : [...values, val].sort((a, b) => a - b)
        );
    };

    return (
        <div className="space-y-3 p-3 bg-gray-50 rounded">
            <div>
                <label className="label">
                    <span className="label-text">Point Values</span>
                </label>
                <div className="flex gap-2">
                    {[10, 20, 30].map(val => (
                        <label key={val} className="label cursor-pointer">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-sm"
                                checked={values.includes(val as 10 | 20 | 30)}
                                onChange={() => toggleValue(val as 10 | 20 | 30)}
                            />
                            <span className="label-text ml-2">{val} pts</span>
                        </label>
                    ))}
                </div>
            </div>

            <label className="label cursor-pointer">
                <span className="label-text">Allow quotation questions</span>
                <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={includeQuotes}
                    onChange={e => setIncludeQuotes(e.target.checked)}
                />
            </label>

            <button
                className="btn btn-sm btn-accent w-full"
                disabled={values.length === 0}
                onClick={() =>
                    onAddCondition({
                        type: 'pointValue',
                        values,
                        includeQuotes,
                    })
                }
            >
                Add Condition
            </button>
        </div>
    );
}

/* Pattern/Regex Builder */
function PatternBuilder({ onAddCondition }: { onAddCondition: (c: FilterCondition) => void }) {
    const [pattern, setPattern] = useState('');
    const [caseSensitive, setCaseSensitive] = useState(false);

    return (
        <div className="space-y-3 p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-600 mb-2">Enter a regular expression pattern</p>
            <input
                type="text"
                placeholder="e.g., ^(What|Why|How) are"
                className="input input-sm input-bordered w-full font-mono"
                value={pattern}
                onChange={e => setPattern(e.target.value)}
            />

            <label className="label cursor-pointer">
                <span className="label-text">Case Sensitive</span>
                <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={caseSensitive}
                    onChange={e => setCaseSensitive(e.target.checked)}
                />
            </label>

            <button
                className="btn btn-sm btn-accent w-full"
                disabled={!pattern}
                onClick={() =>
                    onAddCondition({
                        type: 'pattern',
                        regex: pattern,
                        caseSensitive,
                    })
                }
            >
                Add Condition
            </button>
        </div>
    );
}

/* Scripture Reference Builder */
function ScriptureReferenceBuilder({
    onAddCondition,
}: {
    onAddCondition: (c: FilterCondition) => void;
}) {
    const [books, setBooks] = useState('');
    const [matchMode, setMatchMode] = useState<'anyBook' | 'allBooks'>('anyBook');

    const commonBooks = [
        'Genesis',
        'Exodus',
        'Matthew',
        'Mark',
        'Luke',
        'John',
        'Romans',
        'Psalms',
        'Isaiah',
    ];

    return (
        <div className="space-y-3 p-3 bg-gray-50 rounded">
            <div className="form-control">
                <label className="label">
                    <span className="label-text">Books (comma-separated)</span>
                </label>
                <input
                    type="text"
                    placeholder="e.g., Genesis, Exodus, John"
                    className="input input-sm input-bordered"
                    value={books}
                    onChange={e => setBooks(e.target.value)}
                />
            </div>

            <div className="text-xs mb-2">Quick select:</div>
            <div className="flex flex-wrap gap-1">
                {commonBooks.map(book => (
                    <button
                        key={book}
                        className="btn btn-xs btn-outline"
                        onClick={() =>
                            setBooks(
                                books
                                    .split(',')
                                    .map(b => b.trim())
                                    .includes(book)
                                        ? books
                                              .split(',')
                                              .map(b => b.trim())
                                              .filter(b => b !== book)
                                              .join(', ')
                                        : [
                                              ...books
                                                  .split(',')
                                                  .map(b => b.trim())
                                                  .filter(b => b),
                                              book,
                                          ].join(', ')
                            )
                        }
                    >
                        {book}
                    </button>
                ))}
            </div>

            <div className="form-control">
                <label className="label">
                    <span className="label-text">Match Mode</span>
                </label>
                <select
                    className="select select-sm select-bordered"
                    value={matchMode}
                    onChange={e => setMatchMode(e.target.value as any)}
                >
                    <option value="anyBook">Contains Any Book</option>
                    <option value="allBooks">Contains All Books</option>
                </select>
            </div>

            <button
                className="btn btn-sm btn-accent w-full"
                disabled={!books}
                onClick={() =>
                    onAddCondition({
                        type: 'scriptureReference',
                        books: books
                            .split(',')
                            .map(b => b.trim())
                            .filter(b => b),
                        matchMode,
                    })
                }
            >
                Add Condition
            </button>
        </div>
    );
}
