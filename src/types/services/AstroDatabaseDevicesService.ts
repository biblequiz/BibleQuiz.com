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

    /**
     * Hardware, operating system and display configuration last reported for the device. Null or missing when the
     * device hasn't reported one (app versions released before it was added don't).
     */
    Configuration?: OnlineDeviceConfiguration | null;

    /** Activity for the device. */
    Activity: OnlineDatabaseDeviceSummaryActivity[];
}

/**
 * Hardware, operating system and display configuration a device reports. Every value is optional: each app reports what
 * its platform can tell it.
 */
export interface OnlineDeviceConfiguration {

    /** Model of the device (e.g., "SM-X200"). */
    Model?: string | null;

    /** Manufacturer of the device (e.g., "samsung"). */
    Manufacturer?: string | null;

    /** Platform the app is running on (e.g., "Android", "Windows", "macOS"). */
    Platform?: string | null;

    /** Idiom of the device (e.g., "Tablet", "Desktop"). */
    Idiom?: string | null;

    /** Type of the device ("Physical" or "Virtual"). */
    DeviceType?: string | null;

    /** Version of the operating system. */
    OsVersion?: string | null;

    /** Description of the operating system as reported by the runtime. */
    OsDescription?: string | null;

    /** Architecture of the operating system (e.g., "Arm64"). */
    OsArchitecture?: string | null;

    /** Architecture of the app's process (the CPU type the app runs as). */
    ProcessArchitecture?: string | null;

    /** ABIs the device supports, in order of preference (Android only). */
    SupportedAbis?: string[] | null;

    /** Description of the .NET runtime the app is running on. */
    Runtime?: string | null;

    /** Width of the main display in pixels. */
    PixelWidth?: number | null;

    /** Height of the main display in pixels. */
    PixelHeight?: number | null;

    /** Density (scale factor) of the main display. */
    Density?: number | null;

    /** Width available to the app in device-independent units. */
    AppWidth?: number | null;

    /** Height available to the app in device-independent units. */
    AppHeight?: number | null;

    /** Orientation of the main display (e.g., "Landscape"). */
    Orientation?: string | null;

    /** Rotation of the main display in degrees. */
    Rotation?: number | null;

    /** Refresh rate of the main display in Hz. */
    RefreshRate?: number | null;
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