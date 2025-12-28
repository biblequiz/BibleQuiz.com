import type { AuthManager } from "../AuthManager";
import { RemoteServiceUrlBase, RemoteServiceUtility } from './RemoteServiceUtility'

const URL_ROOT_PATH = "/api/Events";

/**
 * Wrapper for the Churches service.
 */
export class DatabasesService {

    /**
     * Retrieves the settings for all databases related to this event.
     * 
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param includeMeets Value indicating whether to include meet information as well.
     */
    public static getAllDatabaseSettingsForEvent(
        auth: AuthManager,
        eventId: string,
        includeMeets: boolean = false): Promise<DatabaseSettings[]> {

        return RemoteServiceUtility.executeHttpRequest<DatabaseSettings[]>(
            auth,
            "GET",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/Databases`,
            RemoteServiceUtility.getFilteredUrlParameters({ m: includeMeets }));
    }

    /**
     * Retrieves the summary for a specific database.
     * 
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     */
    public static getDatabaseSummary(
        auth: AuthManager,
        eventId: string,
        databaseId: string): Promise<DatabaseSummary> {

        return RemoteServiceUtility.executeHttpRequest<DatabaseSummary>(
            auth,
            "GET",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/Databases/${databaseId}`);
    }

    /**
     * Updates database settings for an existing database.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param settings Settings to be updated.
     */
    public static updateDatabaseSettings(
        auth: AuthManager,
        eventId: string,
        settings: DatabaseSettings): Promise<DatabaseSummary> {

        return RemoteServiceUtility.executeHttpRequest<DatabaseSummary>(
            auth,
            "PUT",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/Databases/${settings.DatabaseId}/Settings`,
            null,
            settings);
    }

    /**
     * Retrieves the playoffs for a specific meet.
     * 
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     * @param meetId Id for the meet.
     */
    public static getDatabaseMeetPlayoffs(
        auth: AuthManager,
        eventId: string,
        databaseId: string,
        meetId: number): Promise<PlayoffMeet> {

        return RemoteServiceUtility.executeHttpRequest<PlayoffMeet>(
            auth,
            "GET",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/Databases/${databaseId}/Playoffs/${meetId}`);
    }

    /**
     * Updates database settings for an existing database.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     * @param meetId Id for the meet.
     * @param playoffs Settings to be updated.
     */
    public static updateDatabaseMeetPlayoffs(
        auth: AuthManager,
        eventId: string,
        databaseId: string,
        meetId: number,
        playoffs: PlayoffMeet): Promise<PlayoffMeet> {

        return RemoteServiceUtility.executeHttpRequest<PlayoffMeet>(
            auth,
            "PUT",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/Databases/${databaseId}/Playoffs/${meetId}`,
            null,
            playoffs);
    }

    /**
     * Retrieves the scores for an individual match the meet within the event.
     * 
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     * @param meetId Id for the meet.
     * @param matchId Id for the match.
     * @param roomId Id for the room.
     */
    public static getCoordinatorRoomScoresReport(
        auth: AuthManager,
        eventId: string,
        databaseId: string,
        meetId: number,
        matchId: number,
        roomId: number): Promise<ScoringHtmlReport> {

        return RemoteServiceUtility.executeHttpRequest<ScoringHtmlReport>(
            auth,
            "GET",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/Databases/${databaseId}/Reports/${meetId}/Scores/${matchId}/${roomId}`);
    }

    /**
     * Retrieves the collection of quizzers in a database.
     * 
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     */
    public static getDatabaseQuizzerLinks(
        auth: AuthManager,
        eventId: string,
        databaseId: string): Promise<DatabaseQuizzerLinkCollection> {

        return RemoteServiceUtility.executeHttpRequest<DatabaseQuizzerLinkCollection>(
            auth,
            "GET",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/Quizzers/${databaseId}`);
    }

    /**
     * Retrieves the collection of quizzers in a database.
     * 
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     * @param updatedQuizzers Quizzers with updated properties.
     */
    public static updateDatabaseQuizzerLinks(
        auth: AuthManager,
        eventId: string,
        databaseId: string,
        updatedQuizzers: DatabaseUpdatableQuizzerLink[]): Promise<void> {

        return RemoteServiceUtility.executeHttpRequestWithoutResponse(
            auth,
            "PUT",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/Quizzers/${databaseId}`,
            null,
            updatedQuizzers);
    }

    /**
     * Retrieves the award settings for the event and database.
     * 
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     */
    public static getAwardsSettings(
        auth: AuthManager,
        eventId: string,
        databaseId: string): Promise<DatabaseAwards> {

        return RemoteServiceUtility.executeHttpRequest<DatabaseAwards>(
            auth,
            "GET",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/Awards/${databaseId}`);
    }

    /**
     * Updates the award settings for the event and database.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     * @param settings Settings to be updated.
     */
    public static updateAwardsSettings(
        auth: AuthManager,
        eventId: string,
        databaseId: string,
        settings: DatabaseAwards): Promise<void> {

        return RemoteServiceUtility.executeHttpRequestWithoutResponse(
            auth,
            "PUT",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/Awards/${databaseId}`,
            null,
            settings);
    }

