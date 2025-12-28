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
     * Gets the default rules for a specific competition type.
     * 
     * @param competitionType Type of competition.
     * @param isIndividualTournament Value indicating whether this is an individual tournament.
     * @param defaultMatchLength Default length for matches.
     * @returns Match rules for the specified competition type.
     */
    public static getDefaultRules(
        competitionType: CompetitionType,
        isIndividualTournament: boolean,
        defaultMatchLengthInMinutes?: number): MatchRules {

        if (isIndividualTournament) {
            throw new Error("Individual tournaments aren't supported.");
        }

        const timing = new TimingRules();
        if (defaultMatchLengthInMinutes !== undefined) {
            timing.InitialRemainingTime = DataTypeHelpers.formatTimeSpan(0, defaultMatchLengthInMinutes);;

            if (defaultMatchLengthInMinutes > 5) {
                timing.WarnIfRemaining = DataTypeHelpers.formatTimeSpan(0, 5);
                timing.AlertIfRemaining = DataTypeHelpers.formatTimeSpan(0, 0);;
            }
        }

        switch (competitionType) {
            case CompetitionType.JBQ:
                const jbqRules = new MatchRules();
                jbqRules.CompetitionName = "JBQ";
                jbqRules.CompetitionFullName = "Junior Bible Quiz";
                jbqRules.Type = CompetitionType.JBQ;
                jbqRules.PointValueCounts = { 10: 10, 20: 7, 30: 3 };
                jbqRules.PointValueRules = {
                    10: { First: QuestionPositionRequirement.Allowed, Last: QuestionPositionRequirement.Allowed, AllowConsecutive: true },
                    20: { PerHalfCount: 3, First: QuestionPositionRequirement.Allowed, Last: QuestionPositionRequirement.Allowed, AllowConsecutive: true },
                    30: { PerHalfCount: 1, First: QuestionPositionRequirement.NotAllowed, Last: QuestionPositionRequirement.NotAllowed, AllowConsecutive: false }
                };
                jbqRules.QuizOutForward = { BonusPoints: 10, QuestionCount: 6, ShouldUnseatIfUnbeatable: false };
                jbqRules.QuizOutBackward = { BonusPoints: 0, QuestionCount: 3, FoulCount: 3, ShouldUnseatIfUnbeatable: false };
                jbqRules.QuizzersPerTeam = 4;
                jbqRules.ContestRules = {
                    ContestLabel: "Coach's Appeals",
                    MaxSuccessfulContests: 2,
                    MaxUnsuccessfulContests: 0,
                    AreContestsRulings: true
                };
                jbqRules.TimingRules = timing;
                jbqRules.IsIndividualCompetition = false;
                return jbqRules;

            case CompetitionType.TBQ:
                const tbqRules = new MatchRules();
                tbqRules.CompetitionName = "TBQ";
                tbqRules.CompetitionFullName = "Teen Bible Quiz";
                tbqRules.Type = CompetitionType.TBQ;
                tbqRules.PointValueCounts = { 10: 8, 20: 9, 30: 3 };
                tbqRules.QuizOutForward = { BonusPoints: 20, QuestionCount: 5, ShouldUnseatIfUnbeatable: false, FoulCount: undefined };
                tbqRules.QuizOutBackward = { BonusPoints: 0, QuestionCount: 3, FoulCount: 3, ShouldUnseatIfUnbeatable: false };
                tbqRules.QuizzersPerTeam = 3;
                tbqRules.ContestRules = {
                    ContestLabel: "Contests",
                    MaxUnsuccessfulContests: 3,
                    AreContestsRulings: false
                };
                tbqRules.TimingRules = timing;
                tbqRules.IsIndividualCompetition = false;
                return tbqRules;

            default:
                throw new Error(`CompetitionType = ${competitionType} is not implemented`);
        }
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