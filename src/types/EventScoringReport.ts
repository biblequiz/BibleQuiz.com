/**
 * Scoring report for an event.
 */
export class EventScoringReport {
    /**
     *  Name of this event.
     */
    public readonly EventName!: string;

    /**
     * Names for databases by database id.
     */
    public readonly DatabaseNames!: Record<string, string>;

    /**
     * Report for the schedule and scores.
     */
    public readonly Report!: ScoringReport;

    /**
     * Display settings for each meet in Report's Meets (same indexed order).
     */
    public readonly MeetDisplay!: EventScoringReportMeetDisplay[];
}

/**
 * Display settings of a ScoringReportMeet.
 */
export class EventScoringReportMeetDisplay {
    /**
     * Display settings for the teams.
     */
    public readonly Teams!: EventScoringReportTeamOrQuizzerDisplay;

    /**
     * Display settings for the quizzers.
     */
    public readonly Quizzers!: EventScoringReportTeamOrQuizzerDisplay;
}

/**
 * Display settings of a ScoringReportTeam or ScoringReportQuizzer.
 */
export class EventScoringReportTeamOrQuizzerDisplay {
    /**
     * Value indicating whether average correctly answered question should be displayed.
     */
    public readonly ShowAverageCorrect !: boolean;

    /**
     * Value indicating whether the 10-point column should be displayed.
     */
    public readonly Show10s !: boolean;

    /**
     * Value indicating whether the 20-point column should be displayed.
     */
    public readonly Show20s  !: boolean;

    /**
     * Value indicating whether the 30-point column should be displayed.
     */
    public readonly Show30s  !: boolean;
}

/**
 * Report of schedules and scores for an event.
 */
export class ScoringReport {
    /**
     * List of meets associated with this report.
     */
    public readonly Meets!: ScoringReportMeet[];
}

/**
 * Report for an individual meet within a ScoringReport.
 */
export class ScoringReportMeet {
    /**
     * Id for the database of this meet.
     */
    public readonly DatabaseId!: string;

    /**
     * Id for the meet within the database.
     */
    public readonly MeetId!: number;

    /**
     * Name of the meet when it is combined due to linked meets.
     */
    public readonly CombinedName!: string | null;

    /**
     * Value indicating whether this meet has links.
     */
    public readonly HasLinkedMeets!: boolean;

    /**
     * Value indicating whether any ScoringReportMeetMatch.RegularQuestionStats are populated.
     */
    public readonly HasQuestionStats!: boolean;

    /**
     * Name of the meet.
     */
    public readonly Name!: string;

    /**
     * Timestamp when the data in this meet was last updated.
     */
    public readonly LastUpdated!: string;

    /**
     * Type of competition for this meet.
     */
    public readonly CompetitionType!: string;

    /**
     * List of teams ordered by name for the report. If this is null, teams weren't
     * included in the report.
     */
    public readonly Teams!: ScoringReportTeam[] | null;

    /**
     * Ranked order of indices into Teams representing the team's placement. If this is null,
     * scores aren't enabled.
     */
    public readonly RankedTeams !: number[] | null;

    /**
     * List of footnotes for the teams. If this is null, scores aren't enabled.
     */
    public readonly TeamFootnotes!: ScoringReportFootnote[] | null;

    /**
     * List of quizzers ordered by name for the report. If this is null, quizzers weren't included in the report.
     */
    public readonly Quizzers!: ScoringReportQuizzer[] | null;

    /**
     * Ranked order of indices into Quizzers representing the quizzer's placement. If this is null,
     * scores aren't enabled.
     */
    public readonly RankedQuizzers!: number[] | null;

    /**
     * List of footnotes for the teams. If this is null, scores aren't enabled.
     */
    public readonly QuizzerFootnotes!: ScoringReportFootnote[] | null;

    /**
     * List of names for ScoringReportTeamScore.PerMeetTotalPoints and ScoringReportQuizzerScore.PerMeetTotalPoints.
     * If that field is null, this property will also be null.
     */
    public readonly MeetNames!: string | null;

    /**
     * List of rooms ordered by name for the report. For linked meets, this will only be populated
     * on the root meet.
     */
    public readonly Rooms!: ScoringReportRoom[] | null;

    /**
     * Label describing the ranking for teams. If this is null, scores aren't enabled.
     */
    public readonly TeamRankingLabel!: string | null;

    /**
     * Shortened ranking label for quizzers for use in awards. If this is null, scores aren't enabled.
     */
    public readonly TeamRankingAwardsLabel!: string | null;

    /**
     * Label describing the ranking for quizzers. If this is null, scores aren't enabled.
     */
    public readonly QuizzerRankingLabel!: string | null;

    /**
     * Shortened ranking label for quizzers for use in awards. If this is null, scores aren't enabled.
     */
    public readonly QuizzerRankingAwardsLabel!: string | null;

    /**
     * List of matches in order. This property may be null.
     */
    public readonly Matches!: ScoringReportMeetMatch[] | null;

