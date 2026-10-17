import type { MatchRules } from "types/MatchRules";
import {
    MatchQuestionUsage,
    type OnlineDatabaseQuestionSet,
} from "types/services/AstroDatabaseQuestionsService";

/**
 * Compares each match's regular questions with the rules' count for each point value. A point value the rules
 * don't list must have no questions.
 *
 * @param questionSet Questions for the division.
 * @param rules Rules for the division.
 *
 * @returns One message for each mismatch, e.g. "Match 3 has 11 10-point questions, but the rules require 12."
 */
export function checkQuestionCounts(questionSet: OnlineDatabaseQuestionSet, rules: MatchRules): string[] {
    const issues: string[] = [];

    const matchNumbers = Object.keys(questionSet.Matches)
        .map(Number)
        .sort((a, b) => a - b);

    for (const matchNumber of matchNumbers) {
        const actualCounts: Record<number, number> = {};
        for (const question of Object.values(questionSet.Matches[matchNumber].Questions)) {
            if (question.Usage === MatchQuestionUsage.Regular) {
                actualCounts[question.PointValue] = (actualCounts[question.PointValue] ?? 0) + 1;
            }
        }

        const pointValues = new Set([
            ...Object.keys(rules.PointValueCounts ?? {}).map(Number),
            ...Object.keys(actualCounts).map(Number),
        ]);

        for (const pointValue of [...pointValues].sort((a, b) => a - b)) {
            const actual = actualCounts[pointValue] ?? 0;
            const required = rules.PointValueCounts?.[pointValue] ?? 0;
            if (actual !== required) {
                issues.push(`Match ${matchNumber} has ${actual} ${pointValue}-point questions, but the rules require ${required}.`);
            }
        }
    }

    return issues;
}
