/**
 * Rules about the matches for a specific meet.
 */
export class MatchRules {

    /**
     * Abbreviation for the type of competition.
     */
    public readonly CompetitionName!: string;

    /**
     * Full name for the type of competition.
     */
    public readonly CompetitionFullName!: string;

    /**
     * The type of competition.
     */
    public readonly Type!: CompetitionType | null;

    /**
     * Multiplier for points when a question is incorrect.
     */
    public readonly IncorrectPointMultiplier!: number;

    /**
     * Number of quizzers allowed for individual team tables.
     */
    public readonly QuizzersPerTeam!: number;

    /**
     * Rule for quizzing out forward.
     */
    public readonly QuizOutForward!: QuizOutRule;

    /**
     * Rule for quizzing out backward.
     */
    public readonly QuizOutBackward!: QuizOutRule;

    /**
     * Rules for each question point value.
     */
    public readonly PointValueRules!: Record<number, QuestionPointValueRules>;

    /**
     * Count of the number of questions for each point value.
     */
    public readonly PointValueCounts!: Record<number, number>;

    /**
     * Number of points assigned when a foul is assessed.
     */
    public readonly FoulPoints!: number;

    /**
     * Number of regular timeouts as part of the match.
     */
    public readonly MaxTimeouts!: number;

    /**
     * Rules about contesting.
     */
    public readonly ContestRules!: ContestRules;

    /**
     * Rules for timing.
     */
    public readonly TimingRules!: TimingRules;

    /**
     * Value indicating whether the competition is an individual tournament (i.e., team scores don't matter).
     */
    public readonly IsIndividualCompetition!: boolean;

    /**
     * List of question numbers when the score is required to be read. If this isn't set, there are no required readings.
     */
    public readonly RequiredScoreReading!: Set<number>;
}

/**
 * Type of competition that defines the rules.
 */
export enum CompetitionType {

    /**
     * Junior Bible Quiz
     */
    JBQ,

    /**
     * Teen Bible Quiz
     */
    TBQ
}

/**
 * Rules for quizzing out.
 */
export class QuizOutRule {

    /**
     * Number of questions that must be answered to quiz out.
     */
    public readonly QuestionCount!: number;

    /**
     * Number of fouls the quizzer may receive for this rule to be satisfied.
     */
    public readonly FoulCount!: number | null;

    /**
     * Value indicating whether the quizzer should be unseated if it is no longer possible to reach the quizzer's score.
     */
    public readonly ShouldUnseatIfUnbeatable!: boolean;

    /**
     * Number of bonus points received when quizzing out.
     */
    public readonly BonusPoints!: number;
}

/**
 * Rules about question point values.
 */
export class QuestionPointValueRules {

    /**
     * Value indicating requirements for this point value for the first question.
     */
    public readonly First!: QuestionPositionRequirement;

    /**
     * Value indicating requirements for this point value for the last question.
     */
    public readonly Last!: QuestionPositionRequirement;

    /**
     * Number of questions of this point value that must be in each half of the match.
     */
    public readonly PerHalfCount!: number | null;

    /**
     * Value indicating whether this point value can be asked consecutively.
     */
    public readonly AllowConsecutive!: boolean;
}

/**
 * Requirement for a question's position.
 */
export enum QuestionPositionRequirement {

    /**
     * Allowed to be in the position, but not required.
     */
    Allowed,

    /**
     * Required to be at the specified position.
     */
    Required,

    /**
     * Not allowed to be in the specific position.
     */
    NotAllowed
}

/**
 * Rules about contesting.
 */
export class ContestRules {

    /**
     * Label for contests.
     */
    public readonly ContestLabel!: string;

    /**
     * Total number of successful contests allowed for the match. If this is null, it means there is no limit.
     */
    public readonly MaxSuccessfulContests!: number | null;

    /**
     * Total number of unsuccessful contests allowed for the match. If this is null, it means there is no limit.
     */
    public readonly MaxUnsuccessfulContests!: number | null;

    /**
     * Number of unsuccessful contests that can be attempted before a foul is assessed.
     */
    public readonly UnsuccessfulContestsWithoutFouls!: number | null;

    /**
     * Value indicating whether contests are rulings or contests (legacy).
     */
    public readonly AreContestsRulings!: boolean;
}

/**
 * Rules about timing.
 */
export class TimingRules {
    
    /**
     * Initial time remaining for the timer (if any).
     */
    public readonly InitialRemainingTime!: string | null; // Use ISO string for TimeSpan

    /**
     * Value indicating when a warning should be displayed after remaining time has dropped below this value.
     */
    public readonly WarnIfRemaining!: string | null; // Use ISO string for TimeSpan

    /**
     * Value indicating when an alert should be displayed after remaining time has dropped below this value.
     */
    public readonly AlertIfRemaining!: string | null; // Use ISO string for TimeSpan
}