    /**
     * Value indicating whether there is a mismatch in the number of matches all rooms have completed.
     */
    public readonly HasRoomCompletionMismatch!: boolean;

    /**
     * Value indicating whether scoring has completed.
     */
    public readonly HasScoringCompleted!: boolean;

    /**
     * Message regarding scoring progress.
     */
    public readonly ScoringProgressMessage!: string | null;;

    /**
     * Value indicating whether there is a mismatch in the number of matches all rooms have completed if this is a combined meet due to linked meets.
     */
    public readonly HasRoomCompletionMismatchForCombined!: boolean;

    /**
     * Value indicating whether scoring has completed if this is a combined meet due to linked meets.
     */
    public readonly HasScoringCompletedForCombined!: boolean;

    /**
     * Message regarding scoring progress if this is a combined meet due to linked meets.
     */
    public readonly ScoringProgressMessageForCombined!: string | null;

    /**
     * Value indicating whether to include the ScoringReportQuizzer.YearsQuizzing column.
     */
    public readonly ShowYearsQuizzing!: boolean;

    /**
     * Value indicating whether this is a combined report based on multiple meets or if it was an
     * actual competition.
     */
    public readonly IsCombinedReport!: boolean;
}

/**
 * Base class for scores for a ScoringReportItemBase.
 */
export abstract class ScoringReportScoreBase {
    /**
     * Ranking for the team or quizzer.
     */
    public readonly Rank!: number;

    /**
     * Value indicating whether the rank is a tie.
     */
    public readonly IsTie!: boolean;

    /**
     * Total points for the team or quizzer.
     */
    public readonly TotalPoints!: number;

    /**
     * List of per meet totals (each item corresponds toScoringReportMeet.MeetNames and will only
     * be set if ScoringReportMeet.MeetNames is set). A null item means the team or quizzer didn't
     * compete in that match.
     */
    public readonly PerMeetTotalPoints!: (number | null)[] | null;

    /**
     * Average points for the team or quizzer.
     */
    public readonly AveragePoints!: number;

    /**
     * Average correct for the team or quizzer.
     */
    public readonly AverageCorrect!: number;

    /**
     * Number of quiz-outs for the team or quizzer.
     */
    public readonly QuizOuts!: number;

    /**
     * Percentage of the questions answered by quizzers on the team or quizzer that were answered with a correct answer.
     */
    public readonly QuestionCorrectPercentage!: number;

    /**
     * Number of 10-point questions answered correctly.
     */
    public readonly Correct10s!: number;

    /**
     * Number of 20-point questions answered correctly.
     */
    public readonly Correct20s!: number;

    /**
     * Number of 30-point questions answered correctly.
     */
    public readonly Correct30s!: number;

    /**
     * Optional index into ScoringReportMeet.TeamFootnotes or ScoringReportMeet.QuizzerFootnotes.
     */
    public readonly FootnoteIndex!: number | null;
}

/**
 * Base class for items within a ScoringReportMeet
 */
export abstract class ScoringReportItemBase<T extends ScoringReportScoreBase> {

    /**
     * Unique identifier for this team or quizzer within the event.
     */
    public readonly Id!: string;

    /**
     * Name of the team or quizzer.
     */
    public readonly Name!: string;

    /**
     * Name of the team or quizzer's church.
     */
    public readonly ChurchName!: string;

    /**
     * Name of the team or quizzer's city.
     */
    public readonly City!: string;

    /**
     * Name of the team or quizzer's state.
     */
    public readonly State!: string;

    /**
     * Scores for the team or quizzer. If this is null, scores aren't enabled.
     */
    public readonly Scores!: T | null;
}

/**
 * Scoring information for a team within a ScoringReport.
 */
export class ScoringReportTeamScore extends ScoringReportScoreBase {
    /**
     * Wins for the team.
     */
    public readonly Wins!: number;

    /**
     * Losses for the team.
     */
    public readonly Losses!: number;

    /**
     * Win percentage for the team.
     */
    public readonly WinPercentage!: number;
}

/**
 * Scoring information for a quizzer within a ScoringReport.
 */
export class ScoringReportQuizzerScore extends ScoringReportScoreBase {
}

/**
 * Team within a ScoringReport.
 */
export class ScoringReportTeam extends ScoringReportItemBase<ScoringReportTeamScore> {

    /**
     * Name of the team's coach.
     */
    public readonly CoachName!: string | null;

    /**
     * List of quizzer indices associated with this team sorted by name. The index can be resolved
     * against the quizzer from the ScoringReportMeet.Quizzers.
     */
    public readonly Quizzers!: number[];

    /**
     * Scheduled matches for the team. If there is a null value in the array, that match was an
     * unscored bye. This property may be null.
     */
    public readonly Matches!: (ScoringReportTeamMatch | null)[] | null;

    /**
     * Id for the current match (if the team is actively playing in a match).
     */
    public readonly CurrentMatchId!: number | null;
}

