import type { ScheduleTemplate } from "./Scheduling";
import { CompetitionType, MatchRules } from "./MatchRules";

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
 * Usage of a MatchQuestion.
 */
export enum MatchQuestionUsage {
    /**
     * Question during the regular match.
     */
    Regular = 0,

    /**
     * Question during overtime.
     */
    Overtime = 1,

    /**
     * Substitute question.
     */
    Substitute = 2
}

/**
 * Types of persistence.
 */
export enum MeetPersistenceType {
    /**
     * No persistence of scoring data.
     */
    None = 0,

    /**
     * Persist only when the round changes.
     */
    RoundStartOrComplete = 1,

    /**
     * Persist after each question.
     */
    QuestionChange = 2
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
 * Summary of a score for a meet.
 */
export enum ScoreSummaryFootnoteType {
    /**
     * Tie could not be broken by tie breaking rules.
     */
    UnbrokenTie = 1,

    /**
     * Tie was broken by head-to-head record.
     */
    TieBrokenByHeadToHead = 2,

    /**
     * Tie was broken by total points.
     */
    TieBrokenByTotalPoints = 3,

    /**
     * Tie was broken by quiz outs.
     */
    TieBrokenByQuizOuts = 4,

    /**
     * Tie was broken by playoffs.
     */
    TieBrokenByPlayoff = 5,

    /**
     * Tie was broken by average score.
     */
    TieBrokenByAverageScore = 6,
}

/**
 * Metadata about a contact.
 */
export class ContactInfo {
    /**
     * Initializes a new instance of the ContactInfo class.
     */
    constructor() {
        this.Name = undefined;
        this.Phone = undefined;
        this.Email = undefined;
    }

    /**
     * Name of the contact.
     */
    public Name?: string;

    /**
     * Phone number of the contact.
     */
    public Phone?: string;

    /**
     * E-mail address of the contact.
     */
    public Email?: string;
}

/**
 * Rules for quizzing out.
 */
export class MatchQuestion {
    /**
     * Initializes a new instance of the MatchQuestion class.
     */
    constructor() {
        this.PointValue = 0;
        this.PlainText = "";
        this.HtmlText = undefined;
        this.Usage = MatchQuestionUsage.Regular;
    }

    /**
     * Number of points for the question.
     */
    public PointValue: number;

    /**
     * Text for the question formatted as plain text.
     */
    public PlainText: string;

    /**
     * Text for the question formatted as HTML.
     */
    public HtmlText?: string;

    /**
     * Usage for the question.
     */
    public Usage: MatchQuestionUsage;
}

/**
 * Metadata about a scheduled match in a room.
 */
export class MatchScheduledRoom {
    /**
     * Initializes a new instance of the MatchScheduledRoom class.
     */
    constructor() {
        this.TeamIds = undefined;
        this.QuizzerIds = undefined;
        this.PlacementRoomRouting = undefined;
        this.IsByeRound = false;
    }

    /**
     * List of team ids (if this is a team competition).
     */
    public TeamIds?: Set<number>;

    /**
     * List of quizzer ids.
     */
    public QuizzerIds?: Set<number>;

    /**
     * Mapping of placement to the room where the individual is supposed to go. If the place isn't present, the individual is
     * no longer part of the competition.
     */
    public PlacementRoomRouting?: Record<number, number>;

    /**
     * Value indicating whether this is a bye round.
     */
    public IsByeRound: boolean;
}

/**
 * Set of questions.
 */
export class MatchQuestionSet {
    /**
     * Initializes a new instance of the MatchQuestionSet class.
     */
    constructor() {
        this.Questions = {};
    }

    /**
     * Questions for the match.
     */
    public Questions: Record<number, MatchQuestion>;
}

/**
 * Metadata about an individual match.
 */
export class Match {
    /**
     * Initializes a new instance of the Match class.
     */
    constructor() {
        this.Questions = {};
        this.RoomSchedule = {};
        this.MatchTime = undefined;
        this.HasImportedQuestions = undefined;
        this.IsPlayoff = false;
    }

    /**
     * Questions for the match.
     */
    public Questions: Record<number, MatchQuestion>;

