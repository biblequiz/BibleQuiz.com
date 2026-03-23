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
     * List of team or quizzers routed from another room.
     */
    public RoutedTeamOrQuizzers?: Set<RankRoutedTeamOrQuizzer>;

    /**
     * Value indicating whether this is a bye round.
     */
    public IsByeRound: boolean;
}

/**
 * Team or quizzer determined based on rank in a previous room.
 */
export class RankRoutedTeamOrQuizzer {

    /**
     * Initializes a new instance of the RankRoutedTeamOrQuizzer class.
     * @param roomId Id for the room where the team or quizzer previously played.
     * @param rankOrder Ranked order of the team or quizzer in the previous room.
     */
    constructor(roomId: number, rankOrder: number) {
        this.RoomId = roomId;
        this.RankOrder = rankOrder;
    }

    /**
     * Id for the room where the team or quizzer previously played.
     */
    public RoomId: number;

    /**
     * Ranked order of the team or quizzer in the previous room.
     */
    public RankOrder: number;
}