    /**
     * Link an existing template to the database.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     * @param templateId Id for the template.
     */
    public static linkTemplateToDatabase(
        auth: AuthManager,
        eventId: string,
        databaseId: string,
        templateId: string): Promise<void> {

        return RemoteServiceUtility.executeHttpRequestWithoutResponse(
            auth,
            "POST",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/Awards/${databaseId}/Templates/${templateId}`);
    }

    /**
     * Unlink an existing template from a database.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     * @param templateId Id for the template.
     */
    public static unlinkTemplateToDatabase(
        auth: AuthManager,
        eventId: string,
        databaseId: string,
        templateId: string): Promise<void> {

        return RemoteServiceUtility.executeHttpRequestWithoutResponse(
            auth,
            "DELETE",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/Awards/${databaseId}/Templates/${templateId}`);
    }

    /**
     * Uploads a template.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     * @param type Type of template.
     * @param templateId Id for the template.
     * @param form Form contents with "name" and "file" set with the appropriate values.
     */
    public static uploadTemplate(
        auth: AuthManager,
        eventId: string,
        databaseId: string,
        type: AwardType,
        templateId: string | null | undefined,
        form: FormData): Promise<DatabaseAwardsTemplate> {

        let uri: string = `${URL_ROOT_PATH}/${eventId}/Databases/${databaseId}/Templates/${AwardType[type]}`;
        if (templateId) {
            uri += `/${templateId}`;
        }

        return RemoteServiceUtility.executeHttpRequest<DatabaseAwardsTemplate>(
            auth,
            "PUT",
            RemoteServiceUrlBase.Registration,
            uri,
            null,
            form,
            true);
    }

