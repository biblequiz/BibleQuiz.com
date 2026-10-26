import type { OnlineDatabaseDeviceSummaryApp } from "types/services/AstroDatabaseDevicesService";
import type { ReportDevice } from "types/services/DatabaseReportsService";
import type { SeasonDeviceEvent } from "types/services/AstroEventsService";

/** Label used for a value a device didn't report (e.g., an app released before devices reported their configuration). */
export const NOT_REPORTED = "Not reported";

/**
 * Filters on the events whose devices are counted. A null value means "any".
 */
export interface DeviceEventFilters {
    regionId: string | null;
    districtId: string | null;
    competitionTypeId: string | null;

    /** Month of the event's first day, as "yyyy-MM". */
    month: string | null;
}

/**
 * Kinds of value a device can be counted by.
 */
export type DeviceAttribute = "cpu" | "model" | "app" | "appVersion" | "os" | "screen";

/**
 * Filters on the devices themselves, from clicking a count: attribute -> value.
 */
export type DeviceAttributeFilters = Partial<Record<DeviceAttribute, string>>;

/**
 * A device as it appears in the current slice: only the events in the slice, and the apps it used at them.
 */
export interface SlicedDevice {
    device: ReportDevice;
    eventIds: string[];
    apps: OnlineDatabaseDeviceSummaryApp[];
    values: Record<DeviceAttribute, string[]>;
}

/**
 * Gets the month an event counts in ("yyyy-MM"), from its first day. The date is read as written, so the time zone
 * can't move it into another month.
 */
export function getEventMonth(event: SeasonDeviceEvent): string {
    return event.StartDate.substring(0, 7);
}

/**
 * Gets the events that match the filters.
 */
export function filterEvents(events: SeasonDeviceEvent[], filters: DeviceEventFilters): Set<string> {
    return new Set(
        events
            .filter(e =>
                (!filters.regionId || e.RegionId === filters.regionId) &&
                (!filters.districtId || e.DistrictId === filters.districtId) &&
                (!filters.competitionTypeId || e.CompetitionTypeId === filters.competitionTypeId) &&
                (!filters.month || getEventMonth(e) === filters.month))
            .map(e => e.Id));
}

/**
 * Compares two app versions numerically ("2026.10.1.1" > "2026.9.1.1"). Like the server's season report, a version that
 * isn't numeric is older than one that is; two that aren't numeric compare as text.
 */
export function compareVersions(a: string, b: string): number {
    const aParts = a.split(".").map(p => Number(p));
    const bParts = b.split(".").map(p => Number(p));
    const isANumeric = !aParts.some(isNaN);
    const isBNumeric = !bParts.some(isNaN);
    if (!isANumeric || !isBNumeric) {
        return isANumeric === isBNumeric ? a.localeCompare(b) : (isANumeric ? 1 : -1);
    }

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const difference = (aParts[i] ?? 0) - (bParts[i] ?? 0);
        if (difference !== 0) {
            return difference;
        }
    }

    return 0;
}

/**
 * Slices the devices to the events in eventIds and then to the attribute filters. A device appears once, however many of
 * the events it was used at, with the highest version of each app it used at them.
 */
export function sliceDevices(
    devices: ReportDevice[],
    eventIds: Set<string>,
    attributeFilters: DeviceAttributeFilters): SlicedDevice[] {

    const sliced: SlicedDevice[] = [];
    for (const device of devices) {
        const databases = device.Databases.filter(d => eventIds.has(d.EventId));
        if (databases.length === 0) {
            continue;
        }

        // Highest version of each app at these events, matching names without case as the server does. An API release
        // without per-database apps falls back to the device's.
        const appsByName = new Map<string, OnlineDatabaseDeviceSummaryApp>();
        for (const app of databases.flatMap(d => d.Apps ?? device.Apps)) {
            const key = app.Name.toLowerCase();
            const existing = appsByName.get(key);
            if (!existing || compareVersions(app.Version, existing.Version) > 0) {
                appsByName.set(key, app);
            }
        }

        const apps = Array.from(appsByName.values()).sort((a, b) => a.Name.localeCompare(b.Name));
        const entry: SlicedDevice = {
            device,
            eventIds: Array.from(new Set(databases.map(d => d.EventId))),
            apps,
            values: getDeviceValues(device, apps)
        };

        const matches = (Object.entries(attributeFilters) as [DeviceAttribute, string][])
            .every(([attribute, value]) => entry.values[attribute].includes(value));
        if (matches) {
            sliced.push(entry);
        }
    }

    return sliced;
}

/**
 * Counts the devices by an attribute. A device counts once per value it has (e.g., once for each app it runs).
 */
export function countBy(devices: SlicedDevice[], attribute: DeviceAttribute): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const device of devices) {
        for (const value of device.values[attribute]) {
            counts[value] = (counts[value] ?? 0) + 1;
        }
    }

    return counts;
}

function getDeviceValues(device: ReportDevice, apps: OnlineDatabaseDeviceSummaryApp[]): Record<DeviceAttribute, string[]> {
    const configuration = device.Configuration;
    const orNotReported = (value: string | null | undefined) => value && value.trim().length > 0 ? value.trim() : NOT_REPORTED;
    const join = (...values: (string | null | undefined)[]) => values.filter(v => !!v && v.trim().length > 0).join(" ");

    const screen = configuration?.PixelWidth && configuration?.PixelHeight
        ? `${Math.round(configuration.PixelWidth)} × ${Math.round(configuration.PixelHeight)}`
        : null;

    return {
        cpu: [orNotReported(configuration?.ProcessArchitecture)],
        model: [orNotReported(join(configuration?.Manufacturer, configuration?.Model))],
        os: [orNotReported(join(configuration?.Platform, configuration?.OsVersion))],
        screen: [orNotReported(screen)],
        app: apps.length > 0 ? apps.map(a => a.Name) : [NOT_REPORTED],
        appVersion: apps.length > 0 ? apps.map(a => `${a.Name} ${a.Version}`) : [NOT_REPORTED],
    };
}
