/**
 * The page's last calls to our APIs, sent with Give feedback so a report says what the page was doing. Only the method, the path without its query
 * string, and the status are kept (0 when nothing answered): never a body, a header or a query, so nothing typed into a search reaches a report. The
 * API cuts and checks them again.
 */

export interface FeedbackApiCall {
    method: string;
    path: string;
    status: number;
}

export const maxRecentCalls = 20;

const calls: FeedbackApiCall[] = [];

/** The path of an address, without its host, query string or fragment. */
export function callPath(url: string): string {
    try {
        return new URL(url, "https://registration.biblequiz.com").pathname;
    }
    catch {
        return String(url).split(/[?#]/)[0];
    }
}

/** Called by RemoteServiceUtility after every call, answered or not. */
export function recordCall(method: string, url: string, status: number): void {
    calls.push({ method: String(method || "GET").toUpperCase(), path: callPath(url), status: Number.isFinite(status) ? status : 0 });
    if (calls.length > maxRecentCalls) {
        calls.splice(0, calls.length - maxRecentCalls);
    }
}

/** A copy of the calls kept, oldest first. */
export function recentCalls(): FeedbackApiCall[] {
    return calls.map(call => ({ ...call }));
}
