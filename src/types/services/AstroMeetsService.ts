import type { AuthManager } from "../AuthManager";
import type { MatchRules } from "../MatchRules";
import type { RankRoutedTeamOrQuizzer, ScheduleTemplate } from "../Scheduling";
import type { TeamOrQuizzerReference } from "../Meets";
import type { OnlineDatabaseSummary } from "./AstroDatabasesService";
import {
    RemoteServiceUrlBase,
    RemoteServiceUtility,
} from "./RemoteServiceUtility";

const URL_ROOT_PATH = "/api/v1.0/events";

/**
 * Wrapper for the Astro Meets service.
 */
export class AstroMeetsService {
    /**
     * Gets the settings for a meet.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     * @param meetId Id for the meet. If 0 is given, a default will be returned.
     * @param isIndividualCompetition Value indicating whether this is an individual competition. Only required when meetId is less than 1.
     *
     * @returns Meet settings.
     */
    public static getMeet(
        auth: AuthManager,
        eventId: string,
        databaseId: string,
        meetId: number,
        isIndividualCompetition: boolean = false,
    ): Promise<OnlineMeetSettings> {
        return RemoteServiceUtility.executeHttpRequest<OnlineMeetSettings>(
            auth,
            "GET",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/databases/${databaseId}/meets/${meetId}`,
            RemoteServiceUtility.getFilteredUrlParameters({
                isIndividualCompetition,
            }),
        );
    }

    /**
     * Parses a seed report from a file containing multiple divisions.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     * @param form Form contents with "file" set with the file.
     * @param isIndividualCompetition Value indicating whether the report is for an individual competition.
     *
     * @returns Parsed ordered list of teams or quizzers.
     */
    public static parseSeedReport(
        auth: AuthManager,
        eventId: string,
        databaseId: string,
        form: FormData,
        isIndividualCompetition: boolean = false,
    ): Promise<OnlineMeetSettings[]> {
        return RemoteServiceUtility.executeHttpRequest<OnlineMeetSettings[]>(
            auth,
            "POST",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/databases/${databaseId}/meets/0/seedReport`,
            RemoteServiceUtility.getFilteredUrlParameters({
                isIndividualCompetition,
            }),
            form,
            true,
        );
    }

    /**
     * Retrieves the current custom schedule template as a file for the meet.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     * @param meetId Id for the meet.
     * @param settings Settings for scheduling.
     *
     * @returns Custom schedule template for the meet.
     */
    public static getScheduleTemplate(
        auth: AuthManager,
        eventId: string,
        databaseId: string,
        meetId: number,
        settings: OnlineMeetSchedulingSettings,
    ): Promise<void> {
        return RemoteServiceUtility.downloadFromHttpRequest(
            auth,
            "POST",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/databases/${databaseId}/meets/${meetId}/scheduleTemplate`,
            undefined,
            undefined,
            settings,
        );
    }

    /**
     * Creates or updates a meet.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     * @param meetId Id for the meet. Use 0 or negative for a new meet.
     * @param settings Settings for the meet.
     *
     * @returns Updated database summary.
     */
    public static createOrUpdateMeet(
        auth: AuthManager,
        eventId: string,
        databaseId: string,
        meetId: number,
        settings: OnlineMeetSettings,
    ): Promise<OnlineDatabaseSummary> {
        return RemoteServiceUtility.executeHttpRequest<OnlineDatabaseSummary>(
            auth,
            "PUT",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/databases/${databaseId}/meets/${meetId}`,
            undefined,
            settings,
        );
    }

    /**
     * Creates multiple meets.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     * @param settings Settings for the meets.
     *
     * @returns Updated database summary.
     */
    public static bulkCreateMeets(
        auth: AuthManager,
        eventId: string,
        databaseId: string,
        settings: OnlineMeetSettings[],
    ): Promise<OnlineDatabaseSummary> {
        return RemoteServiceUtility.executeHttpRequest<OnlineDatabaseSummary>(
            auth,
            "PUT",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/databases/${databaseId}/meets/0/bulk`,
            undefined,
            settings,
        );
    }

    /**
     * Deletes a meet.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     * @param meetId Id for the meet.
     */
    public static deleteMeet(
        auth: AuthManager,
        eventId: string,
        databaseId: string,
        meetId: number,
    ): Promise<OnlineDatabaseSummary> {
        return RemoteServiceUtility.executeHttpRequest<OnlineDatabaseSummary>(
            auth,
            "DELETE",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/databases/${databaseId}/meets/${meetId}`,
        );
    }

