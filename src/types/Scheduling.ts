import type { MatchScheduledRoom } from "./Meets";

/**
 * Template for building a schedule.
 */
export class ScheduleTemplate {

    /**
     * Initializes a new instance of the ScheduleTemplate class.
     */
    constructor() {
        this.ByTeamCount = {};
    }

    /**
     * Schedules for Meets indexed by number of teams in the meet. If there are linked meets, it's the total
     * number of meets.
     */
    public ByTeamCount: Record<number, ScheduleTemplateMeet>;
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