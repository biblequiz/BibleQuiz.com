import { RemoteServiceUrlBase, RemoteServiceUtility } from "types/services/RemoteServiceUtility";
import type { FeedbackContext } from "./FeedbackContext";

/**
 * The calls to the Registration API (ModernApps FeedbackController), made from the form's own window: the separate window or the page with the sheet.
 * They must not run in the main window's page, which the person may leave for another page while a send is under way (its calls would then never
 * finish). The sign-in token, when there is one, is read from the main window just before sending.
 */

export interface FeedbackReport {
    kind: string;
    description: string;
    context: FeedbackContext;
    screenshotCount: number;
    captchaToken: string | null;
}

export type FeedbackSendResult =
    | { ok: true; id: string; uploadToken: string; maxScreenshots: number }
    | { ok: false; status: number; message: string };

export type FeedbackUploadResult = { ok: boolean; status: number; message: string };

const tooMany = "Too many requests have come from your network just now. Please wait a minute and try again.";
const noAnswer = "Our server couldn't be reached. Check your connection and try again.";

/** The API's message for a refusal, or a fallback when it sent none (the per-minute limit answers 429 with no body). */
async function refusal(response: Response, fallback: string): Promise<string> {
    try {
        const body = await response.json() as { Message?: string };
        if (body?.Message) {
            return body.Message;
        }
    }
    catch {
        // No body.
    }

    return response.status === 429 ? tooMany : fallback;
}

function headers(token: string | null): Record<string, string> {
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function sendFeedbackReport(token: string | null, report: FeedbackReport): Promise<FeedbackSendResult> {
    let response: Response;
    try {
        response = await fetch(RemoteServiceUtility.buildUrl(RemoteServiceUrlBase.Registration, "/api/Feedback", null), {
            method: "POST",
            credentials: "include",
            headers: { ...headers(token), "Content-Type": "application/json" },
            body: JSON.stringify({
                kind: report.kind,
                description: report.description,
                route: report.context.route,
                appVersion: report.context.appVersion,
                browser: report.context.browser,
                operatingSystem: report.context.operatingSystem,
                recentApiCalls: report.context.recentApiCalls,
                screenshotCount: report.screenshotCount,
                captchaToken: token ? null : report.captchaToken,
            }),
        });
    }
    catch {
        return { ok: false, status: 0, message: noAnswer };
    }

    if (!response.ok) {
        return { ok: false, status: response.status, message: await refusal(response, "Your feedback couldn't be sent. Please try again.") };
    }

    const answer = await response.json() as { id: string; uploadToken: string; maxScreenshots: number };
    return { ok: true, id: answer.id, uploadToken: answer.uploadToken, maxScreenshots: answer.maxScreenshots };
}

export async function sendFeedbackScreenshot(token: string | null, id: string, uploadToken: string, blob: Blob): Promise<FeedbackUploadResult> {
    const form = new FormData();
    form.append("token", uploadToken);
    form.append("screenshot", blob, "screenshot");
    let response: Response;
    try {
        response = await fetch(RemoteServiceUtility.buildUrl(RemoteServiceUrlBase.Registration, `/api/Feedback/${encodeURIComponent(id)}/Screenshots`, null), {
            method: "POST",
            credentials: "include",
            headers: headers(token),
            body: form,
        });
    }
    catch {
        return { ok: false, status: 0, message: noAnswer };
    }

    return response.ok
        ? { ok: true, status: response.status, message: "" }
        : { ok: false, status: response.status, message: await refusal(response, "It couldn't be sent.") };
}