    /**
     * Refreshes the schedule preview based on the provided settings.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     * @param meetId Id for the meet. Use 0 or negative for a new meet.
     * @param settings Scheduling settings for the meet.
     * @param useOptimizer Value indicating whether to use the optimizer.
     *
     * @returns Schedule preview.
     */
    public static refreshSchedulePreview(
        auth: AuthManager,
        eventId: string,
        databaseId: string,
        meetId: number,
        settings: OnlineMeetSchedulingSettings,
        useOptimizer: boolean = false,
    ): Promise<OnlineMeetSchedulePreview> {
        return RemoteServiceUtility.executeHttpRequest<OnlineMeetSchedulePreview>(
            auth,
            "POST",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/databases/${databaseId}/meets/${meetId}/schedule`,
            RemoteServiceUtility.getFilteredUrlParameters({ o: useOptimizer }),
            settings,
        );
    }

    /**
     * Generates and downloads schedule statistics as an Excel file.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     * @param meetId Id for the meet.
     * @param settings Scheduling settings for the meet.
     * @param useOptimizer Value indicating whether to use the optimizer.
     */
    public static downloadScheduleStats(
        auth: AuthManager,
        eventId: string,
        databaseId: string,
        meetId: number,
        settings: OnlineMeetSchedulingSettings,
        useOptimizer: boolean,
    ): Promise<void> {
        return RemoteServiceUtility.downloadFromHttpRequest(
            auth,
            "POST",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/databases/${databaseId}/meets/${meetId}/schedule/stats`,
            RemoteServiceUtility.getFilteredUrlParameters({ o: useOptimizer }),
            undefined,
            settings,
        );
    }
}

/**
 * Settings for a meet.
 */
export interface OnlineMeetSettings {
    /**
     * Name of the meet.
     */
    Name: string;

    /**
     * Custom rules for this meet. If null, the database's default rules will be used.
     */
    CustomRules?: MatchRules | null;

    /**
     * Names of the rooms for this meet.
     */
    RoomNames: string[];

    /**
     * Length of matches in minutes.
     */
    MatchLengthInMinutes: number;

    /**
     * Ranking algorithm within a match.
     */
    MatchRanking: OnlineMeetMatchRankingType;

    /**
     * Scheduling settings. If this is null, the schedule is assumed not to have changed.
     */
    Schedule?: OnlineMeetSchedulingSettings | null;

    /**
     * Match times by match id. Key is the match id, value is the TimeSpan string.
     * If null or undefined, the server will calculate default times based on MatchLengthInMinutes.
     * If all times follow the default pattern, send null to let the server use defaults.
     */
    MatchTimes?: Record<number, string | null> | null;

    /**
     * Version id for the meet. This is used to determine if someone else changed the meet since it was last loaded.
     * This can only be null for a new meet.
     */
    VersionId?: string | null;

    /**
     * Preview of the current schedule (if any). This is read-only from the server.
     */
    readonly Preview?: OnlineMeetSchedulePreview | null;

    /**
     * All teams for the database. This is read-only from the server.
     */
    readonly AllTeams?: Record<number, TeamOrQuizzerReference>;

    /**
     * All quizzers for the database.
     */
    readonly AllQuizzers?: Record<number, TeamOrQuizzerReference>;

    /**
     * All meets in this database where scoring has started.
     */
    readonly AllMeetsWithScores?: number[];
}

/**
 * Settings for scheduling a meet.
 */
export interface OnlineMeetSchedulingSettings {
    /**
     * Ids of linked meets. If there are more than one, the meets are linked.
     */
    LinkedMeetIds: number[];

    /**
     * Ordered list of team ids for this meet (if team competition).
     */
    TeamIds: number[];

    /**
     * Value indicating whether this meet is an individual competition. This can only be set when the meet is created. If this is true, OnlineMeetSettings.AllQuizzers
     * will be populated. Otherwise, OnlineMeetSettings.AllTeams will be populated.
     */
    IsIndividualCompetition: boolean;

    /**
     * Ordered list of quizzer ids for this meet (if individual competition).
     */
    QuizzerIds: number[];

    /**
     * Value indicating whether bye rounds should be included in scores.
     */
    IncludeByesInScores: boolean;

    /**
     * Value indicating whether there is a custom schedule.
     */
    HasCustomSchedule: boolean;

    /**
     * Value indicating whether to use the optimizer.
     */
    UseOptimizer: boolean;

    /**
     * Value indicating whether the CustomSchedule and OptimizedSchedule have been changed.
     * If this is false, the existing values in the database will be used.
     */
    IsScheduleChanged: boolean;

    /**
     * Custom schedule template for the meet.
     */
    CustomSchedule?: ScheduleTemplate | null;

