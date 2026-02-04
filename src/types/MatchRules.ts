import { DataTypeHelpers } from "utils/DataTypeHelpers";

/**
 * Rules about the matches for a specific meet.
 */
export class MatchRules {

    /**
     * Initializes a new instance of the MatchRules class.
     */
    constructor() {
        this.CompetitionName = "";
        this.IncorrectPointMultiplier = -0.5;
        this.QuizzersPerTeam = 3;
        this.QuizOutForward = new QuizOutRule();
        this.QuizOutBackward = new QuizOutRule();
        this.PointValueCounts = {};
        this.FoulPoints = 5;
        this.MaxTimeouts = 3;
        this.ContestRules = new ContestRules();
        this.IsIndividualCompetition = false;
    }

    /**
     * Abbreviation for the type of competition.
     */
    public CompetitionName: string;

    /**
     * Full name for the type of competition.
     */
    public CompetitionFullName?: string;

    /**
     * The type of competition.
     */
    public Type?: CompetitionType;

    /**
     * Mulitplier for points when a question is incorrect.
     */
    public IncorrectPointMultiplier: number;

    /**
     * Number of quizzers allowed for individual team tables.
     */
    public QuizzersPerTeam: number;

    /**
     * Rule for quizzing out forward.
     */
    public QuizOutForward: QuizOutRule;

    /**
     * Rule for quizzing out backward.
     */
    public QuizOutBackward: QuizOutRule;

    /**
     * Rules for each question point value.
     */
    public PointValueRules?: Record<number, QuestionPointValueRules>;

    /**
     * Count of the number of questions for each point value.
     */
    public PointValueCounts: Record<number, number>;

    /**
     * Number of points assigned when a foul is assessed.
     */
    public FoulPoints: number;

    /**
     * Number of regular timeouts as part of the match.
     */
    public MaxTimeouts: number;

    /**
     * Rules about contesting.
     */
    public ContestRules: ContestRules;

    /**
     * Rules for timing.
     */
    public TimingRules?: TimingRules;

    /**
     * Value indicating whether the competition is an individual tournament (i.e., team scores don't matter).
     */
    public IsIndividualCompetition: boolean;

    /**
     * List of question numbers when the score is required to be read. If this isn't set, there are no required readings.
     */
    public RequiredScoreReading?: Set<number>;

    /**
     * Converts a MatchRules object to a human-readable string description.
     * @param rules The MatchRules object or plain object to describe.
     * @returns A formatted string describing the rules.
     */
    public static toHtmlString(rules: MatchRules): string {
        const lines: string[] = [];

        // Header line
        lines.push(`<p className="m-0">${rules.CompetitionFullName} - ${rules.CompetitionName} (Max ${rules.QuizzersPerTeam} quizzers at table)</p><ul>`);

        // Question point values
        if (rules.PointValueCounts) {
            const questionsDisplay = Object.entries(rules.PointValueCounts)
                .map(([points, count]) => {
                    const incorrectPoints = Math.floor(Number(points) * rules.IncorrectPointMultiplier);
                    return `${count} x ${points} (${incorrectPoints} Incorrect)`;
                })
                .join(", ");
            lines.push(`<li><b>Questions:</b> ${questionsDisplay}</li>`);
        }

        // Point value rules
        if (rules.PointValueRules) {
            for (const [pointValue, rule] of Object.entries(rules.PointValueRules)) {
                const parts: string[] = [];

                if (rule.PerHalfCount !== undefined && rule.PerHalfCount !== null) {
                    parts.push(`at least ${rule.PerHalfCount} per half`);
                }

                if (!rule.AllowConsecutive) {
                    parts.push("non-consecutive");
                }

                if (rule.First === rule.Last) {
                    switch (rule.First) {
                        case QuestionPositionRequirement.Required:
                            parts.push("must be first and last question");
                            break;
                        case QuestionPositionRequirement.NotAllowed:
                            parts.push("not first or last question");
                            break;
                        case QuestionPositionRequirement.Allowed:
                        default:
                            break;
                    }
                } else {
                    switch (rule.First) {
                        case QuestionPositionRequirement.Required:
                            parts.push("must be first question");
                            break;
                        case QuestionPositionRequirement.NotAllowed:
                            parts.push("not first question");
                            break;
                        case QuestionPositionRequirement.Allowed:
                        default:
                            break;
                    }

                    switch (rule.Last) {
                        case QuestionPositionRequirement.Required:
                            parts.push("must be last question");
                            break;
                        case QuestionPositionRequirement.NotAllowed:
                            parts.push("not last question");
                            break;
                        case QuestionPositionRequirement.Allowed:
                        default:
                            break;
                    }
                }

                if (parts.length > 0) {
                    lines.push(`<li>${pointValue}-point: ${parts.join(", ")}</li>`);
                }
            }
        }

        // Quiz out rules helper
        const describeQuizOutRule = (rule: QuizOutRule, questionDescription: string): string => {
            const conditions: string[] = [];

            if (rule.QuestionCount) {
                conditions.push(`${rule.QuestionCount} ${questionDescription} question(s)`);
            }

            if (rule.FoulCount) {
                conditions.push(`${rule.FoulCount} foul(s)`);
            }

            let description = `after ${conditions.join(" or ")}`;

            if (rule.BonusPoints) {
                description += ` and award ${rule.BonusPoints} points`;
            }

            return description;
        };

        // Quiz out rules
        if (rules.QuizOutForward) {
            lines.push(`<li><b>Quiz Out</b> ${describeQuizOutRule(rules.QuizOutForward, "correct")}</li>`);
        }

        if (rules.QuizOutBackward) {
            lines.push(`<li><b>Strike Out</b> ${describeQuizOutRule(rules.QuizOutBackward, "incorrect")}</li>`);
        }

        // Contest rules
        if (rules.ContestRules) {
            const contestParts: string[] = [];

            if (rules.ContestRules.MaxSuccessfulContests) {
                contestParts.push(`Max ${rules.ContestRules.MaxSuccessfulContests} Successful`);
            }

            if (rules.ContestRules.MaxUnsuccessfulContests) {
                contestParts.push(`Max ${rules.ContestRules.MaxUnsuccessfulContests} unsuccessful`);
            }

            if (rules.ContestRules.UnsuccessfulContestsWithoutFouls) {
                contestParts.push(`${rules.ContestRules.UnsuccessfulContestsWithoutFouls} unsuccessful w/o fouls`);
            }

            lines.push(`<li><b>${rules.ContestRules.ContestLabel}:</b> ${contestParts.join(", ")}</li>`);
        }

        // Timeout and foul rules
        if (rules.MaxTimeouts) {
            lines.push(`<li><b>Timeouts:</b> ${rules.MaxTimeouts} per round</li>`);
        }

        if (rules.FoulPoints) {
            lines.push(`<li><b>Fouls:</b> -${rules.FoulPoints} points</li>`);
        }

        // Timing rules
        if (rules.TimingRules?.InitialRemainingTime) {
            const formatTime = (value: string | null): string => {
                const minutes = DataTypeHelpers.parseTimeSpanAsMinutes(value);
                if (!minutes) {
                    return "0 minutes";
                }

                return `${minutes} minute${minutes > 1 ? "s" : ""}`;
            };

            let timingLine = `<li><b>Timer counts down</b> from ${formatTime(rules.TimingRules.InitialRemainingTime)}`;

            if (rules.TimingRules.WarnIfRemaining) {
                timingLine += `, <i>warn at</i> ${formatTime(rules.TimingRules.WarnIfRemaining)}`;
            }

            if (rules.TimingRules.AlertIfRemaining) {
                timingLine += `, <i>alert at</i> ${formatTime(rules.TimingRules.AlertIfRemaining)}`;
            }

            lines.push(timingLine);
        }

        lines.push("</ul>");
        return lines.join("\n");
    }
}