    /**
     * Rooms scheduled for this match.
     */
    public RoomSchedule: Record<number, MatchScheduledRoom>;

    /**
     * Scheduled start time for the match (if any).
     */
    public MatchTime?: string;

    /**
     * Value indicating whether this match has imported questions. If this is null, the match
     * was imported in a version of ScoreKeep without knowledge of this field.
     */
    public HasImportedQuestions?: boolean;

    /**
     * Value indicating whether this match has imported questions. If this is null, the match
     * was imported in a version of ScoreKeep without knowledge of this field.
     */
    public IsPlayoff: boolean;
}

/**
 * Overrides for scoring.
 */
export class MeetRanking {
    /**
     * Initializes a new instance of the MeetRanking class.
     */
    constructor() {
        this.IncludeByesInScores = false;
        this.TeamOverrideMessage = undefined;
        this.TeamRankOverrides = undefined;
        this.TeamsRankByWinRate = false;
        this.QuizzerOverrideMessage = undefined;
        this.QuizzerRankOverrides = undefined;
        this.QuizzersRankByAverageCorrectPointValue = undefined;
        this.QuizzersRankByAverageCorrect = false;
    }

    /**
     * Value indicating whether bye rounds should be included in the scores.
     */
    public IncludeByesInScores: boolean;

    /**
     * Message to include if TeamRankOverrides has changed.
     */
    public TeamOverrideMessage?: string;

    /**
     * Ordered ranking of Team.Ids. If this is null, the team ranking hasn't been overridden.
     * Any teams not found in this list should appear AFTER all teams contained in the list.
     */
    public TeamRankOverrides?: number[];

    /**
     * Teams are ranked by win/loss record. 2-way ties broken by head-to-head matches and 3+-way ties broken by points.
     * If this is true, teams will be ranked by ScoreSummary.WinRate instead of win/loss record.
     */
    public TeamsRankByWinRate: boolean;

    /**
     * Message to include if QuizzerRankOverrides has changed.
     */
    public QuizzerOverrideMessage?: string;

    /**
     * Ordered ranking of Quizzer.Ids. If this is null, the quizzer ranking hasn't been overridden.
     * Any quizzer not found in this list should appear AFTER all quizzers contained in the list.
     */
    public QuizzerRankOverrides?: number[];

    /**
     * Quizzers are ranked by average score, then by total forward quiz outs, and then by success rate for answered questions.
     * If this value is set, they will first be ranked the average number of questions answered correctly per match with this point value.
     */
    public QuizzersRankByAverageCorrectPointValue?: number;

    /**
     * Value indicating whether to rank by quizzer's average correct value. This will take precedence over QuizzersRankByAverageCorrectPointValue.
     */
    public QuizzersRankByAverageCorrect: boolean;
}

/**
 * Information about building a schedule.
 */
export class MeetSchedule {
    /**
     * Initializes a new instance of the MeetSchedule class.
     */
    constructor() {
        this.MatchLengthInMinutes = 0;
        this.LinkedMeetIds = undefined;
        this.OptimizedSchedule = undefined;
        this.CustomSchedule = undefined;
    }

    /**
     * Number of minutes to allocate for each match.
     */
    public MatchLengthInMinutes: number;

    /**
     * Ordered list of ids for the linked meets (including the current meet). If there aren't any linked meets, this will be null.
     */
    public LinkedMeetIds?: number[];

    /**
     * Optional optmized schedule for the meets.
     */
    public OptimizedSchedule?: ScheduleTemplate;

    /**
     * Optional custom schedule for the meets.
     */
    public CustomSchedule?: ScheduleTemplate;
}

/**
 * Progress of scoring for a given meet.
 */
export class MeetScoringProgress {
    /**
     * Initializes a new instance of the MeetScoringProgress class.
     */
    constructor() {
        this.HasScoringStarted = false;
        this.MatchesCompletedForAllRooms = 0;
        this.MatchesCompletedForSomeRooms = 0;
        this.MatchesCompletedForAllTeams = 0;
        this.MatchesCompletedForSomeTeams = 0;
        this.MatchesCompletedForAllQuizzers = 0;
        this.MatchesCompletedForSomeQuizzers = 0;
        this.TotalScorableMatches = 0;
    }