    /**
     * Deletes a template.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param templateId Id for the template.
     */
    public static deleteTemplate(
        auth: AuthManager,
        eventId: string,
        templateId: string): Promise<void> {

        return RemoteServiceUtility.executeHttpRequestWithoutResponse(
            auth,
            "DELETE",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/Templates/${templateId}`);
    }
}

/**
 * Summary of a Scoring Database
 */
export class DatabaseSummary {

    /**
     * Name of the event.
     */
    public readonly EventName!: string;

    /**
     * Dashboard report for the database.
     */
    public readonly Dashboard!: ScoringHtmlReport | null;

    /**
     * Settings for the database.
     */
    public readonly Settings!: DatabaseSettings;

    /**
     * Set of devices that have connected to this database.
     */
    public readonly Devices!: DatabaseDevice[];

    /**
     * Number of quizzers with scores either not linked to a person in the system or where the person hasn't been verified.
     */
    public readonly UnverifiedQuizzers!: number;
}

/**
 * Represents all the playoffs for a meet.
 */
export class PlayoffMeet {

    /**
     * Names of rooms available for playoff matches.
     */
    public readonly Rooms!: { [name: string]: string };

    /**
     * Names of teams available for playoff matches.
     */
    public readonly Teams!: { [name: string]: string };

    /**
     * Playoff matches for this meet.
     */
    public readonly Matches!: PlayoffMatch[];
}

/**
 * Represents a playoff match.
 */
export class PlayoffMatch {

    /**
     * Id for the match.
     */
    public Id!: number;

    /**
     * Schedule of playoff matches.
     */
    public RoomSchedule!: PlayoffMatchRoomSchedule[];

    /**
     * Set of ids for rooms available for this match.
     */
    public AvailableRooms!: number[];

    /**
     * Time for the match.
     */
    public MatchTime!: string | null;
}

/**
 * Represents a single room within a playoff match.
 */
export class PlayoffMatchRoomSchedule {

    /**
     * Id for the room.
     */
    public Id!: number;

    /**
     * Ids of the teams in this match.
     */
    public TeamIds!: number[];

    /**
     * Value indicating whether scoring has started for the match.
     */
    public readonly HasScoringStarted!: boolean;
}

/**
 * Report generated from a Scoring Database.
 */
export class ScoringHtmlReport {

    /**
     * Name of the event for this report.
     */
    public readonly EventName!: string;

    /*
     * Name of the database for this report.
     */
    public readonly DatabaseName!: string;

    /**
     * HTML for the report.
     */
    public readonly Html!: string;

    /**
     * Information about link tokens within the HTML.
     */
    public readonly LinkTokens!: { [name: string]: ScoringHtmlReportLinkToken } | null;
}

/**
 * Information for a link in a scoring report.
 */
export class ScoringHtmlReportLinkToken {

    /**
     * Id for the meet.
     */
    public readonly MeetId!: number;

    /**
     * Id for the match.
     */
    public readonly MatchId!: number | null;

    /**
     * Id for the room.
     */
    public readonly RoomId!: number | null;

    /**
     * Id for the team.
     */
    public readonly TeamId!: number | null;
}

/**
 * Scoring Database Settings
 **/
export class DatabaseSettings {

    /**
     * Id for the database.
     **/
    public readonly DatabaseId!: string;

    /**
     * Name of the database as it should appear in JBQ.org.
     **/
    public readonly DatabaseName!: string;

    /**
     * Name to display for the database. If this is null, DatabaseName will be used.
     */
    public DisplayNameOverride!: string | null;

    /**
     * Value indicating whether scoring is enabled.
     **/
    public readonly IsScoringEnabled!: boolean;

    /**
     * Number of active meets contained in this database.
     **/
    public readonly ActiveMeetCount!: number;

    /**
     * Number of inactive meets contained in this database.
     **/
    public readonly InactiveMeetCount!: number;

    /**
     * Number of teams contained in this database.
     **/
    public readonly TeamCount!: number;

    /**
     * Number of quizzers contained in this database.
     **/
    public readonly QuizzerCount!: number;

    /**
     * Settings for individual meets.
     */
    public readonly Meets!: DatabaseSettingsMeet[];
}

/**
 * Settings for an individual meet within a scoring database.
 **/
export class DatabaseSettingsMeet {

    /**
     * Id for the meet.
     */
    public readonly Id!: number;

    /**
     * Original name for the meet.
     */
    public readonly Name!: string;

    /**
     * Override for the display name of the meet.
     **/
    public NameOverride!: string | null;

    /**
     * Display order for the meet.
     */
    public DisplayOrder!: number;

    /**
     * Value indicating whether the meet is active for scoring.
     */
    public IsActive!: boolean;

    /**
     * Value indicating whether scores should be displayed.
     **/
    public ShowScores!: boolean;

    /**
     * Value indicating whether the schedule should be displayed.
     **/
    public ShowSchedule!: boolean;

    /**
     * Value indicating whether individual scores should be displayed.
     **/
    public ShowIndividualScores!: boolean;

    /**
     * Value indicating whether question stats should be displayed.
     */
    public ShowQuestionStats!: boolean;

    /**
     * All meets linked to this meet will have the same value. If it is null, the meet isn't linked.
     */
    public readonly LinkedMeetGroupId!: string | null;
}

/**
 * Device uploading to this database.
 */
export class DatabaseDevice {

    /**
     * Name of the device.
     */
    public readonly Name!: string;

    /**
     * Platform version for the device.
     */
    public readonly PlatformVersion!: string;

    /**
     * Applications that have uploaded data for this app.
     */
    public readonly Apps!: DatabaseDeviceApp[];
}

/**
 * Specific app for a DatabaseDevice.
 */
export class DatabaseDeviceApp {

    /**
     * Name of the app.
     */
    public readonly Name!: string;

    /**
     * Version of the application.
     */
    public readonly Version!: string;

    /**
     * Name of the user (if any) that last uploaded for this app on this device.
     */
    public readonly UserName!: string;

    /**
     * Timestamp when data was last uploaded for this app on this device.
     */
    public readonly LastUploaded!: string;
}

/**
 * Manifest for a database for all reports.
 */
export class DatabaseReportManifest {

    /**
     * Name of the event.
     */
    public readonly EventName!: string;

    /**
     * List of meet reports for the manifest.
     */
    public readonly Meets!: DatabaseReportManifestMeet[];
}

/**
 * Individual meet within a report manifest.
 */
export class DatabaseReportManifestMeet {

    /**
     * Label for the meet.
     */
    public readonly Label!: string;

    /**
     * Id for the database.
     */
    public readonly DatabaseId!: string;

    /**
     * Id for the meet.
     */
    public readonly MeetId!: number;

    /**
     * Value indicating whether there is a schedule.
     */
    public readonly HasSchedule!: boolean;

    /**
     * Value indicating whether there are scores.
     */
    public readonly HasScores!: boolean;
}

/**
 * Collection of quizzer links.
 */
export class DatabaseQuizzerLinkCollection {

    /**
     * Id of the event.
     */
    public readonly EventId!: string;

    /**
     * Name of the event.
     */
    public readonly EventName!: string;

    /**
     * Id for the database containing the quizzers.
     */
    public readonly DatabaseId!: string;

    /**
     * Name of the database.
     */
    public readonly DatabaseName!: string;

    /// <summary>
    /// Quizzers in the collection.
    /// </summary>
    public readonly Quizzers!: DatabaseQuizzerLink[];
}

/**
 * Basic link between a quizzer and a person.
 */
export class DatabaseUpdatableQuizzerLink {

    /**
     * Id for the quizzer in the database.
     */
    public Id!: number;

    /**
     * Id of the person (if set).
     */
    public PersonId!: string | null;

    /**
     * Id of the church (if set).
     */
    public ChurchId!: string | null;

    /**
     * Value indicating whether the link has been verified.
     */
    public IsVerified!: boolean;
}

/**
 * Link between a quizzer and a person.
 */
export class DatabaseQuizzerLink extends DatabaseUpdatableQuizzerLink {

    /**
     * Name of the person (if PersonId is set).
     */
    public PersonName!: string | null;

    /**
     * Name of the church (if ChurchId is set).
     */
    public ChurchName!: string | null;

    /**
     * Name of the person in the database.
     */
    public readonly Name!: string;

    /**
     * Meets where the quizzer appears on the schedule.
     */
    public readonly Meets!: DatabaseQuizzerLinkMeet[];
}

/**
 * Information about a quizzer in a meet.
 */
export class DatabaseQuizzerLinkMeet {

    /**
     * Id for the database.
     */
    public readonly DatabaseId!: string;

    /**
     * Name of the database where the quizzer is present.
     */
    public readonly DatabaseName!: string;

    /**
     * Name of the meet where the quizzer appeared.
     */
    public readonly MeetName!: string;

    /**
     * Name of the team the quizzer is on at this meet.
     */
    public readonly TeamName!: string | null;

    /**
     * Value indicating whether the quizzer has scores in this meet.
     */
    public readonly HasScores!: boolean;

    /**
         * Value indicating whether the quizzer is hidden.
         */
    public readonly IsHidden!: boolean;
}

/**
 * Awards for Database.
 */
export class DatabaseAwards {
    /**
     * Name of the event.
     */
    public readonly EventName!: string;

    /**
     * Name of the database.
     */
    public readonly DatabaseName!: string;

    /**
     * Last label for the dates of the report.
     */
    public readonly DatesLabel!: string;

    /**
     * Meets associated with the database.
     */
    public readonly Meets!: DatabaseAwardsMeet[];

    /**
     * Last output used for generating team awards.
     */
    public readonly Teams!: DatabaseAwardsOutput;

    /**
     * Last output used for generating individual awards.
     */
    public readonly Individuals!: DatabaseAwardsOutput;
}

/**
 * Meet for awards.
 */
export class DatabaseAwardsMeet {

    /**
     * Id for the meet.
     */
    public readonly Id!: number;

    /**
     * Name of the meet.
     */
    public readonly Name!: string;

    /**
     * Value indicating whether the meet has scores.
     */
    public readonly HasScores!: boolean;

    /**
     * Value indicating whether to include this meet in the awards.
     */
    public IsIncluded   !: boolean;
}

/**
 * Event or season report for awards.
 */
export class DatabaseAwardsReport {

    /**
     * Id for the report.
     */
    public readonly Id!: string;

    /**
     * Name of the report.
     */
    public readonly Name!: string;
}

/**
 * Output for awards.
 */
export class DatabaseAwardsOutput {

    /**
     * Id for the template to use.
     */
    public TemplateId!: string;

    /**
     * All available templates for the awards.
     */
    public AllTemplates!: DatabaseAwardsTemplate[];

    /**
     * All available reports for the awards.
     */
    public readonly Reports!: DatabaseAwardsReport[];

    /**
     * Link to the report in PDF format.
     */
    public readonly PdfReportLink!: string;

    /**
     * Link to the report in Word format.
     */
    public readonly WordReportLink!: string;

    /**
     * Link to the report in Word format.
     */
    public readonly ExcelReportLink!: string;

    /**
     * Link to a blank template.
     */
    public readonly BlankTemplateLink!: string;
}

/**
 * Template for awards.
 */
export class DatabaseAwardsTemplate {
    /**
     * Id for the template.
     */
    public readonly Id!: string;

    /**
     * Name of the template.
     */
    public Name!: string;

    /**
     * Name of the owner.
     */
    public readonly OwnerName!: string;

    /**
     * Link for downloading this template.
     */
    public readonly DownloadLink!: string;

    /**
     * Value indicating whether this template is shared with the database. If false, this is a personal template that is only
     * visible to the current user.
     */
    public IsDatabase!: boolean;

    /*
     * Value indicating whether the current user can modify or delete this template.
     */
    public readonly IsModifiable!: boolean;

    /**
     * Value indicating whether this is a default template.
     */
    public readonly IsDefault!: boolean;
}

/**
 * Type of award being generated.
 */
export enum AwardType {

    /**
     * Team awards
     */
    Team,

    /**
     * Quizzer awards.
     */
    Quizzer
}