    /**
     * Optimized schedule template for the meet.
     */
    OptimizedSchedule?: ScheduleTemplate | null;

    /**
     * Override for the starting round in the template.
     */
    StartingTemplateRoundOverride?: number | null;

    /**
     * Override for the number of rounds from the template.
     */
    TemplateRoundCountOverride?: number | null;

    /**
     * Minimum number of quizzers in a room during an individual competition.
     */
    MinQuizzersPerRoom?: number | null;

    /**
     * Desired number of quizzers in a room during an individual competition.
     */
    DesiredQuizzersPerRoom?: number | null;

    /**
     * Maximum number of quizzers in a room during an individual competition.
     */
    MaxQuizzersPerRoom?: number | null;

    /**
     * Maximum number of quizzers in the semi-final room during an individual competition.
     */
    MaxQuizzersPerSemiFinalRoom?: number | null;

    /**
     * Value indicating whether the final match is held in a different room than the template indicates. This only applies
     * to the individual competition.
     */
    HasDifferentRoomForFinalMatch: boolean;

    /**
     * Room assignment strategy for quizzers during an individual competition.
     */
    QuizzerRoomAssignment?: OnlineQuizzerRoomAssignmentStrategy | null;

    /**
     * Room optimization strategy for quizzers during an individual competition.
     */
    QuizzerRoomOptimization?: OnlineQuizzerRoomOptimizationStrategy | null;
}

/**
 * Controls how logical rooms in each round are mapped to physical room labels.
 */
export enum OnlineQuizzerRoomAssignmentStrategy {
    /**
     * Always use the first N physical rooms each round (A, B, C, ...).
     * Minimizes the number of rooms in use but can cause back-to-back
     * same-room assignments for players as the bracket shrinks.
     */
    Compact,

    /**
     * Spread the active rooms evenly across the full pool of available
     * physical rooms each round. The N rooms needed are picked by
     * distributing them as evenly as possible across the M total rooms,
     * so every physical room gets roughly equal use over the tournament
     * and no player is forced back into the same room in consecutive rounds.
     */
    Spread,
}

/**
 * Selects the room decomposition strategy used during generation.
 */
export enum OnlineQuizzerRoomOptimizationStrategy {

    /**
     * Prefer fewer rooms to reduce total rounds.
     */
    MinRounds,

    /**
     * Prefer smaller room sizes even if this increases round count.
     */
    PreferSmallerRooms,
}

/**
 * Preview of a refreshed meet schedule.
 */
export interface OnlineMeetSchedulePreview {
    /**
     * Matches in the schedule. Key is the match id.
     */
    Matches: Record<number, OnlineMeetScheduleMatch>;

    /**
     * Value indicating whether the CustomSchedule or OptimizedSchedule has changed from what's in the database.
     */
    readonly IsScheduleUpdated: boolean;

    /**
     * Custom schedule template for the meet.
     */
    readonly CustomSchedule?: ScheduleTemplate | null;

    /**
     * Optimized schedule template for the meet.
     */
    readonly OptimizedSchedule?: ScheduleTemplate | null;

    /**
     * Number of required rooms for the schedule.
     */
    readonly RoomCount: number;

    /**
     * Value indicating whether this schedule is the same as the remote schedule.
     */
    readonly IsSameAsRemote: boolean;
}

/**
 * Match within a preview of a meet schedule.
 */
export interface OnlineMeetScheduleMatch {
    /**
     * Rooms scheduled for this match. Key is the room id.
     */
    Rooms: Record<number, OnlineMeetScheduleRoom>;

    /**
     * Scheduled start time for the match (if any). This is a C# TimeSpan string.
     */
    MatchTime?: string | null;
}

/**
 * Room within a preview of a meet schedule.
 */
export interface OnlineMeetScheduleRoom {
    /**
     * List of team ids (if this is a team competition).
     */
    TeamIds: number[];

    /**
     * List of quizzer ids (if this is an individual competition).
     */
    QuizzerIds: number[];

    /**
     * List of team or quizzers routed from another room.
     */
    RoutedTeamOrQuizzers: RankRoutedTeamOrQuizzer[];

    /**
     * Value indicating whether this is a bye round.
     */
    readonly IsByeRound: boolean;
}

/**
 * Type of ranking within a match.
 */
export enum OnlineMeetMatchRankingType {
    /**
     * Rank in descending order by total points.
     */
    HighestPointsWins,

    /**
     * Rank by the fastest to quiz out.
     */
    FastestToQuizOut,

    /**
     * Rank by the fastest to the top score in the room.
     */
    FastestToTopScore,
}
