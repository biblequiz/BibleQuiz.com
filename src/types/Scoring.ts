/**
 * Metadata about a single room in a match.
 */
export class Room {

    /**
     * Initializes a new instance of the Room class.
     */
    constructor() {
        this.CurrentQuestion = 0;
        this.Questions = {};
        this.PointValueOverrides = {};
        this.Quizzers = {};
        this.Teams = {};
        this.IsCompleted = false;
        this.HasUnsyncedChanges = false;
        this.Research = {};
    }

    /**
     * Id for the red team.
     */
    public RedTeamId?: number;

    /**
     * Id for the green team.
     */
    public GreenTeamId?: number;

    /**
     * The current question for the room.
     */
    public CurrentQuestion: number;

    /**
     * List of questions for the match.
     */
    public Questions: Record<number, RoomQuestion>;

    /**
     * Overrides for point values for a given room.
     */
    public PointValueOverrides: Record<number, number>;

    /**
     * Stats about the quizzers applying across the entire match.
     */
    public Quizzers: Record<number, RoomQuizzer>;

    /**
     * Stats about the teams applying across the entire match.
     */
    public Teams: Record<number, RoomTeam>;

    /**
     * Value indicating whether the match is completed.
     */
    public IsCompleted: boolean;

    /**
     * Timestamp when the timer was started. This value will only be set when the timer is currently running.
     */
    public TimerStarted?: string;

    /**
     * Current remaining for the timer. If the timer is currently running, TimerStarted will be set and this value will contain the value from the
     * last time it was stopped (e.g., paused).
     */
    public TimerRemaining?: string;

    /**
     * Timestamp when the match started.
     */
    public MatchStarted?: string;

    /**
     * Timestamp when the match stopped.
     */
    public MatchStopped?: string;

    /**
     * Room research info.
     */
    public Research: Record<number, any>; // QuestionResearch - type from Meets

    /**
     * Value indicating whether to use the question scope.
     */
    public IsQuestionSetScopeEnabled?: boolean;

    /**
     * Version of the room in the remote system.
     */
    public RemoteVersion?: string;

    /**
     * Value indicating whether there are changes that haven't been synced to the remote system.
     */
    public HasUnsyncedChanges: boolean;
}

/**
 * State of a team within a room.
 */
export class RoomTeam {

    /**
     * Initializes a new instance of the RoomTeam class.
     */
    constructor() {
        this.FoulCount = 0;
        this.TotalFoulPoints = 0;
        this.TotalPoints = 0;
        this.SuccessfulContests = 0;
        this.UnsuccessfulContests = 0;
        this.Timeouts = 0;
        this.IsVerified = false;
    }

    /**
     * Number of fouls assessed for this team.
     */
    public FoulCount: number;

    /**
     * Total foul points for the team.
     */
    public TotalFoulPoints: number;

    /**
     * Total points for this team.
     */
    public TotalPoints: number;

    /**
     * Number of successful contests for the team.
     */
    public SuccessfulContests: number;

    /**
     * Number of unsuccessful contests for the team.
     */
    public UnsuccessfulContests: number;

    /**
     * Number of timeouts for this team.
     */
    public Timeouts: number;

    /**
     * Value indicating that the data was verified (typically by the coach).
     */
    public IsVerified: boolean;
}

/**
 * State of a quizzer within a room.
 */
export class RoomQuizzer {

    /**
     * Initializes a new instance of the RoomQuizzer class.
     */
    constructor() {
        this.FoulCount = 0;
        this.TotalFoulPoints = 0;
        this.TotalPoints = 0;
        this.Color = BuzzerColor.Red;
        this.QuizzedOutState = QuizzedOutState.NotQuizzedOut;
        this.Correct = 0;
        this.Incorrect = 0;
        this.BonusPoints = 0;
    }

    /**
     * Id for the team of the quizzer.
     */
    public TeamId?: number;

    /**
     * Number of fouls assessed for this quizzer.
     */
    public FoulCount: number;

    /**
     * Total foul points for this quizzer.
     */
    public TotalFoulPoints: number;

    /**
     * Total points for this quizzer.
     */
    public TotalPoints: number;

    /**
     * Value indicates the last question number answered by this quizzer.
     */
    public LastQuestionAnswered?: number;

    /**
     * Color of the buzzer for the quizzer.
     */
    public Color: BuzzerColor;

    /**
     * Value indicating whether the quizzer is active.
     */
    public Position?: number;

    /**
     * Value indicating the state of the quizzer's quizzing out.
     */
    public QuizzedOutState: QuizzedOutState;

    /**
     * Number of correct questions.
     */
    public Correct: number;

    /**
     * Number of incorrect questions.
     */
    public Incorrect: number;

    /**
     * Number of bonus points assigned.
     */
    public BonusPoints: number;
}

/**
 * Color of a buzzer.
 */
export enum BuzzerColor {
    /**
     * Team is sitting on the red side of the table.
     */
    Red = 0,

    /**
     * Team is sitting on the green side of the table.
     */
    Green = 1,
}

/**
 * Status of a quizzer's quizzing out.
 */
export enum QuizzedOutState {
    /**
     * Quizzer is not quizzed out.
     */
    NotQuizzedOut = 0,

    /**
     * Quizzer quizzed out forward.
     */
    QuizzedOutForward = 1,

    /**
     * Quizzer quizzed out backward.
     */
    QuizzedOutBackward = 2
}

/**
 * Individual question for a Room.
 */
export class RoomQuestion {

    /**
     * Initializes a new instance of the RoomQuestion class.
     */
    constructor() {
        this.QuizzerPoints = {};
    }

    /**
     * Scores for individual quizzers.
     */
    public QuizzerPoints: Record<number, RoomQuestionQuizzerScore>;
}

/**
 * Points for an individual within a RoomQuestion.
 */
export class RoomQuestionQuizzerScore {

    /**
     * Initializes a new instance of the RoomQuestionQuizzerScore class.
     */
    constructor() {
        this.Points = 0;
        this.IsInterrupted = false;
    }

    /**
     * Point values for the question.
     */
    public Points: number;

    /**
     * Value indicating whether the question was interrupted by this quizzer.
     */
    public IsInterrupted: boolean;
}
