import type { ScheduleTemplate } from "./Scheduling";
import { MatchRules } from "./MatchRules";

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
 * Metadata about an individual meet.
 */
export class Meet {

    /**
     * Initializes a new instance of the Meet class.
     */
    constructor() {
        this.Id = 0;
        this.Name = "";
        this.IsOffline = false;
        this.ContactInfo = "";
        this.MatchRules = new MatchRules();
        this.HasCustomRules = false;
        this.Matches = {};
        this.Teams = {};
        this.Quizzers = {};
        this.RoomNames = {};
        this.HasUnsyncedChanges = false;
        this.IsScoringActive = false;
        this.IsClosed = false;
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
        this.Name = "";
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

/**
 * Metadata about a contact.
 */
export class ContactInfo {

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
 * Quizzer information.
 */
export class Quizzer {

    /**
     * Initializes a new instance of the Quizzer class.
     */
    constructor() {
        this.Id = 0;
        this.Name = "";
        this.DuplicateRemotePersonIds = new Set<string>();
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
 * Official individual information.
 */
export class Official {

    /**
     * Initializes a new instance of the Official class.
     */
    constructor() {
        this.Id = 0;
        this.Name = "";
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
 * Metadata about an individual match.
 */
export class Match {

    /**
     * Initializes a new instance of the Match class.
     */
    constructor() {
        this.Questions = {};
        this.RoomSchedule = {};
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
 * Rules for quizzing out.
 */
export class MatchQuestion {

    /**
     * Initializes a new instance of the MatchQuestion class.
     */
    constructor() {
        this.PointValue = 0;
        this.PlainText = "";
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
 * Metadata about a scheduled match in a room.
 */
export class MatchScheduledRoom {

    /**
     * Initializes a new instance of the MatchScheduledRoom class.
     */
    constructor() {
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
 * Overrides for scoring.
 */
export class MeetRanking {

    /**
     * Initializes a new instance of the MeetRanking class.
     */
    constructor() {
        this.IncludeByesInScores = false;
        this.TeamsRankByWinRate = false;
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
     * If this is true, teams will be ranked by win rate instead of win/loss record.
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

    /**
     * Value indicating whether to rank quizzers by years in quiz.
     */
    public QuizzersRankByYearsInQuiz?: MeetRankingSortType;
}

/**
 * Sort type for ranking.
 */
export enum MeetRankingSortType {
    /**
     * Sort in ascending order. Any missing value will be at the end.
     */
    Ascending = 0,

    /**
     * Sort in descending order. Any missing value will be at the end.
     */
    Descending = 1
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