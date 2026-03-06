import type {
    ScoringReportQuizzer,
    ScoringReportTeam,
} from "types/EventScoringReport";
import type { AuthManager } from "../AuthManager";
import {
    RemoteServiceUrlBase,
    RemoteServiceUtility,
} from "./RemoteServiceUtility";

const URL_ROOT_PATH = "/api/v1.0/events";

/**
 * Wrapper for the Astro Meet Ranking service.
 */
export class AstroMeetRankingService {
    /**
     * Gets the ranking settings for a meet.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     * @param meetId Id for the meet.
     *
     * @returns Ranking settings for the meet.
     */
    public static getRanking(
        auth: AuthManager,
        eventId: string,
        databaseId: string,
        meetId: number,
    ): Promise<OnlineMeetRankingSummary> {
        return RemoteServiceUtility.executeHttpRequest<OnlineMeetRankingSummary>(
            auth,
            "GET",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/databases/${databaseId}/meets/${meetId}/ranking`,
        );
    }

    /**
     * Updates the ranking settings for a meet.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     * @param meetId Id for the meet.
     * @param ranking Ranking settings to save.
     */
    public static updateRanking(
        auth: AuthManager,
        eventId: string,
        databaseId: string,
        meetId: number,
        ranking: OnlineMeetRankingSettings,
    ): Promise<void> {
        return RemoteServiceUtility.executeHttpRequestWithoutResponse(
            auth,
            "PUT",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/databases/${databaseId}/meets/${meetId}/ranking`,
            null,
            ranking,
        );
    }
}

/**
 * Summary of meet ranking.
 */
export interface OnlineMeetRankingSummary {
    /**
     * List of teams ranked by their position in the stats.
     */
    readonly RankedTeams: ScoringReportTeam[];

    /**
     * Default ranking of teams by id.
     */
    readonly DefaultRankedTeams: number[];

    /**
     * List of quizzers ranked by their position in the stats.
     */
    readonly RankedQuizzers: ScoringReportQuizzer[];

    /**
     * Default ranking of quizzers by id.
     */
    readonly DefaultRankedQuizzers: number[];

    /**
     * Settings for ranking.
     */
    readonly Settings: OnlineMeetRankingSettings;
}

/**
 * Settings for ranking a meet.
 */
export interface OnlineMeetRankingSettings {
    /**
     * Message to include if TeamRankOverrides has changed.
     */
    TeamOverrideMessage?: string | null;

    /**
     * Ordered ranking of Team.Ids. If this is null, the team ranking hasn't been overridden.
     * Any teams not found in this list should appear AFTER all teams contained in the list.
     */
    TeamRankOverrides?: number[] | null;

    /**
     * Message to include if QuizzerRankOverrides has changed.
     */
    QuizzerOverrideMessage?: string | null;

    /**
     * Ordered ranking of Quizzer.Ids. If this is null, the quizzer ranking hasn't been overridden.
     * Any quizzers not found in this list should appear AFTER all quizzers contained in the list.
     */
    QuizzerRankOverrides?: number[] | null;

    /**
     * Version id for the meet. This is used to determine if someone else changed the meet since it was last loaded.
     */
    VersionId: string;
}
