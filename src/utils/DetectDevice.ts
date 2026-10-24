/**
 * Kind of device a visitor is on, as far as the apps page cares.
 */
export type AppDevice = "windows" | "mac" | "android" | "ios" | "other";

/**
 * Subset of `navigator` used to detect the device (so it can be tested without a browser).
 */
export interface DeviceSignals {
    userAgent: string;
    maxTouchPoints?: number;
}

/**
 * Detects the device from the user agent.
 *
 * @param signals The browser signals. Defaults to `navigator`.
 * @returns The detected device, or `other` when it isn't one of the supported ones.
 */
export function detectDevice(signals?: DeviceSignals): AppDevice {

    const source = signals ?? (typeof navigator === "undefined" ? null : navigator);
    if (!source) {
        return "other";
    }

    const userAgent = source.userAgent ?? "";

    if (/iPhone|iPad|iPod/i.test(userAgent)) {
        return "ios";
    }

    // Amazon Fire tablets run Android, but their browser reports itself as Silk or a KF model code.
    if (/Android|Silk|KF[A-Z]{2,}/i.test(userAgent)) {
        return "android";
    }

    if (/Macintosh/i.test(userAgent)) {
        // iPadOS reports itself as a Mac, but a Mac has no touch screen.
        return (source.maxTouchPoints ?? 0) > 1 ? "ios" : "mac";
    }

    if (/Windows/i.test(userAgent)) {
        return "windows";
    }

    return "other";
}