/**
 * Match for a team within a ScoringReport.
 */
export class ScoringReportTeamMatch {
    /**
     * Character representing the result of the match ('W', 'L', null).
     */
    public readonly Result!: string | null;

    /**
     * Id for the of the match.
     */
    public readonly RoomId!: number;

    /**
     * Name of the room for the match.
     */
    public readonly Room!: string;

    /**
     * State of the match.
     */
    public readonly State!: ScoringReportMatchState;

    /**
     * If the match has started and is actively in progress, this will be the
     * current question. Otherwise, it will be null.
     */
    public readonly CurrentQuestion!: number | null;

    /**
     * Score for the team in the match. If this is null, scores aren't enabled.
     */
    public readonly Score!: number | null;

    /**
     * Index from ScoringReportMeet.Teams for the other team. If this is null, there wasn't another
     * team scheduled for this match.
     */
    public readonly OtherTeam!: number | null;
}

/**
 * State of a match for a meet within a ScoringReport.
 */
export enum ScoringReportMatchState {
    /**
     * Scoring hasn't started.
     */
    NotStarted,

    /**
     * Match is in progress.
     */
    InProgress,

    /**
     * Match is completed.
     */
    Completed
}

/**
 * Footnote within a ScoringReport.
 */
export class ScoringReportFootnote {
    /**
     * Symbol for the footnote.
     */
    public readonly Symbol!: string;

    /**
     * Text for the footnote.
     */
    public readonly Text!: string;
}

/**
 * Quizzer within a ScoringReport.
 */
export class ScoringReportQuizzer extends ScoringReportItemBase<ScoringReportQuizzerScore> {
    /**
     * Name of the quizzer's team.
     */
    public readonly TeamName!: string;

    /**
     * Number of years the quizzer has been quizzing (as defined by the event coordinator).
     */
    public readonly YearsQuizzing!: number | null;
}

/**
 * Room for a meet within a ScoringReport.
 */
export class ScoringReportRoom {
    /**
     * Name of the room.
     */
    public readonly Name!: string;

    /**
     * Scheduled matches for the room. If there is a null value in the array, the room is either an
     * unscored bye or no match is being played in the room.
     */
    public readonly Matches!: ScoringReportRoomMatch[];
}

/**
 * Match for a room within a ScoringReport.
 */
export class ScoringReportRoomMatch {
    /**
     * If the match has started and is actively in progress, this will be the current question.
     * Otherwise, it will be null.
     */
    public readonly CurrentQuestion!: number | null;

    /**
     * Id for the meet where these teams are defined (if not on the current meet).
     */
    public readonly LinkedMeet!: number | null;

    /**
     * Id of the first team for this match.
     */
    public readonly Team1!: number;

    /**
     * Id for the second team for this match. If this is null, it is a bye.
     */
    public readonly Team2!: number | null;

    /**
     * State of the match.
     */
    public readonly State!: ScoringReportMatchState;

    /**
     * Blockers for the next match to start.
     */
    public readonly Blockers!: ScoringReportRoomBlocker[] | null;
}

/**
 * Blocker for a specific room being started.
 */
export class ScoringReportRoomBlocker {
    /**
     * Id of the room that is blocking this match from starting.
     */
    public readonly RoomId!: number;

    /**
     * Index of the match that is blocking this match from starting.
     */
    public readonly Match!: number;

    /**
     * Index of the team that is blocking this match from starting.
     */
    public readonly Team!: number;

    /**
     * State of the match.
     */
    public readonly State!: ScoringReportMatchState;

    /**
     * If the match has started and is actively in progress, this will be the current question.
     * Otherwise, it will be null.
     */
    public readonly CurrentQuestion!: number | null;
}

/**
 * Match for a meet within a ScoringReport.
 */
export class ScoringReportMeetMatch {
    /**
     * Id for the match.
     */
    public readonly Id!: number;

    /**
     * Start time for the match. If none was set, this will be null.
     */
    public readonly MatchTime!: string | null;

    /**
     * Index of the playoff (starting at 1). If this is null, it isn't a playoff match.
     */
    public readonly PlayoffIndex!: number | null;

    /**
     * Stats about regular questions within the match (index is the question number starting at 0).
     * If this is null, stats weren't included.
     */
    public readonly RegularQuestionStats!: ScoringReportQuestionStat[] | null;
}

/**
 * Stats for regular questions in a ScoringReportMeetMatch.
 */
export class ScoringReportQuestionStat {
    /**
     * Point value for the question.
     */
    public readonly PointValue!: number;

    /**
     * Number of rooms where the question was read.
     */
    public readonly Rooms!: number;

    /**
     * Number of rooms where NO response was given. If at least one correct or incorrect answer was given,
     * it will not be included in this number.
     */
    public readonly NoResponse!: number;

    /**
     * Number of times the question was answered correctly.
     */
    public readonly Correct!: number;

    /**
     * Number of times the question was answered incorrectly.
     */
    public readonly Incorrect!: number;
}