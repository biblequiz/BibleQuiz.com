import type { AuthManager } from "../AuthManager";
import { RemoteServiceUrlBase, RemoteServiceUtility } from './RemoteServiceUtility'
import type { MatchRules } from "types/MatchRules";

const URL_ROOT_PATH = "/api/v1.0/events";

/**
 * Wrapper for the Astro Databases service.
 */
export class AstroDatabasesService {

  /**
   * Retrieves the summary for all databases for this event.
   *
   * @param auth AuthManager to use for authentication.
   * @param eventId Id for the event.
   * 
   * @returns Summary for each database in this event.
   */
  public static getAllDatabases(
    auth: AuthManager,
    eventId: string): Promise<OnlineDatabaseSummary[]> {

    return RemoteServiceUtility.executeHttpRequest<OnlineDatabaseSummary[]>(
      auth,
      "GET",
      RemoteServiceUrlBase.Registration,
      `${URL_ROOT_PATH}/${eventId}/databases`);
  }

  /**
   * Gets an existing database.
   *
   * @param auth AuthManager to use for authentication.
   * @param eventId Id for the event.
   * @param databaseId Id for the database.
   * 
   * @returns Database summary.
   */
  public static getDatabase(
    auth: AuthManager,
    eventId: string,
    databaseId: string): Promise<OnlineDatabaseSummary> {

    return RemoteServiceUtility.executeHttpRequest<OnlineDatabaseSummary>(
      auth,
      "GET",
      RemoteServiceUrlBase.Registration,
      `${URL_ROOT_PATH}/${eventId}/databases/${databaseId}`);
  }

  /**
   * Creates a new or updates an existing database.
   *
   * @param auth AuthManager to use for authentication.
   * @param eventId Id for the event.
   * @param settings Settings for the database.
   * 
   * @returns Updated database summary.
   */
  public static createOrUpdateDatabase(
    auth: AuthManager,
    eventId: string,
    settings: OnlineDatabaseSettings): Promise<OnlineDatabaseSummary> {

    return RemoteServiceUtility.executeHttpRequest<OnlineDatabaseSummary>(
      auth,
      "PUT",
      RemoteServiceUrlBase.Registration,
      `${URL_ROOT_PATH}/${eventId}/databases`,
      null,
      settings);
  }

  /**
   * Clones an existing database to a new database for the specified event.
   *
   * @param auth AuthManager to use for authentication.
   * @param eventId Id for the source event.
   * @param databaseId Id for the source database.
   * @param targetEventId Id for the event where the new database will be created.
   * @param settings Settings for the database. If settings from the source database are desired, they should be populated here.
   * @param teamsAndQuizzers Value indicating whether to copy the teams and quizzers.
   * @param awards Value indicating whether to copy the awards.
   * @param schedule Value indicating whether to copy the schedule.
   * 
   * @returns Cloned database summary.
   */
  public static cloneDatabase(
    auth: AuthManager,
    eventId: string,
    databaseId: string,
    targetEventId: string,
    settings: OnlineDatabaseSettings,
    teamsAndQuizzers: boolean = false,
    awards: boolean = true,
    schedule: boolean = true): Promise<OnlineDatabaseSummary> {

    return RemoteServiceUtility.executeHttpRequest<OnlineDatabaseSummary>(
      auth,
      "POST",
      RemoteServiceUrlBase.Registration,
      `${URL_ROOT_PATH}/${eventId}/databases/${databaseId}/Clone/${targetEventId}`,
      RemoteServiceUtility.getFilteredUrlParameters({
        teamsAndQuizzers,
        awards,
        schedule
      }),
      settings);
  }

  /**
   * Deletes an existing database.
   *
   * @param auth AuthManager to use for authentication.
   * @param eventId Id for the event.
   * @param databaseId Id for the database.
   */
  public static deleteDatabase(
    auth: AuthManager,
    eventId: string,
    databaseId: string): Promise<void> {

    return RemoteServiceUtility.executeHttpRequestWithoutResponse(
      auth,
      "DELETE",
      RemoteServiceUrlBase.Registration,
      `${URL_ROOT_PATH}/${eventId}/databases/${databaseId}`);
  }
}

/**
 * Summary of a database for use in Astro.
 */
export class OnlineDatabaseSummary {

  /**
   * Settings for the database.
   */
  public readonly Settings!: OnlineDatabaseSettings;

  /**
   * Value indicating whether scoring is enabled.
   */
  public readonly IsScoringEnabled!: boolean;

  /**
   * Number of active meets contained in this database.
   */
  public readonly ActiveMeetCount!: number;

  /**
   * Number of inactive meets contained in this database.
   */
  public readonly InactiveMeetCount!: number;

  /**
   * Number of teams contained in this database.
   */
  public readonly TeamCount!: number;

  /**
   * Number of quizzers contained in this database.
   */
  public readonly QuizzerCount!: number;

  /**
   * Display settings for meets.
   */
  public readonly Meets!: OnlineDatabaseMeetSettings[];
}

/**
 * Settings that can be written for a database.
 */
export class OnlineDatabaseSettings {

  /**
   * Id for the database.
   */
  public DatabaseId!: string | null;

  /**
   * Name of the database as it should appear in JBQ.org.
   */
  public DatabaseName!: string;

  /**
   * Override for the database name. If this is null, the file name will be used.
   */
  public DatabaseNameOverride!: string | null;

  /**
   * Contact Information.
   */
  public ContactInfo!: string;

  /**
   * Default start time for matches. This is a C# TimeSpan string.
   */
  public DefaultMatchStartTime!: string;

  /**
   * Default length of matches in minutes.
   */
  public DefaultMatchLengthInMinutes!: number;

  /**
   * Rules for the matches.
   */
  public Rules!: MatchRules | null;

  /**
   * Value indicating whether this database is managed by ScoreKeep. If true, there will be limited update
   * functionality.
   */
  public readonly IsScoreKeep!: boolean;
}

/**
 * Settings for displaying a meet.
 */
export class OnlineDatabaseMeetSettings {

  /**
   * Id for the meet.
   */
  public readonly Id!: number;

  /**
   * Original name for the meet.
   */
  public readonly Name!: string;

  /**
   * Override for the display name of the meet. Only used for ScoreKeep database.
   */
  public NameOverride!: string | null;

  /**
   * Value indicating whether EZScore is enabled for this meet.
   */
  public readonly AllowEZScore!: boolean;

  /**
   * Value indicating whether scores should be displayed.
   */
  public readonly ShowScores!: boolean;

  /**
   * Value indicating whether the schedule should be displayed.
   */
  public readonly ShowSchedule!: boolean;

  /**
   * Value indicating whether individual scores should be displayed.
   */
  public readonly ShowIndividualScores!: boolean;

  /**
   * Value indicating whether question stats should be displayed.
   */
  public readonly ShowQuestionStats!: boolean;

  /**
   * All meets linked to this meet will have the same value. If it is null, the meet isn't linked.
   */
  public readonly LinkedMeetGroupId!: string | null;
}