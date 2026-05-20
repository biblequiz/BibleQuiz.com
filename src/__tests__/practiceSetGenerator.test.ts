/**
 * Test cases for Practice Set Generator filtering
 * Run with: npm test -- --testNamePattern="Practice Set Generator"
 */

import { describe, it, expect, beforeAll } from 'vitest';
import type { Question, FilterRule } from '../types/PracticeSetGenerator';
import { generatePracticeSet, filterQuestions } from '../utils/questionFiltering';
import * as fs from 'fs';
import * as path from 'path';

let allQuestions: Question[] = [];

beforeAll(() => {
    // Load the generated questions
    const questionsPath = path.resolve('./src/data/generated/jbq-questions-analyzed.json');
    if (fs.existsSync(questionsPath)) {
        const data = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));
        allQuestions = data.questions || [];
        console.log(`\n📊 Loaded ${allQuestions.length} questions for testing`);
    } else {
        console.error('Questions file not found. Run: npm run process-questions');
    }
});

describe('Practice Set Generator - Filtering', () => {
    it('should load questions', () => {
        expect(allQuestions.length).toBeGreaterThan(0);
        console.log(`✓ Questions loaded: ${allQuestions.length}`);
    });

    it('should show question metrics', () => {
        if (allQuestions.length === 0) return;

        const stats = {
            totalQuestions: allQuestions.length,
            uniqueWordStats: {
                min: Math.min(...allQuestions.map(q => q.analysis.uniqueWordCount)),
                max: Math.max(...allQuestions.map(q => q.analysis.uniqueWordCount)),
                avg: (allQuestions.reduce((sum, q) => sum + q.analysis.uniqueWordCount, 0) / allQuestions.length).toFixed(2),
            },
            complexityStats: {
                min: Math.min(...allQuestions.map(q => q.analysis.complexityScore)),
                max: Math.max(...allQuestions.map(q => q.analysis.complexityScore)),
                avg: (allQuestions.reduce((sum, q) => sum + q.analysis.complexityScore, 0) / allQuestions.length).toFixed(2),
            },
            pointValueDistribution: {} as Record<number, number>,
            sampleQuestions: allQuestions.slice(0, 3),
        };

        allQuestions.forEach(q => {
            stats.pointValueDistribution[q.pointValue] = (stats.pointValueDistribution[q.pointValue] || 0) + 1;
        });

        console.log('\n📈 Question Statistics:');
        console.log(JSON.stringify(stats, null, 2));
        expect(stats.totalQuestions).toBeGreaterThan(0);
    });

    describe('Unique Word Count Filter', () => {
        it('should filter: unique words >= 2', () => {
            const rule: FilterRule = {
                id: 'test-1',
                name: 'Test: >= 2 unique words',
                description: '',
                conditions: [
                    {
                        type: 'uniqueWordCount',
                        operator: 'greaterThan',
                        value: 1,
                    },
                ],
            };

            const results = filterQuestions(allQuestions, [rule]);
            console.log(`\n✓ Filter: unique words > 1: ${results.length} matches`);
            console.log(`  Sample: ${results[0]?.text.substring(0, 80)}...`);
            expect(results.length).toBeGreaterThan(0);
        });

        it('should filter: unique words equals 5', () => {
            const rule: FilterRule = {
                id: 'test-2',
                name: 'Test: = 5 unique words',
                description: '',
                conditions: [
                    {
                        type: 'uniqueWordCount',
                        operator: 'equals',
                        value: 5,
                    },
                ],
            };

            const results = filterQuestions(allQuestions, [rule]);
            console.log(`\n✓ Filter: unique words = 5: ${results.length} matches`);
            if (results.length > 0) {
                console.log(`  Sample: "${results[0].text}" (${results[0].analysis.uniqueWordCount} unique)`);
            }
            // May be 0, that's OK
            expect(results).toBeDefined();
        });

        it('should filter: unique words between 3 and 8', () => {
            const rule: FilterRule = {
                id: 'test-3',
                name: 'Test: 3-8 unique words',
                description: '',
                conditions: [
                    {
                        type: 'uniqueWordCount',
                        operator: 'between',
                        value: [3, 8],
                    },
                ],
            };

            const results = filterQuestions(allQuestions, [rule]);
            console.log(`\n✓ Filter: unique words 3-8: ${results.length} matches`);
            results.slice(0, 3).forEach(q => {
                console.log(`  - "${q.text.substring(0, 60)}..." (${q.analysis.uniqueWordCount} unique)`);
            });
            expect(results.length).toBeGreaterThan(0);
        });
    });

    describe('Starting Phrase Filter', () => {
        it('should filter: starts with "What"', () => {
            const rule: FilterRule = {
                id: 'test-4',
                name: 'Test: starts with What',
                description: '',
                conditions: [
                    {
                        type: 'startingWith',
                        phrases: ['What'],
                        caseSensitive: false,
                        matchType: 'exact',
                    },
                ],
            };

            const results = filterQuestions(allQuestions, [rule]);
            console.log(`\n✓ Filter: starts with "What": ${results.length} matches`);
            results.slice(0, 2).forEach(q => {
                console.log(`  - "${q.text.substring(0, 60)}..."`);
            });
            expect(results.length).toBeGreaterThan(0);
        });

        it('should filter: starts with "Who"', () => {
            const rule: FilterRule = {
                id: 'test-5',
                name: 'Test: starts with Who',
                description: '',
                conditions: [
                    {
                        type: 'startingWith',
                        phrases: ['Who'],
                        caseSensitive: false,
                        matchType: 'exact',
                    },
                ],
            };

            const results = filterQuestions(allQuestions, [rule]);
            console.log(`\n✓ Filter: starts with "Who": ${results.length} matches`);
            if (results.length > 0) {
                results.slice(0, 2).forEach(q => {
                    console.log(`  - "${q.text.substring(0, 60)}..."`);
                });
            }
        });
    });

    describe('Word Frequency Filter', () => {
        it('should filter: has rare words', () => {
            const rule: FilterRule = {
                id: 'test-6',
                name: 'Test: has 1+ rare words',
                description: '',
                conditions: [
                    {
                        type: 'wordFrequency',
                        mode: 'rareWords',
                        minimumRareWordCount: 1,
                    },
                ],
            };

            const results = filterQuestions(allQuestions, [rule]);
            console.log(`\n✓ Filter: has rare words: ${results.length} matches`);
            results.slice(0, 2).forEach(q => {
                console.log(`  - "${q.text.substring(0, 60)}..." (rare: ${q.analysis.rareWords.slice(0, 2).join(', ')})`);
            });
            expect(results.length).toBeGreaterThan(0);
        });
    });

    describe('Complexity Filter', () => {
        it('should filter: complexity > 50', () => {
            const rule: FilterRule = {
                id: 'test-7',
                name: 'Test: complexity > 50',
                description: '',
                conditions: [
                    {
                        type: 'complexity',
                        operator: 'greaterThan',
                        value: 50,
                    },
                ],
            };

            const results = filterQuestions(allQuestions, [rule]);
            console.log(`\n✓ Filter: complexity > 50: ${results.length} matches`);
            results.slice(0, 2).forEach(q => {
                console.log(`  - "${q.text.substring(0, 60)}..." (score: ${q.analysis.complexityScore})`);
            });
            expect(results.length).toBeGreaterThan(0);
        });
    });

    describe('Point Value Filter', () => {
        it('should filter: point value 20 or 30', () => {
            const rule: FilterRule = {
                id: 'test-8',
                name: 'Test: 20 or 30 points',
                description: '',
                conditions: [
                    {
                        type: 'pointValue',
                        values: [20, 30],
                    },
                ],
            };

            const results = filterQuestions(allQuestions, [rule]);
            console.log(`\n✓ Filter: point value 20 or 30: ${results.length} matches`);
            const dist = { 20: 0, 30: 0 };
            results.forEach(q => {
                if (q.pointValue === 20 || q.pointValue === 30) {
                    dist[q.pointValue as 20 | 30]++;
                }
            });
            console.log(`  Distribution: 20pts=${dist[20]}, 30pts=${dist[30]}`);
            expect(results.length).toBeGreaterThan(0);
        });
    });

    describe('Combined Filters', () => {
        it('should filter: point 20+ AND unique words > 3', () => {
            const rule: FilterRule = {
                id: 'test-9',
                name: 'Test: 20+ points AND unique > 3',
                description: '',
                conditions: [
                    {
                        type: 'pointValue',
                        values: [20, 30],
                    },
                    {
                        type: 'uniqueWordCount',
                        operator: 'greaterThan',
                        value: 3,
                    },
                ],
            };

            const results = filterQuestions(allQuestions, [rule]);
            console.log(`\n✓ Filter: 20+ points AND unique > 3: ${results.length} matches`);
            results.slice(0, 2).forEach(q => {
                console.log(`  - [${q.pointValue}pts] "${q.text.substring(0, 50)}..." (${q.analysis.uniqueWordCount} unique)`);
            });
            expect(results.length).toBeGreaterThan(0);
        });
    });

    describe('Practice Set Generation', () => {
        it('should generate practice set with default config', () => {
            const config = {
                name: 'Test Set',
                filterRules: [
                    {
                        id: 'rule-1',
                        name: 'Simple filter',
                        description: '',
                        conditions: [
                            {
                                type: 'uniqueWordCount' as const,
                                operator: 'greaterThan' as const,
                                value: 2,
                            },
                        ],
                    },
                ],
            };

            const result = generatePracticeSet(allQuestions, config);
            console.log(`\n✓ Generated practice set: ${result.questions.length} questions`);
            console.log(`  Total matched: ${result.metadata.totalMatched}`);
            console.log(`  Avg complexity: ${result.metadata.averageComplexity.toFixed(1)}`);
            console.log(`  Avg unique words: ${result.metadata.averageUniqueWords.toFixed(1)}`);
            expect(result.questions.length).toBeGreaterThan(0);
        });

        it('should limit max questions', () => {
            const config = {
                name: 'Limited Set',
                filterRules: [
                    {
                        id: 'rule-1',
                        name: 'Any question',
                        description: '',
                        conditions: [
                            {
                                type: 'pointValue' as const,
                                values: [10, 20, 30] as (10 | 20 | 30)[],
                            },
                        ],
                    },
                ],
                maxQuestions: 10,
            };

            const result = generatePracticeSet(allQuestions, config);
            console.log(`\n✓ Generated with max 10: ${result.questions.length} questions selected`);
            expect(result.questions.length).toBeLessThanOrEqual(10);
        });
    });
});
