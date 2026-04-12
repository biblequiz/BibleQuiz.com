/**
 * Question filtering utility for practice set generation
 */

import type {
    Question,
    FilterCondition,
    FilterRule,
    PracticeSetConfig,
    PracticeSetResult,
} from 'types/PracticeSetGenerator';

/**
 * Check if a question matches a single filter condition
 */
function matchesCondition(question: Question, condition: FilterCondition): boolean {
    switch (condition.type) {
        case 'uniqueWordCount':
            return matchesUniqueWordCount(question, condition);
        case 'startingWith':
            return matchesStartingWith(question, condition);
        case 'wordFrequency':
            return matchesWordFrequency(question, condition);
        case 'questionLength':
            return matchesQuestionLength(question, condition);
        case 'scriptureReference':
            return matchesScriptureReference(question, condition);
        case 'pattern':
            return matchesPattern(question, condition);
        case 'complexity':
            return matchesComplexity(question, condition);
        case 'pointValue':
            return matchesPointValue(question, condition);
        default:
            return true;
    }
}

function matchesUniqueWordCount(question: Question, condition: any): boolean {
    const count = question.analysis.uniqueWordCount;
    if (condition.operator === 'equals') {
        return count === condition.value;
    } else if (condition.operator === 'lessThan') {
        return count < condition.value;
    } else if (condition.operator === 'greaterThan') {
        return count > condition.value;
    } else if (condition.operator === 'between') {
        const [min, max] = condition.value;
        return count >= min && count <= max;
    }
    return false;
}

function matchesStartingWith(question: Question, condition: any): boolean {
    const phrase = condition.caseSensitive
        ? question.analysis.startsWithPhrase
        : question.analysis.startsWithPhrase.toLowerCase();

    return condition.phrases.some((p: string) => {
        const comparePhrase = condition.caseSensitive ? p : p.toLowerCase();
        if (condition.matchType === 'exact') {
            return phrase.startsWith(comparePhrase);
        } else {
            return phrase.includes(comparePhrase);
        }
    });
}

function matchesWordFrequency(question: Question, condition: any): boolean {
    const { mode, minimumRareWordCount = 1, excludeWords = [] } = condition;
    const excludeSet = new Set(excludeWords.map((w: string) => w.toLowerCase()));

    if (mode === 'rareWords') {
        const rareCount = question.analysis.rareWords.filter(
            w => !excludeSet.has(w.toLowerCase())
        ).length;
        return rareCount >= minimumRareWordCount;
    } else if (mode === 'hardsWords') {
        // Hard words: high frequency in the question but rare overall
        return question.analysis.rareWords.length > 0;
    } else if (mode === 'commonWords') {
        // Common words ratio
        const commonCount = question.analysis.uniqueWords.filter(
            w => !excludeSet.has(w.toLowerCase())
        ).length;
        return commonCount > question.analysis.uniqueWords.length / 2;
    }

    return false;
}

function matchesQuestionLength(question: Question, condition: any): boolean {
    const length = question.analysis.totalWordCount;
    if (condition.operator === 'equals') {
        return length === condition.value;
    } else if (condition.operator === 'lessThan') {
        return length < condition.value;
    } else if (condition.operator === 'greaterThan') {
        return length > condition.value;
    } else if (condition.operator === 'between') {
        const [min, max] = condition.value;
        return length >= min && length <= max;
    }
    return false;
}

function matchesScriptureReference(question: Question, condition: any): boolean {
    if (condition.matchMode === 'anyBook') {
        return condition.books.some((book: string) =>
            question.books.some(qb => qb.toLowerCase() === book.toLowerCase())
        );
    } else {
        return condition.books.every((book: string) =>
            question.books.some(qb => qb.toLowerCase() === book.toLowerCase())
        );
    }
}

function matchesPattern(question: Question, condition: any): boolean {
    try {
        const regex = new RegExp(condition.regex, condition.caseSensitive ? '' : 'i');
        return regex.test(question.text);
    } catch (e) {
        console.error('Invalid regex pattern:', condition.regex, e);
        return false;
    }
}

