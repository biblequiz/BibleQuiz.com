import type { AuthManager } from "../AuthManager";
import { RemoteServiceUrlBase, RemoteServiceUtility } from './RemoteServiceUtility'
import type { ScoringHtmlReport } from './DatabasesService';

const URL_ROOT_PATH = "/api";

/**
 * Wrapper for the Churches service.
 */
export class DatabaseReportsService {

    /**
     * Retrieves all reports for eventId.
     * 
     * @param auth AuthManager to use for authentication.
     * @param successCallback Callback if the operation is successful.
     * @param errorCallback Callback if the operation isn't successful.
     * @param eventId Id for the event.
     */
    public static getAllReportsForEvent(
        auth: AuthManager,
        eventId: string): Promise<DatabaseReportSummary> {

        return RemoteServiceUtility.executeHttpRequest<DatabaseReportSummary>(
            auth,
            "GET",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/Events/${eventId}/Reports`);
    }

    /**
     * Retrieves a single event or season report for eventId.
     * 
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event. If this is null, the reportId must be specified.
     * @param reportId Id for the report (if any).
     * @param isEventReport Value indicating whether this is an event report.
     */
    public static getEventOrSeasonReport(
        auth: AuthManager,
        eventId: string | null,
        reportId: string | null,
        isEventReport: boolean): Promise<DatabaseReportSummary> {

        const urlPath = !isEventReport && !eventId
            ? `${URL_ROOT_PATH}/SeasonReports/${reportId ?? ""}`
            : `${URL_ROOT_PATH}/Events/${eventId}/${isEventReport ? "Event" : "Season"}Reports/${reportId ?? ""}`;

        return RemoteServiceUtility.executeHttpRequest<DatabaseReportSummary>(
            auth,
            "GET",
            RemoteServiceUrlBase.Registration,
            urlPath);
    }

    /**
     * Generates a single event or season report for eventId and reportId.
     * 
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param reportId Id for the report (if any).
     * @param isEventReport Value indicating whether this is an event report.
     * 
     */
    public static generateEventOrSeasonReport(
        auth: AuthManager,
        eventId: string,
        reportId: string,
        isEventReport: boolean): Promise<ScoringHtmlReport> {

        return RemoteServiceUtility.executeHttpRequest<ScoringHtmlReport>(
            auth,
            "GET",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/Events/${eventId}/${isEventReport ? "Event" : "Season"}Reports/${reportId}/View`);
    }

    /**
     * Persists a single event or season report for eventId.
     * 
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param isEventReport Value indicating whether this is an event report.
     * @param report Report to be persisted.
     * 
     */
    public static putEventOrSeasonReport(
        auth: AuthManager,
        eventId: string,
        isEventReport: boolean,
        report: EventReportBase): Promise<void> {

        return RemoteServiceUtility.executeHttpRequestWithoutResponse(
            auth,
            "PUT",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/Events/${eventId}/${isEventReport ? "Event" : "Season"}Reports`,
            null,
            report);
    }

    /**
     * Persists the order of event reports.
     * 
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param reportIds Ordered ids for the reports.
     */
    public static putEventReportsOrder(
        auth: AuthManager,
        eventId: string,
        reportIds: string[]): Promise<void> {

        return RemoteServiceUtility.executeHttpRequestWithoutResponse(
            auth,
            "PUT",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/Events/${eventId}/EventReports/Order`,
            null,
            reportIds);
    }

    /**
     * Deletes a single event or season report for eventId.
     * 
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param reportId Id for the report.
     * @param isEventReport Value indicating whether this is an event report.
     */
    public static deleteEventOrSeasonReport(
        auth: AuthManager,
        eventId: string,
        reportId: string,
        isEventReport: boolean): Promise<void> {
        return RemoteServiceUtility.executeHttpRequestWithoutResponse(
            auth,
            "DELETE",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/Events/${eventId}/${isEventReport ? "Event" : "Season"}Reports/${reportId}`);
    }

    /**
     * Retrieves a single event or season report's team links for eventId.
     * 
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param reportId Id for the report.
     * @param isEventReport Value indicating whether this is an event report.
     */
    public static getEventOrSeasonReportTeamLinks(
        auth: AuthManager,
        eventId: string,
        reportId: string,
        isEventReport: boolean): Promise<DatabaseReportTeamLinkCollection> {

        return RemoteServiceUtility.executeHttpRequest<DatabaseReportTeamLinkCollection>(
            auth,
            "GET",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/Events/${eventId}/${isEventReport ? "Event" : "Season"}Reports/${reportId}/Teams`);
    }

