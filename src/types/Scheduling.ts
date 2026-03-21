/**
 * Template for building a schedule.
 */
export class ScheduleTemplate {
    /**
     * Initializes a new instance of the ScheduleTemplate class.
     */
    constructor() {
        this.ByTeamCount = {};
        this.ByQuizzerCount = {};
    }

    /**
     * Schedules for Meets indexed by number of teams in the meet. If there are linked meets, it's the total
     * number of meets.
     */
    public ByTeamCount: Record<number, ScheduleTemplateMeet>;

    /**
     * Schedules for Meets indexed by number of quizzers in the meet.
     */
    public ByQuizzerCount: Record<number, ScheduleTemplateMeet>;
}

/**
 * Template for building the schedule of a meet.
 */
export class ScheduleTemplateMeet {
    /**
     * Initializes a new instance of the ScheduleTemplateMeet class.
     */
    constructor() {
        this.Matches = {};
        this.Rooms = 0;
    }

    /**
     * List of scheduling matches for this meet.
     */
    public Matches: Record<number, ScheduleTemplateMatch>;

    /**
     * Number of rooms required for the meet.
     */
    public Rooms: number;

    /**
     * Number of teams per meet with a key starting at 1 for each meet. If this is null or empty, there are no linked meets associated with this template.
     */
    public PerMeetTeamCount?: Record<number, number>;
}

/**
 * Template for building the schedule of an individual match.
 */
export class ScheduleTemplateMatch {
    /**
     * Initializes a new instance of the ScheduleTemplateMatch class.
     */
    constructor() {
        this.RoomSchedule = {};
    }

    /**
     * Rooms scheduled for this match.
     */
    public RoomSchedule: Record<number, MatchScheduledRoom>;
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
