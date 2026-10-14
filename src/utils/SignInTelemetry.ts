import { RemoteServiceUrlBase, RemoteServiceUtility } from "types/services/RemoteServiceUtility";

/**
 * Sign-in event reported to the registration server (POST api/Auth/ClientError).
 */
export interface SignInEvent {

    /**
     * Where it happened. A stage ending in ".started" or ".completed" with no error code reports progress
     * (e.g. "loginPopup.started"); anything else is logged as an error (e.g. "loginPopup", "profile").
     */
    stage: string;

    /**
     * Id of the sign-in attempt, which ties its started, completed and error reports together.
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
 * Reports a sign-in event to the registration server so a user who can't sign in leaves a trace.
 * Everything inside the sign-in popup happens on the identity provider's page, so otherwise the
 * server never hears about an attempt that fails or is abandoned.
 *
 * This never throws or rejects: a failed report must not break signing in.
 *
 * @param event Event to report.
 * @param accessToken Access token for the user, if signed in, so the server can log who it was.
 */
export function reportSignInEvent(event: SignInEvent, accessToken?: string | null): void {
    try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (accessToken) {
            headers["Authorization"] = `Bearer ${accessToken}`;
        }

        fetch(
            RemoteServiceUtility.buildUrl(RemoteServiceUrlBase.Registration, "/api/Auth/ClientError", null),
            {
                method: "POST",
                headers,
                keepalive: true,
                body: JSON.stringify({
                    Stage: truncate(event.stage, 64),
                    Attempt: truncate(event.attempt, 32),
                    ElapsedMs: event.elapsedMs === undefined ? null : Math.max(0, Math.round(event.elapsedMs)),
                    ErrorCode: truncate(event.errorCode, 128),
                    SubError: truncate(event.subError, 128),
                    CorrelationId: truncate(event.correlationId, 64),
                    Message: truncate(event.message, 1024),
                }),
            })
            .catch(error => console.warn("Unable to report the sign-in event.", error));
    }
    catch (error) {
        console.warn("Unable to report the sign-in event.", error);
    }
}

function truncate(value: string | null | undefined, maxLength: number): string | null {
    if (!value) {
        return null;
    }

    return value.length > maxLength ? value.substring(0, maxLength) : value;
}
