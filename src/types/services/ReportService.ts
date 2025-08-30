import { RemoteServiceUrlBase, RemoteServiceUtility } from "./RemoteServiceUtility";
import type { AuthManager } from "../AuthManager";
import type { EventScoringReport } from "../EventScoringReport";
import type { RoomScoringReport } from "../RoomScoringReport";

const URL_ROOT_PATH = "/api/v1.0/reports";

/**
 * Wrapper for the Reports service.
 */
export class ReportService {

    /**
     * Retrieves the scoring report for all databases in the specified event.
     *
     * @param auth Optional AuthManager if the report should be retrieved with  to use for authentication if the user is logged in.
     * @param eventId Id for the event.
     */
    public static getScoringReportForAllDatabases(
        auth: AuthManager | null,
        eventId: string): Promise<EventScoringReport> {

        return RemoteServiceUtility.executeHttpRequest<EventScoringReport>(
            auth,
            "GET",
            RemoteServiceUrlBase.Scores,
            `${URL_ROOT_PATH}/Events/${eventId}/ScoringReport`);
    }

    /**
     * Retrieves the scoring report for an individual room.
     *
     * @param auth Optional AuthManager if the report should be retrieved with  to use for authentication if the user is logged in.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     * @param meetId Id for the meet.
     * @param matchId Id for the match.
     * @param roomId Id for the room.
     */
    public static getRoomScoringReport(
        auth: AuthManager | null,
        eventId: string,
        databaseId: string,
        meetId: number,
        matchId: number,
        roomId: number): Promise<RoomScoringReport> {

        return RemoteServiceUtility.executeHttpRequest<RoomScoringReport>(
            auth,
            "GET",
            RemoteServiceUrlBase.Scores,
            `${URL_ROOT_PATH}/events/${eventId}/ScoringReport/${databaseId}/${meetId}/${matchId}/${roomId}`);
    }

    /**
     * Downloads the excel file for the event stats report.
     *
     * @param auth Optional AuthManager if the report should be retrieved with  to use for authentication if the user is logged in.
     * @param eventId Id for the event.
     * @param fileName Suggested file name for the downloaded file.
     */
    public static downloadEventStatsExcelFile(
        auth: AuthManager | null,
        eventId: string,
        fileName: string): Promise<void> {

        return RemoteServiceUtility.downloadFromHttpRequest(
            auth,
            "GET",
            RemoteServiceUrlBase.Scores,
            `${URL_ROOT_PATH}/events/${eventId}/Stats`,
            null,
            fileName);
    }
}