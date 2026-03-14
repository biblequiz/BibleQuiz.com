import type { TeamOrQuizzerReference } from "types/Meets";
import type { AuthManager } from "../AuthManager";
import {
    RemoteServiceUrlBase,
    RemoteServiceUtility,
} from "./RemoteServiceUtility";

const URL_ROOT_PATH = "/api/v1.0/events";

/**
 * Wrapper for the Astro Meet Stats service.
 */
export class AstroMeetStatsService {
    /**
     * Gets the stats for a meet.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     * @param meetId Id for the meet.
     *
     * @returns Stats summary for the meet.
     */
    public static getStats(
        auth: AuthManager,
        eventId: string,
        databaseId: string,
        meetId: number,
    ): Promise<OnlineMeetStatsSummary> {
        return RemoteServiceUtility.executeHttpRequest<OnlineMeetStatsSummary>(
            auth,
            "GET",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/databases/${databaseId}/meets/${meetId}/stats`,
        );
    }

    /**
     * Updates the stats settings for a meet.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     * @param meetId Id for the meet.
     * @param stats Stats settings to save.
     */
    public static updateStats(
        auth: AuthManager,
        eventId: string,
        databaseId: string,
        meetId: number,
        stats: OnlineMeetStatsSettings,
    ): Promise<void> {
        return RemoteServiceUtility.executeHttpRequestWithoutResponse(
            auth,
            "PUT",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/databases/${databaseId}/meets/${meetId}/stats`,
            null,
            stats,
        );
    }
}

/**
 * Summary of meet stats.
 */
export interface OnlineMeetStatsSummary {
    /**
     * All quizzers for the meet.
     */
    readonly Quizzers: Record<number, OnlineMeetStatItem>;

    /**
     * Settings for stats.
     */
    readonly Settings: OnlineMeetStatsSettings;
}

/**
 * Item for a meet stat.
 */
export interface OnlineMeetStatItem {

    /**
     * Reference for the item.
     */
    readonly Reference: TeamOrQuizzerReference;

    /**
     * Original number of matches the quizzer played in the meet.
     */
    readonly OriginalMatches: number;
}

/**
 * Settings for stats of a meet.
 */
export interface OnlineMeetStatsSettings {
    /**
     * Mapping of quizzer id to an override for the number of matches they should be considered to have played.
     * This will influence their average score and ranking.
     */
    QuizzerMatchOverrides: Record<number, number>;

    /**
     * Version id for the meet. This is used to determine if someone else changed the meet since it was last loaded.
     */
    VersionId: string;
}