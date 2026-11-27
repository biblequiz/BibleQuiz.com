import { recentCalls, type FeedbackApiCall } from "./ApiHistory";

declare const __BQ_SITE_VERSION__: string | undefined;

/** The site build a report came from (the commit it was built from, set by astro.config.mjs), or "dev". */
export const siteVersion: string = typeof __BQ_SITE_VERSION__ === "string" && __BQ_SITE_VERSION__ ? __BQ_SITE_VERSION__ : "dev";

/** Everything sent with a report besides what the person wrote, and shown to them before they send it. */
export interface FeedbackContext {
    route: string;
    appVersion: string;
    browser: string;
    operatingSystem: string;
    recentApiCalls: FeedbackApiCall[];
}

/**
 * The browser and the operating system, in words, from the user agent: "Chrome 131", "iOS 18.1". Only the name and the major version; one this
 * doesn't know is "Other". (The same as Study Hub's.)
 */
export function describeBrowser(userAgent: string | null | undefined): { browser: string; operatingSystem: string } {
    const ua = String(userAgent ?? "");
    const major = (pattern: RegExp): string => {
        const found = pattern.exec(ua);
        return found ? found[1] : "";
    };
    const named = (name: string, version: string): string => (version ? `${name} ${version}` : name);
    let browser = "Other";
    if (/Edg(?:e|A|iOS)?\//.test(ua)) {
        browser = named("Edge", major(/Edg(?:e|A|iOS)?\/(\d+)/));
    } else if (/SamsungBrowser\//.test(ua)) {
        browser = named("Samsung Internet", major(/SamsungBrowser\/(\d+)/));
    } else if (/(?:OPR|Opera)\//.test(ua)) {
        browser = named("Opera", major(/(?:OPR|Opera)\/(\d+)/));
    } else if (/Firefox\/|FxiOS\//.test(ua)) {
        browser = named("Firefox", major(/(?:Firefox|FxiOS)\/(\d+)/));
    } else if (/Chrome\/|CriOS\//.test(ua)) {
        browser = named("Chrome", major(/(?:Chrome|CriOS)\/(\d+)/));
    } else if (/Safari\//.test(ua) && /Version\//.test(ua)) {
        browser = named("Safari", major(/Version\/(\d+)/));
    }

    let operatingSystem = "Other";
    if (/iPhone|iPod/.test(ua)) {
        operatingSystem = named("iOS", major(/OS (\d+(?:_\d+)?)/).replace("_", "."));
    } else if (/iPad/.test(ua)) {
        operatingSystem = named("iPadOS", major(/OS (\d+(?:_\d+)?)/).replace("_", "."));
    } else if (/Android/.test(ua)) {
        operatingSystem = named("Android", major(/Android (\d+(?:\.\d+)?)/));
    } else if (/CrOS/.test(ua)) {
        operatingSystem = "ChromeOS";
    } else if (/Windows/.test(ua)) {
        operatingSystem = "Windows";
    } else if (/Mac OS X|Macintosh/.test(ua)) {
        operatingSystem = "macOS";
    } else if (/Linux/.test(ua)) {
        operatingSystem = "Linux";
    }

    return { browser, operatingSystem };
}

/** The page the person is on: its path, with no query string or fragment (the API cuts them off again). */
export function routeOf(location: Location | { pathname?: string } | null | undefined): string {
    return String(location?.pathname || "/");
}

export function feedbackContext(win: Window = window): FeedbackContext {
    const { browser, operatingSystem } = describeBrowser(win.navigator?.userAgent);
    return {
        route: routeOf(win.location),
        appVersion: siteVersion,
        browser,
        operatingSystem,
        recentApiCalls: recentCalls(),
    };
}