function matchesComplexity(question: Question, condition: any): boolean {
    const score = question.analysis.complexityScore;
    if (condition.operator === 'equals') {
        return score === condition.value;
    } else if (condition.operator === 'lessThan') {
        return score < condition.value;
    } else if (condition.operator === 'greaterThan') {
        return score > condition.value;
    } else if (condition.operator === 'between') {
        const [min, max] = condition.value;
        return score >= min && score <= max;
    }
    return false;
}

function matchesPointValue(question: Question, condition: any): boolean {
    const pointMatch = condition.values.includes(question.pointValue);
    if (condition.includeQuotes === undefined) {
        return pointMatch;
    }
    if (condition.includeQuotes) {
        return pointMatch; // Any quotation status is OK
    } else {
        return pointMatch && !question.isQuotation; // Only non-quotation
    }
}

/**
 * Check if a question matches a filter rule (all conditions must be true)
 */
function matchesRule(question: Question, rule: FilterRule): boolean {
    return rule.conditions.every(condition => matchesCondition(question, condition));
}

export function filterQuestions(
    questions: Question[],
    filterRules: FilterRule[]
): Question[] {
    if (filterRules.length === 0) {
        return questions;
    }

    return questions.filter(question => {
        let ruleMatch = matchesRule(question, filterRules[0]);

        // Apply additional rules with OR/AND logic
        for (let i = 1; i < filterRules.length; i++) {
            const nextRuleMatch = matchesRule(question, filterRules[i]);
            if (filterRules[i].useOrLogic) {
                ruleMatch = ruleMatch || nextRuleMatch;
            } else {
                ruleMatch = ruleMatch && nextRuleMatch;
            }
        }

        return ruleMatch;
    });
}

/**
 * Generate a practice set based on configuration
 */
export function generatePracticeSet(
    allQuestions: Question[],
    config: PracticeSetConfig
): PracticeSetResult {
    // Filter questions
    let filtered = filterQuestions(allQuestions, config.filterRules);

    // Apply sorting
    if (config.sortBy === 'pointValue') {
        filtered.sort((a, b) => b.pointValue - a.pointValue);
    } else if (config.sortBy === 'complexity') {
        filtered.sort((a, b) => b.analysis.complexityScore - a.analysis.complexityScore);
    } else if (config.sortBy === 'random') {
        const seed = config.randomSeed || Math.random();
        seededShuffle(filtered, seed);
    } else if (config.sortBy === 'questionId') {
        filtered.sort((a, b) => a.id - b.id);
    }

    // Apply max questions limit with point value randomization
    const maxQuestions = config.maxQuestions ?? -1;
    if (maxQuestions > 0 && filtered.length > maxQuestions) {
        if (config.randomize) {
            // Randomize while maintaining point value distribution
            const seed = config.randomSeed || Math.random();
            
            // Group by point value
            const byPointValue: Record<number, Question[]> = {};
            filtered.forEach(q => {
                if (!byPointValue[q.pointValue]) {
                    byPointValue[q.pointValue] = [];
                }
                byPointValue[q.pointValue].push(q);
            });
            
            // Shuffle each point value group
            Object.keys(byPointValue).forEach(pvStr => {
                const pv = parseInt(pvStr);
                seededShuffle(byPointValue[pv], seed + pv);
            });
            
            // Distribute questions evenly by point value
            const result: Question[] = [];
            let filled = true;
            while (filled && result.length < maxQuestions) {
                filled = false;
                for (const pvStr of Object.keys(byPointValue).sort()) {
                    const pv = parseInt(pvStr);
                    if (result.length < maxQuestions && byPointValue[pv].length > 0) {
                        result.push(byPointValue[pv].shift()!);
                        filled = true;
                    }
                }
            }
            filtered = result;
        } else {
            filtered = filtered.slice(0, maxQuestions);
        }
    }

    // Calculate metadata
    const pointValueDistribution: Record<number, number> = {};
    filtered.forEach(q => {
        pointValueDistribution[q.pointValue] = (pointValueDistribution[q.pointValue] || 0) + 1;
    });

    const averageComplexity =
        filtered.reduce((sum, q) => sum + q.analysis.complexityScore, 0) / filtered.length;
    const averageUniqueWords =
        filtered.reduce((sum, q) => sum + q.analysis.uniqueWordCount, 0) / filtered.length;

    return {
        questions: filtered,
        metadata: {
            totalMatched: filterQuestions(allQuestions, config.filterRules).length,
            totalSelected: filtered.length,
            rulesApplied: config.filterRules,
            generatedAt: new Date(),
            averageComplexity,
            averageUniqueWords,
            pointValueDistribution,
        },
    };
}