    /**
     * Value indicating whether scoring has started.
     */
    public HasScoringStarted: boolean;

    /**
     * Number of matches completed for all rooms (excluding bye rounds).
     */
    public MatchesCompletedForAllRooms: number;

    /**
     * Number of matches completed for some rooms, but not all (excluding bye rounds).
     */
    public MatchesCompletedForSomeRooms: number;

    /**
     * Number of scoreable matches.
     */
    public TotalScorableMatches: number;

    /**
     * Number of matches completed for all teams (excluding bye rounds).
     */
    public MatchesCompletedForAllTeams: number;

    /**
     * Number of matches completed for some teams, but not all (excluding bye rounds).
     */
    public MatchesCompletedForSomeTeams: number;

    /**
     * Number of matches completed for all quizzers (excluding bye rounds).
     */
    public MatchesCompletedForAllQuizzers: number;

    /**
     * Number of matches completed for some quizzers, but not all (excluding bye rounds).
     */
    public MatchesCompletedForSomeQuizzers: number;
}

/**
 * Scope for a question set for either JBQ or TBQ questions.
 */
export class QuestionSetScope {
    /**
     * Initializes a new instance of the QuestionSetScope class.
     */
    constructor() {
        this.CompetitionType = CompetitionType.JBQ;
        this.Name = undefined;
        this.JbqMode = undefined;
        this.JbqType = undefined;
        this.JbqQuestionCategories = undefined;
        this.TbqBookSections = undefined;
    }

    /**
     * Competition Type.
     */
    public CompetitionType: CompetitionType;

    /**
     * Name of the Question Set Scope.
     */
    public Name?: string;

    /**
     * JBQ Mode.
     */
    public JbqMode?: any; // QuestionSetScopeJbqMode - type not provided

    /**
     * JBQ Scope Type.
     */
    public JbqType?: any; // QuestionSetScopeJbqType - type not provided

    /**
     * JBQ Question Categories.
     */
    public JbqQuestionCategories?: Set<any>; // JbqQuestionCategory - type not provided

    /**
     * TBQ Book Sections.
     */
    public TbqBookSections?: any[]; // BookSectionMetadata[] - type not provided
}

/**
 * Metadata about an individual meet.
 */
export class Meet {
    /**
     * Initializes a new instance of the Meet class.
     */
    constructor() {
        this.Id = 0;
        this.RemoteMeetId = undefined;
        this.RemoteDivisionId = undefined;
        this.RemoteMeetName = undefined;
        this.Name = "";
        this.IsOffline = false;
        this.ContactInfo = "";
        this.MatchRules = new MatchRules();
        this.HasCustomRules = false;
        this.PointValueCountsOverride = undefined;
        this.Matches = {};
        this.AdditionalQuestions = undefined;
        this.Teams = {};
        this.Quizzers = {};
        this.RoomNames = {};
        this.Scheduling = undefined;
        this.Ranking = undefined;
        this.StartingTemplateRoundOverride = undefined;
        this.TemplateRoundCountOverride = undefined;
        this.HasUnsyncedChanges = false;
        this.IsScoringActive = false;
        this.IsClosed = false;
        this.QuestionSetScope = undefined;
        this.QuestionSetScopeOverride = undefined;
    }

    /**
     * Id for the item internal to the scoring system.
     */
    public Id: number;

    /**
     * Id for the meet in the Registration System.
     */
    public RemoteMeetId?: string;

    /**
     * Id for the meet's division in the Registration System.
     */
    public RemoteDivisionId?: string;

    /**
     * Name of the remote meet.
     */
    public RemoteMeetName?: string;

    /**
     * Name of the item.
     */
    public Name: string;

    /**
     * Value indicating whether this meet is only persisted offline.
     */
    public IsOffline: boolean;

    /**
     * Contact information to provide support for the meet.
     */
    public ContactInfo: string;

    /**
     * Rules about matches for the meet.
     */
    public MatchRules: MatchRules;

    /**
     * Value indicating whether MatchRules is a custom value specific to this meet or if it should match
     * the value of the database.
     */
    public HasCustomRules: boolean;

