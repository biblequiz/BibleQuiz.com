import type { AuthManager } from "types/AuthManager";
import { feedbackContext, type FeedbackContext } from "./FeedbackContext";
import { captureScreenshot, fitImage } from "./FeedbackScreenshot";

/**
 * Give feedback on biblequiz.com (the same design as Study Hub's). On a computer it is a separate window (/feedback), so it never covers the page being
 * reported and stays open while the person goes back to it, page after page, taking a screenshot at each step. On a phone, or when the browser blocks
 * the window, it is a full-screen sheet over the page instead. Either way the form does everything through a "bridge" the main window makes: the
 * context and the screenshots come from the main window, so the report is about the page the person is on, and its sign-in token when there is one;
 * the calls to the API are made from the form's own window (FeedbackApi.ts), so leaving the page mid-send can't strand them.
 *
 * biblequiz.com is a site of separate pages: each page load makes a new bridge, and the separate window looks it up again at every call
 * (`openerBridge`), so a screenshot is always of the page the person is on now. A picture belongs to the page that drew it and goes when that page
 * does, so the form copies each one into its own window at once (and hands its bytes back only to send it).
 *
 * The API (ModernApps, FeedbackController) checks and cuts everything again: POST api/Feedback, then POST api/Feedback/{id}/Screenshots once for each
 * screenshot. A visitor who isn't signed in passes Cloudflare Turnstile and may send fewer reports and screenshots.
 */

export const bridgeName = "__bqFeedback";
export const feedbackPath = "/feedback";
export const feedbackWindowName = "bq-give-feedback";
export const signedInMaxScreenshots = 5;
export const visitorMaxScreenshots = 3;

export interface FeedbackPicture {
    blob: Blob;
    url: string;
    type: string;
    size: number;
}

export interface FeedbackBridge {
    context(): FeedbackContext;
    isSignedIn(): boolean;
    capture(): Promise<FeedbackPicture | null>;
    adopt(bytes: ArrayBuffer, type: string): Promise<FeedbackPicture | null>;
    release(url: string): void;
    /** The signed-in person's token for the API, or null for a visitor. The form sends with it from its own window (FeedbackApi.ts). */
    accessToken(): Promise<string | null>;
}

declare global {
    interface Window {
        [bridgeName]?: FeedbackBridge;
    }
}

export function createFeedbackBridge(auth: AuthManager, win: Window & typeof globalThis = window): FeedbackBridge {
    const urls = new Set<string>();
    const shown = (blob: Blob): FeedbackPicture => {
        const url = win.URL.createObjectURL(blob);
        urls.add(url);
        return { blob, url, type: blob.type, size: blob.size };
    };
    const signedIn = () => auth.isAuthenticated;

    return {
        context: () => feedbackContext(win),
        isSignedIn: signedIn,
        async capture() {
            const blob = await captureScreenshot(win);
            return blob ? shown(blob) : null;
        },
        // A picture the person attached, given as its bytes so the blob is made here, in the window that sends it.
        async adopt(bytes, type) {
            const blob = await fitImage(win, new win.Blob([bytes], { type: String(type || "") }));
            return blob ? shown(blob) : null;
        },
        release(url) {
            if (url && urls.delete(url)) {
                win.URL.revokeObjectURL(url);
            }
        },
        async accessToken() {
            return signedIn() ? await auth.getLatestAccessToken() : null;
        },
    };
}

/** Makes this page's bridge, for the separate window to find. A new page (or a change of sign-in) replaces it. */
export function installFeedbackBridge(auth: AuthManager, win: Window & typeof globalThis = window): FeedbackBridge {
    const bridge = createFeedbackBridge(auth, win);
    win[bridgeName] = bridge;
    return bridge;
}

/**
 * The main window's bridge, looked up now, or null when there is none: the main window was closed, is loading its next page, or is on another site
 * (reading another site's window throws).
 */
export function openerBridge(win: Window = window): FeedbackBridge | null {
    try {
        const opener = win.opener as Window | null;
        return opener && !opener.closed ? opener[bridgeName] ?? null : null;
    }
    catch {
        return null;
    }
}

/** A phone (or a narrow window) gets the sheet: a separate window there is awkward to get back from. */
export function prefersSheet(win: Window = window): boolean {
    // Below 50rem, where the site's menu is the phone menu.
    const matches = (query: string) => !!win.matchMedia?.(query)?.matches;
    return matches("(max-width: 49.99rem)") || matches("(hover: none) and (pointer: coarse)");
}

const windowWidth = 480;
const windowHeight = 820;
const windowChrome = 100;

/** The separate window's size and place: beside the right edge of the window it opens from, kept on that screen. */
export function feedbackWindowFeatures(win: Window = window): string {
    const screen = win.screen as Screen & { availLeft?: number; availTop?: number };
    const inputs = [screen?.availWidth, screen?.availHeight, screen?.availLeft, screen?.availTop, win.screenX, win.screenY, win.outerWidth];
    if (!inputs.every(value => typeof value === "number" && Number.isFinite(value)) || !(screen.availWidth > 0 && screen.availHeight > 0)) {
        return `popup,width=${windowWidth},height=${windowHeight}`;
    }

    const width = Math.min(windowWidth, screen.availWidth);
    const height = Math.max(300, Math.min(windowHeight, screen.availHeight - windowChrome));
    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));
    const left = clamp(win.screenX + win.outerWidth - width, screen.availLeft!, screen.availLeft! + screen.availWidth - width);
    const top = clamp(win.screenY, screen.availTop!, screen.availTop! + screen.availHeight - height - windowChrome);
    return `popup,width=${width},height=${height},left=${Math.round(left)},top=${Math.round(top)}`;
}

/**
 * Opens the separate window, or brings it forward when it is already open, without loading it again (which would lose what the person wrote). Returns
 * false when the browser refused it, so the caller shows the sheet instead. Not noopener: the window is this site's own page, and it reaches this
 * window's bridge through window.opener.
 */
export function openFeedbackWindow(win: Window = window): boolean {
    // An empty address finds the window by its name without navigating it (or opens a blank one, which is then sent to the form).
    const opened = win.open("", feedbackWindowName, feedbackWindowFeatures(win));
    if (!opened) {
        return false;
    }

    let open = false;
    try {
        open = opened.location.pathname === feedbackPath;
    }
    catch {
        // Not readable: it is somewhere else, so it is sent to the form.
    }

    if (!open) {
        opened.location.replace(feedbackPath);
    }

    opened.focus?.();
    return true;
}

export const kindLabels: { code: string; label: string }[] = [
    { code: "idea", label: "Idea" },
    { code: "problem", label: "Something's not working" },
    { code: "other", label: "Other" },
];
