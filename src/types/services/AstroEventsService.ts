import type { AuthManager } from "../AuthManager";
import type { OnlineDatabaseSummary } from "./AstroDatabasesService";
import { RemoteServiceUrlBase, RemoteServiceUtility } from './RemoteServiceUtility'
import type { EventInfo as ServiceEventInfo } from "./EventsService";
import type { EventInfo as TypeEventInfo } from "types/EventTypes";
import type { OnlineTeamsAndQuizzersImportManifest } from "./AstroTeamsAndQuizzersService";

const URL_ROOT_PATH = "/api/v1.0/events";

/**
 * Wrapper for the Astro Events service.
 */
export class AstroEventsService {

  /**
   * Retrieves the events owned by the current user.
   *
   * @param auth AuthManager to use for authentication.
   * @param season Season for the events.
   * @param typeId Optional type id for filtering events.
   * @param requireDatabases Optional value indicating whether an event must have a database.
   * 
   * @returns Array of results.
   */
  public static getOwnedEvents(
    auth: AuthManager,
    season: number,
    typeId?: string,
    requireDatabases?: boolean): Promise<EventInfoWithUrl[]> {

    return RemoteServiceUtility.executeHttpRequest<EventInfoWithUrl[]>(
      auth,
      "GET",
      RemoteServiceUrlBase.Registration,
      `${URL_ROOT_PATH}/seasons/${season}`,
      RemoteServiceUtility.getFilteredUrlParameters({
        d: requireDatabases,
        t: typeId
      }));
  }

  /**
   * Retrieves the events owned by the current user.
   *
   * @param auth AuthManager to use for authentication.
   * @param eventId Id for the event.
   * 
   * @returns Event with summary.
   */
  public static getEventWithSummary(
    auth: AuthManager,
    eventId: string): Promise<EventInfoWithSummary> {

    return RemoteServiceUtility.executeHttpRequest<EventInfoWithSummary>(
      auth,
      "GET",
      RemoteServiceUrlBase.Registration,
      `${URL_ROOT_PATH}/summaries/${eventId}`);
  }
  /**
   * Generates a manifest of the teams and quizzers from this event's registrations.
   *
   * @param auth AuthManager to use for authentication.
   * @param eventId Id for the event.
   * 
   * @returns Manifest for importing.
   */
  public static getTeamsAndQuizzersManifest(
    auth: AuthManager,
    eventId: string): Promise<OnlineTeamsAndQuizzersImportManifest> {

    return RemoteServiceUtility.executeHttpRequest<OnlineTeamsAndQuizzersImportManifest>(
      auth,
      "GET",
      RemoteServiceUrlBase.Registration,
      `${URL_ROOT_PATH}/teamsAndQuizzers/${eventId}`);
  }
}

/**
 * Events with URL information.
 */
export class EventInfoWithUrl {

  /**
   * Event information.
   */
  public readonly Event!: TypeEventInfo;

  /**
   * URL for the event.
   */
  public readonly Url!: string;
}

/**
 * Events with additional summary.
 */
export class EventInfoWithSummary {

  /**
   * Full URL for the event.
   */
  public readonly FullUrl!: string;

  /**
   * Event information.
   */
  public readonly Event!: ServiceEventInfo;

  /**
   * List of databases associated with the event.
   */
  public readonly Databases!: OnlineDatabaseSummary[];

  /**
   * Number of churches that have registered.
   */
  public readonly RegisteredChurches!: number;

  /**
   * Number of teams that have registered.
   */
  public readonly RegisteredTeams!: number;

  /**
   * Number of coaches that have registered.
   */
  public readonly RegisteredCoaches!: number;

  /**
   * Number of quizzers that have registered.
   */
  public readonly RegisteredQuizzers!: number;

  /**
   * Number of officials that have registered.
   */
  public readonly RegisteredOfficials!: number;

  /**
   * Number of attendees that have registered.
   */
  public readonly RegisteredAttendees!: number;

  /**
   * Total amount due for the event.
   */
  public readonly AmountDue!: number;

  /**
   * Total amount paid for the event.
   */
  public readonly AmountPaid!: number;

  /**
   * Total amount pending for the event as part of credit card processing.
   */
  public readonly AmountPending!: number;

  /**
   * Total amount due for payout.
   */
  public readonly PayoutDue!: number;

  /**
   * Total amount paid to the payee.
   */
  public readonly PayoutPaid!: number;
}