import {
    MatchQuestionUsage,
    type OnlineDatabaseQuestionSet,
} from "types/services/AstroDatabaseQuestionsService";

/**
 * Counts each match's regular questions by point value.
 *
 * @param questionSet Questions for the division.
 *
 * @returns Point value counts keyed by match number, in match order.
 */
export function getMatchPointValueCounts(questionSet: OnlineDatabaseQuestionSet): Map<number, Record<number, number>> {
    const countsByMatch = new Map<number, Record<number, number>>();

    const matchNumbers = Object.keys(questionSet.Matches)
        .map(Number)
        .sort((a, b) => a - b);

    for (const matchNumber of matchNumbers) {
        const counts: Record<number, number> = {};
        for (const question of Object.values(questionSet.Matches[matchNumber].Questions)) {
            if (question.Usage === MatchQuestionUsage.Regular) {
                counts[question.PointValue] = (counts[question.PointValue] ?? 0) + 1;
            }
        }

        countsByMatch.set(matchNumber, counts);
    }

    return countsByMatch;
}

/**
 * Compares each match's regular questions with the required count for each point value. A point value that isn't
 * required must have no questions.
 *
 * @param questionSet Questions for the division.
 * @param requiredCounts Required count for each point value (e.g. the rules' PointValueCounts).
 * @param expectation How the messages introduce the required count (e.g. "the rules require").
 *
 * @returns One message for each point value and count that's off, listing the matches it applies to, e.g.
 * "Matches 1-8 have 11 10-point questions, but the rules require 12."
 */
export function checkQuestionCounts(
    questionSet: OnlineDatabaseQuestionSet,
    requiredCounts: Record<number, number>,
    expectation: string,
): string[] {
    // Group the matches that are off by the same amount, so a mismatch in every match is one line.
    const mismatches = new Map<string, { pointValue: number; actual: number; required: number; matches: number[] }>();

    for (const [matchNumber, actualCounts] of getMatchPointValueCounts(questionSet)) {
        const pointValues = new Set([
            ...Object.keys(requiredCounts).map(Number),
            ...Object.keys(actualCounts).map(Number),
        ]);

        for (const pointValue of pointValues) {
            const actual = actualCounts[pointValue] ?? 0;
            const required = requiredCounts[pointValue] ?? 0;
            if (actual !== required) {
                const key = `${pointValue}:${actual}`;
                const mismatch = mismatches.get(key) ?? { pointValue, actual, required, matches: [] };
                mismatch.matches.push(matchNumber);
                mismatches.set(key, mismatch);
            }
        }
    }

    return [...mismatches.values()]
        .sort((a, b) => a.pointValue - b.pointValue || a.matches[0] - b.matches[0])
        .map(m => {
            const matches = m.matches.length === 1
                ? `Match ${m.matches[0]} has`
                : `Matches ${formatMatchList(m.matches)} have`;

            return `${matches} ${m.actual} ${m.pointValue}-point questions, but ${expectation} ${m.required}.`;
        });
}

/**
 * Formats sorted match numbers, collapsing runs (e.g. "1-4, 6, 8").
 */
function formatMatchList(matches: number[]): string {
    const parts: string[] = [];
    let start = matches[0];
    let previous = matches[0];
    for (const match of [...matches.slice(1), Number.NaN]) {
        if (match !== previous + 1) {
            parts.push(start === previous ? `${start}` : `${start}-${previous}`);
            start = match;
        }

        previous = match;
    }

    return parts.join(", ");
}
