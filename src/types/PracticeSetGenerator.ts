/**
 * Types for the advanced Practice Set Generator with complex filtering conditions.
 */

/**
 * Represents a single question from the JBQ database
 */
export interface Question {
    /** Unique question identifier */
    id: number;
    
    /** The full question text */
    text: string;
    
    /** Point value of the question (10, 20, 30) */
    pointValue: number;
    
    /** Whether this is a quotation question */
    isQuotation: boolean;
    
    /** Scripture reference(s) for the question */
    scriptureReference: string;
    
    /** The answer to the question */
    answer: string;
    
    /** Book(s) mentioned in the question */
    books: string[];
    
    /** Season/year the question is from */
    season: number;
    
    /** Analysis metrics */
    analysis: QuestionAnalysis;
}

/**
 * Analysis metrics computed for each question
 */
export interface QuestionAnalysis {
    /** Total number of words in the question */
    totalWordCount: number;
    
    /** Number of unique words in the question */
    uniqueWordCount: number;
    
    /** List of unique words in the question */
    uniqueWords: string[];
    
    /** Starting word(s) of the question */
    startsWithPhrase: string;
    
    /** Word frequency map (word -> count) */
    wordFrequency: Record<string, number>;
    
    /** Average word length */
    averageWordLength: number;
    
    /** Readability complexity score (0-100) */
    complexityScore: number;
    
    /** List of rare words (appearing in < 10% of questions) */
    rareWords: string[];
}

/**
 * Filter condition types for practice set generation
 */
export type FilterCondition =
    | UniqueWordCountFilter
    | QuestionStartingWithFilter
    | WordFrequencyFilter
    | QuestionLengthFilter
    | ScriptureReferenceFilter
    | PatternMatchFilter
    | ComplexityFilter
    | PointValueFilter;

/**
 * Filter by unique word count
 */
export interface UniqueWordCountFilter {
    type: 'uniqueWordCount';
    operator: 'equals' | 'lessThan' | 'greaterThan' | 'between';
    value: number | [number, number]; // Single value or [min, max]
}

/**
 * Filter questions starting with specific phrases
 */
export interface QuestionStartingWithFilter {
    type: 'startingWith';
    phrases: string[]; // e.g., ["What are", "How many", "Who was"]
    caseSensitive: boolean;
    matchType: 'exact' | 'contains'; // exact: must start, contains: phrase anywhere
}

/**
 * Filter by word frequency analysis
 */
export interface WordFrequencyFilter {
    type: 'wordFrequency';
    mode: 'hardsWords' | 'commonWords' | 'rareWords';
    minimumRareWordCount?: number; // At least N rare words
    excludeWords?: string[]; // Don't count these words
}

/**
 * Filter by question length/complexity
 */
export interface QuestionLengthFilter {
    type: 'questionLength';
    operator: 'equals' | 'lessThan' | 'greaterThan' | 'between';
    value: number | [number, number]; // Total word count
}

/**
 * Filter by scripture reference
 */
export interface ScriptureReferenceFilter {
    type: 'scriptureReference';
    books: string[]; // Book names (e.g., ["Genesis", "Exodus"])
    matchMode: 'anyBook' | 'allBooks'; // Question must reference any or all of specified books
}

/**
 * Filter using regex pattern matching
 */
export interface PatternMatchFilter {
    type: 'pattern';
    regex: string;
    caseSensitive: boolean;
}

/**
 * Filter by complexity score
 */
export interface ComplexityFilter {
    type: 'complexity';
    operator: 'equals' | 'lessThan' | 'greaterThan' | 'between';
    value: number | [number, number]; // Complexity score 0-100
}

/**
 * Filter by point value
 */
export interface PointValueFilter {
    type: 'pointValue';
    values: (10 | 20 | 30)[];
    includeQuotes?: boolean;
}

/**
 * Represents a complex filter rule with multiple conditions
 */
export interface FilterRule {
    /** Unique identifier for this rule */
    id: string;
    
    /** Display name for the rule */
    name: string;
    
    /** Description of what this rule does */
    description: string;
    
    /** Conditions to apply (all must be true - AND logic) */
    conditions: FilterCondition[];
    
    /** Whether to combine with previous rule via OR logic (default false = AND) */
    useOrLogic?: boolean;
}

/**
 * Configuration for generating a practice set
 */
export interface PracticeSetConfig {
    /** Name of the practice set */
    name: string;
    
    /** Description of the practice set */
    description?: string;
    
    /** Filter rules to apply */
    filterRules: FilterRule[];
    
    /** Maximum number of questions to include (-1 = all matching) */
    maxQuestions?: number;
    
    /** Randomize selection (if maxQuestions < total matches) */
    randomize?: boolean;
    
    /** Seed for randomization (for reproducibility) */
    randomSeed?: number;
    
    /** Sorting preference */
    sortBy?: 'questionId' | 'pointValue' | 'complexity' | 'random';
    
    /** Include metadata in output */
    includeMetadata?: boolean;
    
    /** Bold question text in display */
    boldQuestionText?: boolean;
    
    /** Export format preferences */
    exportFormat?: {
        includeSolution?: boolean;
        pdfLayout?: 'compact' | 'standard' | 'detailed';
    };
}

/**
 * Result of filtering questions
 */
export interface PracticeSetResult {
    /** Selected questions */
    questions: Question[];
    
    /** Metadata about the result */
    metadata: {
        totalMatched: number;
        totalSelected: number;
        rulesApplied: FilterRule[];
        generatedAt: Date;
        averageComplexity: number;
        averageUniqueWords: number;
        pointValueDistribution: Record<number, number>;
    };
}

/**
 * Pre-computed word statistics for filtering
 */
export interface WordStatistics {
    /** Total unique words across all questions */
    totalUniqueWords: number;
    
    /** Words that appear in less than 10% of questions */
    rareWords: Set<string>;
    
    /** Words that appear in more than 50% of questions */
    commonWords: Set<string>;
    
    /** Average unique word count across all questions */
    averageUniqueWords: number;
}