/**
 * Type of competition that defines the rules.
 */
export enum CompetitionType {

    /**
     * Junior Bible Quiz
     */
    JBQ = 0,

    /**
     * Teen Bible Quiz
     */
    TBQ = 1
}

/**
 * Rules for quizzing out.
 */
export class QuizOutRule {

    /**
     * Initializes a new instance of the QuizOutRule class.
     */
    constructor() {
        this.QuestionCount = 0;
        this.ShouldUnseatIfUnbeatable = false;
        this.BonusPoints = 0;
    }

    /**
     * Number of questions that must be answered to quiz out.
     */
    public QuestionCount: number;

    /**
     * Number of fouls the quizzer may receive for this rule to be satisfied.
     */
    public FoulCount?: number;

    /**
     * Value indicating whether the quizzer should be unseated if it is no longer possible to reach the quizzer's score.
     */
    public ShouldUnseatIfUnbeatable: boolean;

    /**
     * Number of bonus points received when quizzing out.
     */
    public BonusPoints: number;
}

/**
 * Rules about question point values.
 */
export class QuestionPointValueRules {

    /**
     * Initializes a new instance of the QuestionPointValueRules class.
     */
    constructor() {
        this.First = QuestionPositionRequirement.Allowed;
        this.Last = QuestionPositionRequirement.Allowed;
        this.AllowConsecutive = false;
    }

    /**
     * Value indicating requirements for this point value for the first question.
     */
    public First: QuestionPositionRequirement;

    /**
     * Value indicating requirements for this point value for the last question.
     */
    public Last: QuestionPositionRequirement;

    /**
     * Number of questions of this point value that must be in each half of the match.
     */
    public PerHalfCount?: number;

    /**
     * Value indicating whether this point value can be asked consecutively.
     */
    public AllowConsecutive: boolean;
}

/**
 * Requirement for a question's position.
 */
export enum QuestionPositionRequirement {

    /**
     * Allowed to be in the position, but not required.
     */
    Allowed = 0,

    /**
     * Required to be at the specified position.
     */
    Required = 1,

    /**
     * Not allowed to be in the specific position.
     */
    NotAllowed = 2
}

/**
 * Rules about contesting.
 */
export class ContestRules {

    /**
     * Initializes a new instance of the ContestRules class.
     */
    constructor() {
        this.ContestLabel = "";
        this.AreContestsRulings = false;
    }

    /**
     * Label for contests.
     */
    public ContestLabel: string;

    /**
     * Total number of successful contests allowed for the match. If this is null, it means there is no limit.
     */
    public MaxSuccessfulContests?: number;

    /**
     * Total number of unsuccessful contests allowed for the match. If this is null, it means there is no limit.
     */
    public MaxUnsuccessfulContests?: number;

    /**
     * Number of unsuccessful contests that can be attempted before a foul is assessed.
     */
    public UnsuccessfulContestsWithoutFouls?: number;

    /**
     * Value indicating whether contests are rulings or contests (legacy).
     */
    public AreContestsRulings: boolean;
}

/**
 * Rules about timing.
 */
export class TimingRules {

    /**
     * Initial time remaining for the timer (if any).
     */
    public InitialRemainingTime?: string;

    /**
     * Value indicating when a warning should be displayed after remaining time has dropped below this value.
     */
    public WarnIfRemaining?: string;

    /**
     * Value indicating when an alert should be displayed after remaining time has dropped below this value.
     */
    public AlertIfRemaining?: string;
}