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