    /**
     * Count of the number of questions for each point value that should override the rules. This will only be set if questions were imported.
     */
    public PointValueCountsOverride?: Record<number, number>;

    /**
     * List of matches for this meet (e.g. schedule, question sets, etc.).
     */
    public Matches: Record<number, Match>;

    /**
     * List of additional question sets for this meet (e.g. schedule, question sets, etc.).
     */
    public AdditionalQuestions?: Record<number, MatchQuestionSet>;

    /**
     * List of teams for this meet.
     */
    public Teams: Record<number, Team>;

    /**
     * List of quizzers for this meet.
     */
    public Quizzers: Record<number, Quizzer>;

    /**
     * List of room names.
     */
    public RoomNames: Record<number, string>;

    /**
     * Data about scheduling the match.
     */
    public Scheduling?: MeetSchedule;

    /**
     * Ranking configuration for the meet.
     */
    public Ranking?: MeetRanking;

    /**
     * Override for the first round from the template to be used when generating a schedule.
     */
    public StartingTemplateRoundOverride?: number;

    /**
     * Override for the number of rounds from the template to be used when generating a schedule.
     */
    public TemplateRoundCountOverride?: number;

    /**
     * Value indicating whether there are changes that haven't been synced to the remote system.
     */
    public HasUnsyncedChanges: boolean;

    /**
     * Value indicating whether scoring is active.
     */
    public IsScoringActive: boolean;

    /**
     * Value indicating whether the meet is closed.
     */
    public IsClosed: boolean;

    /**
     * Scope of the question set.
     */
    public QuestionSetScope?: QuestionSetScope;

    /**
     * Override scope of the question set.
     */
    public QuestionSetScopeOverride?: QuestionSetScope;
}

/**
 * Manifest for a given meet.
 */
export class MeetManifest {
    /**
     * Initializes a new instance of the MeetManifest class.
     */
    constructor() {
        this.Meet = new Meet();
        this.TeamScores = {};
        this.QuizzerScores = {};
        this.RoomSummaries = {};
        this.QuestionSummaries = {};
        this.Scores = {};
        this.ScoringProgress = new MeetScoringProgress();
        this.MeetNames = undefined;
    }

    /**
     * Meet for the manifest.
     */
    public Meet: Meet;

    /**
     * Summary of team scores.
     */
    public TeamScores: Record<number, ScoreSummary>;

    /**
     * Summary of quizzer scores.
     */
    public QuizzerScores: Record<number, ScoreSummary>;

    /**
     * Summary of individual room scores (i.e., Scores).
     */
    public RoomSummaries: Record<string, RoomSummary>; // Key is "(MatchId, RoomId)"

    /**
     * Summary of stats for individual MatchQuestionUsage.Regular questions.
     */
    public QuestionSummaries: Record<string, QuestionSummary>; // Key is "(MatchId, QuestionId)"

    /**
     * Scores for an individual room.
     */
    public Scores: Record<string, Room>; // Key is "(MatchId, RoomId)"

    /**
     * Progress of scores for the meet.
     */
    public ScoringProgress: MeetScoringProgress;

    /**
     * Optional list of names for ScoreSummary.TotalPointsPerMeet.
     */
    public MeetNames?: string[];
}

/**
 * Official individual information.
 */
export class Official {
    /**
     * Initializes a new instance of the Official class.
     */
    constructor() {
        this.Id = 0;
        this.RemotePersonId = undefined;
        this.RemoteChurchId = undefined;
        this.Name = "";
        this.TeamId = undefined;
        this.QuizMasterPreference = undefined;
        this.JudgePreference = undefined;
        this.ScorekeeperPreference = undefined;
        this.TimekeeperPreference = undefined;
        this.YearsOfExperience = 0;
        this.DuplicateRemotePersonIds = new Set<string>();
        this.IsYouth = false;
        this.IsCertified = false;
        this.IsPicked = false;
        this.IsHidden = false;
    }

    /**
     * Id for the item internal to the scoring system.
     */
    public Id: number;

    /**
     * Id for the person in the Registration System.
     */
    public RemotePersonId?: string;

    /**
     * Id for the person's church in the Registration System.
     */
    public RemoteChurchId?: string;