/**
 * Seeded shuffle using Fisher-Yates algorithm
 */
function seededShuffle<T>(array: T[], seed: number): void {
    let m = array.length;
    let random = seededRandom(seed);

    while (m) {
        const i = Math.floor(random() * m--);
        [array[m], array[i]] = [array[i], array[m]];
    }
}

/**
 * Seeded random number generator
 */
function seededRandom(seed: number) {
    return function () {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };
}

/**
 * Get filter rule template examples
 */
export const FILTER_RULE_TEMPLATES = {
    COMPLEX_QUESTIONS: {
        name: 'Complex Questions',
        description: 'Questions with high unique word count and complexity',
        maxQuestions: undefined,
        randomize: true,
        conditions: [
            {
                type: 'uniqueWordCount' as const,
                operator: 'greaterThan' as const,
                value: 5,
            },
            {
                type: 'complexity' as const,
                operator: 'greaterThan' as const,
                value: 60,
            },
        ],
    },

    WHAT_ARE_QUESTIONS: {
        name: '"What are..." Questions',
        description: 'All questions starting with "What are"',
        maxQuestions: undefined,
        randomize: true,
        conditions: [
            {
                type: 'startingWith' as const,
                phrases: ['What are'],
                caseSensitive: false,
                matchType: 'exact' as const,
            },
        ],
    },

    HOW_MANY_QUESTIONS: {
        name: '"How many/much..." Questions',
        description: 'Questions starting with "How many" or "How much"',
        maxQuestions: undefined,
        randomize: true,
        conditions: [
            {
                type: 'startingWith' as const,
                phrases: ['How many', 'How much'],
                caseSensitive: false,
                matchType: 'exact' as const,
            },
        ],
    },

    RARE_WORD_QUESTIONS: {
        name: 'Rare Word Questions',
        description: 'Questions containing unusual/rare words',
        maxQuestions: undefined,
        randomize: true,
        conditions: [
            {
                type: 'wordFrequency' as const,
                mode: 'rareWords' as const,
                minimumRareWordCount: 2,
            },
        ],
    },

    HIGH_VALUE_QUESTIONS: {
        name: 'High Value Questions',
        description: 'Only 20 and 30 point questions (max: 20)',
        maxQuestions: 20,
        randomize: true,
        conditions: [
            {
                type: 'pointValue' as const,
                values: [20, 30],
            },
        ],
    },

    QUOTATION_QUESTIONS: {
        name: 'Quotation Questions Only',
        description: 'All quotation-type questions',
        maxQuestions: undefined,
        randomize: true,
        conditions: [
            {
                type: 'pointValue' as const,
                values: [10, 20, 30],
                includeQuotes: true,
            },
        ],
    },

    MEDIUM_LENGTH: {
        name: 'Medium Length Questions',
        description: 'Questions with 20-40 words',
        maxQuestions: undefined,
        randomize: true,
        conditions: [
            {
                type: 'questionLength' as const,
                operator: 'between' as const,
                value: [20, 40],
            },
        ],
    },
};
