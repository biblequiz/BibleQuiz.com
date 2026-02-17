import type { AuthManager } from "../AuthManager";
import type { OnlineDatabaseSummary } from "./AstroDatabasesService";
import { RemoteServiceUrlBase, RemoteServiceUtility } from './RemoteServiceUtility';

const URL_ROOT_PATH = "/api/v1.0/events";

/**
 * Wrapper for the Astro Meet Playoffs service.
 */
export class AstroMeetPlayoffsService {

    /**
     * Gets the playoff matches for a meet.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     * @param meetId Id for the meet.
     * 
     * @returns Playoff meet configuration.
     */
    public static getPlayoffs(
        auth: AuthManager,
        eventId: string,
        databaseId: string,
        meetId: number): Promise<OnlinePlayoffMeet> {

        return RemoteServiceUtility.executeHttpRequest<OnlinePlayoffMeet>(
            auth,
            "GET",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/databases/${databaseId}/meets/${meetId}/playoffs`);
    }

    /**
     * Updates the playoff matches for a meet.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     * @param meetId Id for the meet.
     * @param playoffs Playoff configuration to save.
     * 
     * @returns Updated database summary.
     */
    public static updatePlayoffs(
        auth: AuthManager,
        eventId: string,
        databaseId: string,
        meetId: number,
        playoffs: OnlinePlayoffMeet): Promise<OnlineDatabaseSummary> {

        return RemoteServiceUtility.executeHttpRequest<OnlineDatabaseSummary>(
            auth,
            "PUT",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/databases/${databaseId}/meets/${meetId}/playoffs`,
            null,
            playoffs);
    }
}

/**
 * Represents all the playoffs for a meet.
 */
export interface OnlinePlayoffMeet {
    /**
     * Names of rooms available for playoff matches. Key is the room id.
     */
    Rooms: Record<number, string>;

    /**
     * Names of teams available for playoff matches. Key is the team id.
     */
    Teams: Record<number, string>;

    /**
     * Playoff matches for this meet.
     */
    Matches: OnlinePlayoffMatch[];

    /**
     * Version id for the meet. This is used to determine if someone else changed the meet since it was last loaded.
     */
    VersionId: string;
}

/**
 * Represents a playoff match.
 */
export interface OnlinePlayoffMatch {
    /**
     * Id for the match (relative to playoff round numbering, starting at 1).
     */
    Id: number;

    /**
     * Schedule of playoff matches per room.
     */
    RoomSchedule: OnlinePlayoffMatchRoomSchedule[];

    /**
     * Set of ids for rooms available for this match.
     */
    AvailableRooms: number[];

    /**
     * Time for the match (formatted as a time string, e.g., "02:30 PM").
     */
    MatchTime?: string | null;
}

/**
 * Represents a single room within a playoff match.
 */
export interface OnlinePlayoffMatchRoomSchedule {
    /**
     * Id for the room.
     */
    Id: number;

    /**
     * Ids of the teams in this match.
     */
    TeamIds: number[];

    /**
     * Value indicating whether scoring has started for the match. If this is null,
     * the current state of the match is unknown.
     */
    readonly HasScoringStarted?: boolean | null;
}