    /**
     * Name of the item.
     */
    public Name: string;

    /**
     * Id of the team (if any) for this official.
     */
    public TeamId?: number;

    /**
     * Prioritized preference for the Quizmaster role where lowest means most preferred and null means they shouldn't be assigned the role.
     */
    public QuizMasterPreference?: number;

    /**
     * Prioritized preference for the Judge role where lowest means most preferred and null means they shouldn't be assigned the role.
     */
    public JudgePreference?: number;

    /**
     * Prioritized preference for the Scorekeeper role where lowest means most preferred and null means they shouldn't be assigned the role.
     */
    public ScorekeeperPreference?: number;

    /**
     * Prioritized preference for the Timekeeper role where lowest means most preferred and null means they shouldn't be assigned the role.
     */
    public TimekeeperPreference?: number;

    /**
     * Years of experience for this individual.
     */
    public YearsOfExperience: number;

    /**
     * Set of RemotePersonId that also refer to this official.
     */
    public DuplicateRemotePersonIds: Set<string>;

    /**
     * Value indicating whether this official is a youth.
     */
    public IsYouth: boolean;

    /**
     * Value indicating whether the official is certified.
     */
    public IsCertified: boolean;

    /**
     * Value indicating whether the individual has been picked.
     */
    public IsPicked: boolean;

    /**
     * Value indicating whether the official should be hidden.
     */
    public IsHidden: boolean;
}

/**
 * Individual research for a question in a Room.
 */
export class QuestionResearch {
    /**
     * Initializes a new instance of the QuestionResearch class.
     */
    constructor() {
        this.InputPhrase = undefined;
        this.SearchPhrase = undefined;
        this.Notes = undefined;
        this.SearchSelections = [];
        this.Remarks = [];
        this.ScriptureRemarks = [];
        this.AnalysisScopeRemarks = [];
        this.SearchTerms = [];
        this.HtmlSettings = {};
    }

    /**
     * The current unprocessed input phrase from the user.
     */
    public InputPhrase?: string;

    /**
     * The current search phrase from the user.
     */
    public SearchPhrase?: string;

    /**
     * The current notes from the user.
     */
    public Notes?: string;

    /**
     * The current search items selected by the user.
     */
    public SearchSelections: string[];

    /**
     * The current set of remarks entered by the user.
     */
    public Remarks: any[]; // RemarkItem[] - type not provided

    /**
     * The current set of remarks entered by the user.
     */
    public ScriptureRemarks: any[]; // ScriptureRemarkItem[] - type not provided

    /**
     * The current set of remarks entered by the user.
     */
    public AnalysisScopeRemarks: any[]; // AnalysisScopeRemarkItem[] - type not provided

    /**
     * The current set of search terms entered by the user.
     */
    public SearchTerms: string[];

    /**
     * The current set of Html settings.
     */
    public HtmlSettings: Record<string, string>;
}

/**
 * Summary of stats about a specific question.
 */
export class QuestionSummary {
    /**
     * Initializes a new instance of the QuestionSummary class.
     */
    constructor() {
        this.PointValue = 0;
        this.Rooms = 0;
        this.NoResponse = 0;
        this.Correct = 0;
        this.Incorrect = 0;
    }

    /**
     * Point value for the question.
     */
    public PointValue: number;

    /**
     * Number of rooms where the question was read.
     */
    public Rooms: number;

    /**
     * Number of rooms where NO response was given. If at least one correct or incorrect answer was given, it will not be included in this number.
     */
    public NoResponse: number;

    /**
     * Number of times the question was answered correctly.
     */
    public Correct: number;

    /**
     * Number of times the question was answered incorrectly.
     */
    public Incorrect: number;
}

/**
 * Quizzer information.
 */
export class Quizzer {
    /**
     * Initializes a new instance of the Quizzer class.
     */
    constructor() {
        this.Id = 0;
        this.RemotePersonId = undefined;
        this.RemoteChurchId = undefined;
        this.Name = "";
        this.ChurchName = undefined;
        this.TeamId = undefined;
        this.DateOfBirth = undefined;
        this.Grade = undefined;
        this.YearsQuizzing = undefined;
        this.DuplicateRemotePersonIds = new Set<string>();
        this.IsHidden = false;
        this.IsVerifiedRemotely = undefined;
    }