    /**
     * Persists team links for a single event or season report for eventId.
     * 
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param reportId Id for the report.
     * @param isEventReport Value indicating whether this is an event report.
     * @param updatedLinks Updated links to be persisted.
     */
    public static putEventOrSeasonReportTeamLinks(
        auth: AuthManager,
        eventId: string,
        reportId: string,
        isEventReport: boolean,
        updatedLinks: DatabaseReportUpdatableTeamLink[]): Promise<{ [clientSidePersistId: string]: string }> {

        return RemoteServiceUtility.executeHttpRequest<{ [clientSidePersistId: string]: string }>(
            auth,
            "PUT",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/Events/${eventId}/${isEventReport ? "Event" : "Season"}Reports/${reportId}/Teams`,
            null,
            updatedLinks);
    }
}

/**
 * Collection of team links.
 */
export class DatabaseReportTeamLinkCollection {

    /**
     * Id of the event.
     */
    public readonly EventId!: string;

    /**
     * Name of the event.
     */
    public readonly EventName!: string;

    /**
     * Id for the report containing the teams.
     */
    public readonly ReportId!: string;

    /**
     * Name of the report.
     */
    public readonly ReportName!: string;

    /**
     * Churches used by teams.
     */
    public readonly Churches!: DatabaseReportTeamChurch[];

    /**
     * Teams in the collection.
     */
    public readonly Teams!: DatabaseReportTeamLink[];
}

/**
 * Church used on a team link.
 */
export class DatabaseReportTeamChurch {

    /**
     * Id of the church.
     */
    public readonly Id!: string;

    /**
     * Name of the church.
     */
    public readonly Name!: string;

    /**
     * City of the church.
     */
    public readonly City!: string;

    /**
     * State of the church.
     */
    public readonly State!: string;
}

/**
 * Summary of all reports for a database.
 */
export class DatabaseReportSummary {

    /**
     * Id of the event.
     */
    public readonly EventId!: string;

    /**
     * Name of the event.
     */
    public readonly EventName!: string;

    /**
     * Event reports for the database.
     */
    public readonly EventReports!: EventReport[];

    /**
     * Season reports for the database.
     */
    public readonly SeasonReports!: SeasonReport[];
}

/**
 * Base class for all reports.
 */
export abstract class EventReportBase {

    /**
     * Id of the report. Null if the report is new.
     */
    public Id!: string | null;

    /**
     * Name of the report.
     */
    public Name!: string;

    /**
     * Meets to be included in the report.
     */
    public Meets!: ReportMeetFilter[];

    /**
     * Type of report represented by the report.
     */
    public Type!: ReportType;

    /**
     * Value indicating whether the report is visible.
     */
    public IsVisible!: boolean;

    /**
     * Quizzers are ranked by average score, then by total forward quiz outs, and then by success rate for answered questions.
     * If this value is set, they will first be ranked the average number of questions answered correctly with this point value.
     */
    public QuizzersRankByAverageCorrectPointValue!: number | null;

    /**
     * Filter for average point values of quizzers. If this value is null, no additional filter will be applied.
     */
    public QuizzerAveragePoints!: EventReportPointValueFilter | null;

    /**
     * Filter for 10-point values of quizzers. If this value is null, 10-point questions shouldn't be included.
     */
    public Quizzer10Pointers!: EventReportPointValueFilter | null;

    /**
     * Filter for 20-point values of quizzers. If this value is null, 20-point questions shouldn't be included.
     */
    public Quizzer20Pointers!: EventReportPointValueFilter | null;

    /**
     * Filter for 30-point values of quizzers. If this value is null, 30-point questions shouldn't be included.
     */
    public Quizzer30Pointers!: EventReportPointValueFilter | null;

    /**
     * Overrides the number of matches.
     */
    public MatchesOverride!: number | null;
}

/**
 * Filter for a specific point value.
 */
export class EventReportPointValueFilter {

    /**
     * Minimum number of the point value correct for the team or quizzer to be included in the report.
     */
    public MinCorrect!: number | null;

    /**
     * Maximum number of the point value correct for the team or quizzer to be included in the report.
     */
    public MaxCorrect!: number | null;
}

/**
 * Report for meets within a single event.
 */
export class EventReport extends EventReportBase {
    /**
     * Id of the event.
     */
    public EventId!: string;

    /**
     * Display order for the meet.
     */
    public DisplayOrder!: number;
}

/**
 * Report for meets within a single season.
 */
export class SeasonReport extends EventReportBase {

    /**
     * Type of competition.
     */
    public readonly CompetitionTypeId!: string;

    /**
     * Label for the CompetitionTypeId.
     */
    public readonly CompetitionTypeLabel!: string;

    /**
     * Id for the region associated with this report.
     */
    public RegionId!: string | null;

    /**
     * Name of the RgionId.
     */
    public readonly RegionName!: string | null;

    /**
     * Id for the district associated with this report.
     */
    public DistrictId!: string | null;

    /**
     * Name of the DistrictId.
     */
    public readonly DistrictName!: string | null;

    /**
     * Season of the report.
     */
    public readonly Season!: number;
}

/**
 * Filter of meets within a report.
 */
export class ReportMeetFilter {

    /**
     * Id for the event containing the meet.
     */
    public EventId!: string;

    /**
     * Name of the event.
     */
    public EventName!: string;

    /**
     * Id for the database containing the meet.
     */
    public DatabaseId!: string;

    /**
     * Id for the meet in the database.
     */
    public MeetId!: number;

    /**
     * Name of the meet.
     */
    public MeetName!: string;

    /**
     * Number of unverified quizzers for the meet.
     */
    public readonly UnverifiedQuizzers!: number;

    /**
     * Value indicating whether the meet will be visible in the report.
     */
    public readonly IsHidden!: boolean;
}

/**
 * Type of report.
 */
export enum ReportType {

    /**
     * Report includes only teams.
     */
    Teams,

    /**
     * Report includes teams and quizzers.
     */
    TeamsAndQuizzers,

    /**
     * Report includes only quizzers.
     */
    Quizzers
}

/**
 * Updatable link for a team.
 */
export class DatabaseReportUpdatableTeamLink {

    /**
     * Id for the event containing this team.
     */
    public EventId!: string;

    /**
     * Id for the database containing this team.
     */
    public DatabaseId!: string;

    /**
     * Id for the team in the database.
     */
    public TeamId!: number;

    /**
     * Persistent id of the team.
     */
    public PersistentId!: string | null;

    /**
     * Client-side generated persistent identifier used to generate a new PersistentId.
     */
    public ClientSidePersistentId!: number | null;

    /**
     * Id of the church (if set).
     */
    public ChurchId!: string | null;
}

/**
 * Link between teams.
 */
export class DatabaseReportTeamLink extends DatabaseReportUpdatableTeamLink {

    /**
     * Name of the event containing this team.
     */
    public readonly EventName!: string;

    /**
     * Name of the team in the database.
     */
    public readonly Name!: string;

    /**
     * Name of the church in the database.
     */
    public readonly ChurchName!: string;

    /**
     * Meets where the team appears on the schedule.
     */
    public Meets!: DatabaseReportTeamLinkMeet[];
}

/**
 * Information about a team in a meet.
 */
export class DatabaseReportTeamLinkMeet {

    /**
     * Id for the meet where the team appeared.
     */
    public readonly MeetId!: number;

    /**
     * Name of the meet where the team appeared.
     */
    public readonly MeetName!: string;

    /**
     * Name of the team the team is on at this meet.
     */
    public readonly TeamName!: string;

    /**
     * Names of the quizzers on the team.
     */
    public readonly Quizzers!: string[];

    /**
     * Value indicating whether the team has scores in this meet.
     */
    public readonly HasScores!: boolean;

    /**
     * Value indicating whether the team is hidden.
     */
    public readonly IsHidden!: boolean;
}