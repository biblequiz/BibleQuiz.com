import { RemoteServiceUrlBase, RemoteServiceUtility } from "types/services/RemoteServiceUtility";

/**
 * How far a sign-in got (matches ApiSignInClientProgressKind on the server).
 */
export type SignInProgressKind = "Started" | "Completed";

/**
 * Progress of a sign-in, reported to POST api/Auth/ClientSignInProgress.
 */
export interface SignInProgress {

    /**
     * How far the sign-in got.
     */
    kind: SignInProgressKind;

    /**
     * Which sign-in it is (e.g. "loginPopup").
     */
    stage: string;

    /**
     * Id of the sign-in attempt, which ties its progress and error reports together.
     */
    attempt: string;

    /**
     * How long the attempt had been running, in milliseconds.
     */
    elapsedMs?: number;

    /**
     * Correlation id MSAL sent to the identity provider, which finds the attempt in its sign-in logs.
     */
    correlationId?: string | null;
}

/**
 * Sign-in error, reported to POST api/Auth/ClientError.
 */
export interface SignInError {

    /**
     * Where it happened (e.g. "loginPopup", "profile").
     */
    stage: string;

    /**
     * Id of the sign-in attempt, which ties its progress and error reports together.
     */
    attempt: string;

    /**
     * How long the attempt had been running, in milliseconds.
     */
    elapsedMs?: number;

    /**
     * Error code (e.g. MSAL's errorCode, such as "user_cancelled" when the popup was closed).
     */
    errorCode?: string | null;

    /**
     * More specific error code (e.g. MSAL's subError).
     */
    subError?: string | null;

    /**
     * Correlation id MSAL sent to the identity provider, which finds the attempt in its sign-in logs.
     */
    correlationId?: string | null;

    /**
     * Error message.
     */
    message?: string | null;
}

/**
 * Creates an id for a sign-in attempt.
 */
export function createSignInAttemptId(): string {
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Reports the progress of a sign-in to the registration server. Everything inside the sign-in popup
 * happens on the identity provider's page, so otherwise the server never hears about an attempt that
 * is abandoned there.
 *
 * This never throws or rejects: a failed report must not break signing in.
 *
 * @param progress Progress to report.
 * @param accessToken Access token for the user, if signed in, so the server can log who it was.
 */
export function reportSignInProgress(progress: SignInProgress, accessToken?: string | null): void {
    post(
        "/api/Auth/ClientSignInProgress",
        {
            Kind: progress.kind,
            Stage: truncate(progress.stage, 64),
            Attempt: truncate(progress.attempt, 32),
            ElapsedMs: toElapsedMs(progress.elapsedMs),
            CorrelationId: truncate(progress.correlationId, 64),
        },
        accessToken);
}

/**
 * Reports a sign-in error to the registration server so a user who can't sign in leaves a trace.
 *
 * This never throws or rejects: a failed report must not break signing in.
 *
 * @param error Error to report.
 */
export function reportSignInError(error: SignInError): void {
    post(
        "/api/Auth/ClientError",
        {
            Stage: truncate(error.stage, 64),
            Attempt: truncate(error.attempt, 32),
            ElapsedMs: toElapsedMs(error.elapsedMs),
            ErrorCode: truncate(error.errorCode, 128),
            SubError: truncate(error.subError, 128),
            CorrelationId: truncate(error.correlationId, 64),
            Message: truncate(error.message, 1024),
        },
        null);
}

function post(path: string, body: object, accessToken: string | null | undefined): void {
    try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (accessToken) {
            headers["Authorization"] = `Bearer ${accessToken}`;
        }

        fetch(
            RemoteServiceUtility.buildUrl(RemoteServiceUrlBase.Registration, path, null),
            {
                method: "POST",
                headers,
                keepalive: true,
                body: JSON.stringify(body),
            })
            .catch(error => console.warn("Unable to report the sign-in event.", error));
    }
    catch (error) {
        console.warn("Unable to report the sign-in event.", error);
    }
}

function toElapsedMs(elapsedMs: number | undefined): number | null {
    return elapsedMs === undefined ? null : Math.max(0, Math.round(elapsedMs));
}

function truncate(value: string | null | undefined, maxLength: number): string | null {
    if (!value) {
        return null;
    }

    return value.length > maxLength ? value.substring(0, maxLength) : value;
}
