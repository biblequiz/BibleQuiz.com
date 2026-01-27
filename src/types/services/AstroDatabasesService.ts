import type { AuthManager } from "../AuthManager";
import type { DatabaseSettings } from "./DatabasesService";
import { RemoteServiceUrlBase, RemoteServiceUtility } from './RemoteServiceUtility'
import { CompetitionType, MatchRules } from "types/MatchRules";

const URL_ROOT_PATH = "/api/v1.0/events";

/**
 * Wrapper for the Astro Databases service.
 */
export class AstroDatabasesService {

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
      `${URL_ROOT_PATH}/events/${eventId}/databases/${databaseId}`);
  }

  /**
   * Create a new database or update an existing database.
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
      settings.General?.DatabaseId ? "PUT" : "POST",
      RemoteServiceUrlBase.Registration,
      `${URL_ROOT_PATH}/events/${eventId}/databases`,
      null,
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
      `${URL_ROOT_PATH}/events/${eventId}/databases/${databaseId}`);
  }
}

/**
 * Summary of a database.
 */
export class OnlineDatabaseSummary {

  /**
   * Summary of the database with some additional settings.
   */
  public readonly SummaryAndSettings!: DatabaseSettings;

  /**
   * General settings for the database.
   */
  public readonly General!: RemoteDatabaseSettings;
}

/**
 * Settings that can be written for a database.
 */
export class OnlineDatabaseSettings {

  /**
   * Name of the database as it should appear in JBQ.org.
   */
  public DatabaseName!: string;

  /**
   * General settings for the database.
   */
  public General!: RemoteDatabaseSettings;
}

/**
 * Settings for the remote database.
 */
export class RemoteDatabaseSettings {

  /**
   * Id for the database.
   */
  public DatabaseId!: string | null;

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
   * Override for the database name. If this is null, the file name will be used.
   */
  public DatabaseNameOverride!: string | null;

  /**
   * Rules for the matches.
   */
  public Rules!: MatchRules | null;
}