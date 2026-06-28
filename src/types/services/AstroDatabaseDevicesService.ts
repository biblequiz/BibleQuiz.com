import type { AuthManager } from "../AuthManager";
import {
    RemoteServiceUrlBase,
    RemoteServiceUtility,
} from "./RemoteServiceUtility";

const URL_ROOT_PATH = "/api/v1.0/events";

/**
 * Wrapper for the Astro Database Devices service.
 */
export class AstroDatabaseDevicesService {
    /**
     * Gets the latest devices for a meet.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param databaseId Id for the database.
     *
     * @returns All devices for the database.
     */
    public static getAllDevices(
        auth: AuthManager,
        eventId: string,
        databaseId: string,
    ): Promise<OnlineDatabaseDeviceSummary[]> {
        return RemoteServiceUtility.executeHttpRequest<
            OnlineDatabaseDeviceSummary[]
        >(
            auth,
            "GET",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${eventId}/databases/${databaseId}/devices`,
        );
    }
}

/**
 * Summary of a device within a database.
 */
export interface OnlineDatabaseDeviceSummary {

    /** Id of the device. */
    Id: string;

    /** Name of the device. */
    Name: string;

    /** Platform version of the device. */
    PlatformVersion: string;

    /** Apps installed on the device. */
    Apps: Record<string, OnlineDatabaseDeviceSummaryApp>;

    /** Activity for the device. */
    Activity: OnlineDatabaseDeviceSummaryActivity[];
}

/**
 * Activity for a device within a database and meet.
 */
export interface OnlineDatabaseDeviceSummaryActivity {

    /** Name of the app. */
    AppName: string;

    /** Id of the meet (may be null). */
    MeetId: number | null;

    /** Id of the match (may be null). */
    MatchId: number | null;

    /** Name of the room (may be null). */
    RoomName: string | null;

    /** User name of the person that made the change (if known). */
    UserName: string | null;

    /** Timestamp for the activity. */
    Timestamp: string;
}

/**
 * App installed on a device.
 */
export interface OnlineDatabaseDeviceSummaryApp {

    /** Name of the app. */
    Name: string;

    /** Version of the application. */
    Version: string;

    /** Name of the user (if any) that last uploaded for this app on this device. */
    UserName: string | null;

    /** Timestamp when data was last uploaded for this app on this device. */
    LastUploaded: string;
}