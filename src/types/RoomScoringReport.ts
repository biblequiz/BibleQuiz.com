import {MatchRules} from 'types/MatchRules';

/**
 * Report of scores for a specific match in a specific room.
 */
export class RoomScoringReport {
    /**
     * Name of the event.
     */
    public readonly EventName!: string;

    /**
     * Name of the database.
     */
    public readonly DatabaseName!: string;

    /**
     * Name of the meet.
     */
    public readonly MeetName!: string;

    /**
     * Id for the meet.
     */
    public readonly MeetId!: number;

    /**
     * Id for the match.
     */
    public readonly MatchId!: number;

    /**
     * Id for the room.
     */
    public readonly RoomId!: number;

    /**
     * Name of the room.
     */
    public readonly RoomName!: string;

    /**
     * Value indicating whether the match has started.
     */
    public readonly HasStarted!: boolean;

    /**
     * Current question for the match.
     */
    public readonly CurrentQuestion!: number | null;

    /**
     * Number of total questions in the match, including overtime.
     */
    public readonly TotalQuestionCount!: number;

    /**
     * Number of regular questions (i.e., questions not in OT) for the match.
     */
    public readonly RegularQuestionCount!: number;

    /**
     * Value indicating whether the match is completed.
     */
    public readonly IsCompleted!: boolean;

    /**
     * Time the match was started (if set).
     */
    public readonly StartTime!: string | null;

    /**
     * Remaining time for the match (if set and still in progress).
     */
    public readonly RemainingTime!: string | null;

    /**
     * Time the match was ended (if set).
     */
    public readonly EndTime!: string | null;

    /**
     * Index of the playoff (starting at 1). If this is null, it isn't a playoff match.
     */
    public readonly PlayoffIndex!: number | null;

    /**
     * Red team (if any).
     */
    public readonly RedTeam!: RoomScoringReportTeam | null;

    /**
     * Green team (if any).
     */
    public readonly GreenTeam!: RoomScoringReportTeam | null;

    /**
     * Point values for questions (in order) up to, but not including, the current question. This will be null if this is a summary scoresheet.
     */
    public readonly PointValues!: Record<number, number>;

    /**
     * Remaining point values for the match (if it isn't completed).
     */
    public readonly RemainingPoints!: Record<number, number>;

    /**
     * Rules for the match.
     */
    public readonly Rules!: MatchRules;

    /**
     * Timestamp when the database was last updated in such a way that it impacts scoring.
     */
    public readonly DatabaseLastUpdated!: string; // Use ISO string for DateTimeOffset
}

/**
 * Team's scores for a specific match in a specific room.
 */
export class RoomScoringReportTeam {

    /**
     * Id for the team within the database.
     */
    public readonly Id!: number;

    /**
     * Name of the team.
     */
    public readonly Name!: string;

    /**
     * Name of the church.
     */
    public readonly ChurchName!: string;

    /**
     * Total points for the team.
     */
    public readonly TotalPoints!: number;

    /**
     * Total foul points for this team.
     */
    public readonly TotalFoulPoints!: number;

    /**
     * Number of fouls for the team.
     */
    public readonly Fouls!: number;

    /**
     * Number of timeouts taken by the team.
     */
    public readonly Timeouts!: number;

    /**
     * Number of successful contests.
     */
    public readonly SuccessfulContests!: number;

    /**
     * Number of unsuccessful contests.
     */
    public readonly UnsuccessfulContests!: number;

    /**
     * Value indicating whether this match is verified.
     */
    public readonly IsVerified!: boolean;

    /**
     * Quizzers associated with this team.
     */
    public readonly Quizzers!: RoomScoringReportQuizzer[];

    /**
     * Mapping of question number to the points assigned for this team.
     */
    public readonly Questions!: Record<number, number>;
}

/**
 * Quizzer's scores for a specific match in a specific room.
 */
export class RoomScoringReportQuizzer {

    /**
     * Id for the quizzer within the database.
     */
    public readonly Id!: number;

    /**
     * Name of the quizzer.
     */
    public readonly Name!: string;

    /**
     * Position of the quizzer. If null, the quizzer isn't seated.
     */
    public readonly Position!: number | null;

    /**
     * Total points for the quizzer.
     */
    public readonly TotalPoints!: number;

    /**
     * Number of bonus points for the quizzer.
     */
    public readonly BonusPoints!: number;

    /**
     * Total foul points for this quizzer.
     */
    public readonly TotalFoulPoints!: number;

    /**
     * Number of fouls for the quizzer.
     */
    public readonly Fouls!: number;

    /**
     * Number of questions answered correctly.
     */
    public readonly Correct!: number;

    /**
     * Number of questions answered incorrectly.
     */
    public readonly Incorrect!: number;

    /**
     * Value indicating the quizzed out state.
     */
    public readonly QuizzedOutState!: QuizzedOutState;

    /**
     * Mapping of question number to the points assigned for this quizzer.
     */
    public readonly Questions!: Record<number, number>;
}

/**
 * Status of a quizzer's quizzing out.
 */
export enum QuizzedOutState {
    
    /**
     * Quizzer is not quizzed out.
     */
    NotQuizzedOut,

    /**
     * Quizzer quizzed out forward.
     */
    QuizzedOutForward,

    /**
     * Quizzer quizzed out backward.
     */
    QuizzedOutBackward,
}