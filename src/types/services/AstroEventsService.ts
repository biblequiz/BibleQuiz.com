import type { AuthManager } from "../AuthManager";
import { RemoteServiceUrlBase, RemoteServiceUtility } from './RemoteServiceUtility'
import type { EventInfo } from "types/EventTypes";

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
   * 
   * @returns Array of results.
   */
  public static getOwnedEvents(
    auth: AuthManager,
    season: number): Promise<EventInfoWithUrl[]> {

    return RemoteServiceUtility.executeHttpRequest<EventInfoWithUrl[]>(
      auth,
      "GET",
      RemoteServiceUrlBase.Registration,
      `${URL_ROOT_PATH}/seasons/${season}`);
  }
}

/**
 * Events with URL information.
 */
export class EventInfoWithUrl {

  /**
   * Event information.
   */
  public readonly Event!: EventInfo;

  /**
   * URL for the event.
   */
  public readonly Url!: string;
}