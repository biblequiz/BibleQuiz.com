import type { ScheduleTemplate } from "./Scheduling";

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
     * Original Name when the team was registered.
     */
    public OriginalName: string | null | undefined;

    /**
     * Original Church when the team was registered.
     */
    public OriginalChurchName: string | null | undefined;

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
        this.DuplicateRemotePersonIds = [];
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
    public DuplicateRemotePersonIds: string[];

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
 * Reference to a team or quizzer.
 */
export interface TeamOrQuizzerReference {
    /**
     * Name of the team or quizzer.
     */
    Name: string;

    /**
     * Name of the quizzer's team. This will be null for teams.
     */
    TeamName?: string | null;

    /**
     * Name of the team or quizzer's church.
     */
    ChurchName?: string | null;
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