    /**
     * Id for the item internal to the scoring system.
     */
    public Id: number;

    /**
     * Id for the person in the Registration System.
     */
    public RemotePersonId?: string;

    /**
     * Id for the person's church in the Registration System.
     */
    public RemoteChurchId?: string;

    /**
     * Name of the item.
     */
    public Name: string;

    /**
     * Name of the church for this quizzer.
     */
    public ChurchName?: string;

    /**
     * Id of the team (if any) for this quizzer.
     */
    public TeamId?: number;

    /**
     * Date of birth for the quizzer.
     */
    public DateOfBirth?: string;

    /**
     * Grade for the quizzer.
     */
    public Grade?: string;

    /**
     * Number of years this quizzer has been quizzing.
     */
    public YearsQuizzing?: number;

    /**
     * Set of RemotePersonId that also refer to this quizzer.
     */
    public DuplicateRemotePersonIds: Set<string>;

    /**
     * Value indicating whether the quizzer should be hidden.
     */
    public IsHidden: boolean;

    /**
     * Value indicating whether the quizzer's RemotePersonId has been verified remotely.
     */
    public IsVerifiedRemotely?: boolean;
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
 * State of a quizzer within a room.
 */
export class RoomQuizzer {
    /**
     * Initializes a new instance of the RoomQuizzer class.
     */
    constructor() {
        this.TeamId = undefined;
        this.FoulCount = 0;
        this.TotalFoulPoints = 0;
        this.TotalPoints = 0;
        this.LastQuestionAnswered = undefined;
        this.Color = BuzzerColor.Red;
        this.Position = undefined;
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
 * Summary of a room's scores.
 */
export class RoomSummary {
    /**
     * Initializes a new instance of the RoomSummary class.
     */
    constructor() {
        this.TeamScores = {};
        this.CurrentQuestion = undefined;
    }

    /**
     * Mapping of teams to their scores.
     */
    public TeamScores: Record<number, number>;

    /**
     * Current question for the room. If this is null, the match is completed.
     */
    public CurrentQuestion?: number;
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
 * Metadata about a single room in a match.
 */
export class Room {
    /**
     * Initializes a new instance of the Room class.
     */
    constructor() {
        this.RedTeamId = undefined;
        this.GreenTeamId = undefined;
        this.CurrentQuestion = 0;
        this.Questions = {};
        this.PointValueOverrides = {};
        this.Quizzers = {};
        this.Teams = {};
        this.IsCompleted = false;
        this.TimerStarted = undefined;
        this.TimerRemaining = undefined;
        this.MatchStarted = undefined;
        this.MatchStopped = undefined;
        this.HasUnsyncedChanges = false;
        this.Research = {};
        this.IsQuestionSetScopeEnabled = undefined;
        this.QuestionSetScope = undefined;
        this.RemoteVersion = undefined;
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
    public Research: Record<number, QuestionResearch>;

    /**
     * Value indicating whether to use the question scope.
     */
    public IsQuestionSetScopeEnabled?: boolean;

    /**
     * Scope of the question set.
     */
    public QuestionSetScope?: QuestionSetScope;

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
 * Summary of a score for a meet.
 */
export class ScoreSummary {
    /**
     * Initializes a new instance of the ScoreSummary class.
     */
    constructor() {
        this.Rank = undefined;
        this.Order = undefined;
        this.RankMessage = undefined;
        this.RankFootnote = undefined;
        this.Wins = new Set<number>();
        this.HeadToHeadRecord = {};
        this.PlayoffRecord = {};
        this.Losses = new Set<number>();
        this.Playoffs = new Set<number>();
        this.TotalPointsPerMeet = undefined;
        this.Matches = 0;
        this.ScorableMatches = 0;
        this.TotalPoints = 0;
        this.AverageScore = 0;
        this.AverageCorrect = 0;
        this.WinRate = 0;
        this.TotalQuizOutsForward = 0;
        this.TotalCorrect = 0;
        this.TotalIncorrect = 0;
        this.SuccessRate = 0;
        this.TotalPointValueScores = {};
    }

    /**
     * Numerical rank (starting at 1) for the score.
     */
    public Rank?: number;

    /**
     * Numerical sort order for the score.
     */
    public Order?: number;

    /**
     * Message describing the ranking.
     */
    public RankMessage?: string;

    /**
     * Optional footnote for the Rank and Order.
     */
    public RankFootnote?: ScoreSummaryFootnoteType;

    /**
     * Matches where a win occurred.
     */
    public Wins: Set<number>;

    /**
     * Record of head-to-head against another team. A positive number indicates this team has won more times.
     */
    public HeadToHeadRecord: Record<number, number>;

    /**
     * Record of playoffs against another team. A positive number indicates this team has won more times.
     */
    public PlayoffRecord: Record<number, number>;

    /**
     * Matches where a loss occurred.
     */
    public Losses: Set<number>;

    /**
     * Playoff matches.
     */
    public Playoffs: Set<number>;

    /**
     * Total points for individual meets (a null value means there was no total). The order of the meets is arbitrary for the caller. This property may be null and is not serialized.
     */
    public TotalPointsPerMeet?: (number | null)[];

    /**
     * Number of rounds to be used for calculating the average.
     */
    public Matches: number;

    /**
     * Number of matches that can be scored (i.e., non bye round).
     */
    public ScorableMatches: number;

    /**
     * Total score at the meet.
     */
    public TotalPoints: number;

    /**
     * Average score for this item.
     */
    public AverageScore: number;

    /**
     * Average correctly answered questions for this item.
     */
    public AverageCorrect: number;

    /**
     * Percentage of matches played that were won (0 - 100).
     */
    public WinRate: number;

    /**
     * Number of forward quizouts.
     */
    public TotalQuizOutsForward: number;

    /**
     * Number of questions answered correctly.
     */
    public TotalCorrect: number;

    /**
     * Number of questions answered incorrectly.
     */
    public TotalIncorrect: number;

    /**
     * Percentage (0 - 100) of questions answered successfully.
     */
    public SuccessRate: number;

    /**
     * Number of correct questions per point value.
     */
    public TotalPointValueScores: Record<number, number>;
}

/**
 * Metadata about a team.
 */
export class Team {
    /**
     * Initializes a new instance of the Team class.
     */
    constructor() {
        this.Id = 0;
        this.RemoteTeamId = undefined;
        this.RemotePersistentId = undefined;
        this.RemoteChurchId = undefined;
        this.Name = "";
        this.League = undefined;
        this.TotalQuizzerId = undefined;
        this.FullChurchName = undefined;
        this.Church = undefined;
        this.City = undefined;
        this.State = undefined;
        this.PrimaryContact = new ContactInfo();
        this.Coach = new ContactInfo();
        this.DefaultPositions = {};
        this.IsHidden = false;
    }

    /**
     * Id for the item internal to the scoring system.
     */
    public Id: number;

    /**
     * Id for the team in the Registration System.
     */
    public RemoteTeamId?: string;

    /**
     * Id for the church for this team within the registration system.
     */
    public RemotePersistentId?: string;

    /**
     * Id for the church for this team within the registration system.
     */
    public RemoteChurchId?: string;

    /**
     * Name of the item.
     */
    public Name: string;

    /**
     * League for the team.
     */
    public League?: string;

    /**
     * Id for the quizzer containing totals for this team.
     */
    public TotalQuizzerId?: number;

    /**
     * Full name of the church.
     */
    public FullChurchName?: string;

    /**
     * Name of the church for the team.
     */
    public Church?: string;

    /**
     * City of the church for the team.
     */
    public City?: string;

    /**
     * State of the church for the team.
     */
    public State?: string;

    /**
     * Primary contact for the team.
     */
    public PrimaryContact: ContactInfo;

    /**
     * Contact information for the coach.
     */
    public Coach: ContactInfo;

    /**
     * The default positions for seating the quizzers. Maps position ids to quizzer ids.
     */
    public DefaultPositions: Record<number, number>;

    /**
     * Value indicating whether the team should be hidden in the UI.
     */
    public IsHidden: boolean;
}