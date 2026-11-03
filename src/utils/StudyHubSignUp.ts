/**
 * Helpers for signing up through Study Hub (https://studyhub.biblequiz.com), which creates the account and church
 * without making the person the church's administrator. The Registration API decides that; this only says so.
 *
 * Entered at /study-hub-sign-up, optionally with ?returnUrl=<Study Hub address>.
 */
export class StudyHubSignUp {

    /**
     * Only this host may be returned to. Keep in step with StudyHubSignUpRules.AllowedReturnHost in ModernApps.
     */
    public static readonly ALLOWED_RETURN_HOST = "studyhub.biblequiz.com";

    /**
     * Gets the address to return to, or null if it is missing or isn't an https address on Study Hub.
     *
     * @param returnUrl Address from the query string.
     */
    public static getAllowedReturnUrl(returnUrl: string | null | undefined): string | null {

        // Browsers treat a backslash like a slash and ignore control characters, so refuse them outright.
        if (!returnUrl || returnUrl !== returnUrl.trim() || /[\\\u0000-\u001f\u007f]/.test(returnUrl)) {
            return null;
        }

        let url: URL;
        try {
            url = new URL(returnUrl);
        }
        catch {
            return null;
        }

        if ("https:" !== url.protocol ||
            url.hostname !== StudyHubSignUp.ALLOWED_RETURN_HOST ||
            "" !== url.port ||
            "" !== url.username ||
            "" !== url.password) {
            return null;
        }

        return url.href;
    }

    /**
     * Gets the allowed return address from the current page's query string.
     */
    public static getReturnUrlFromPage(): string | null {
        return StudyHubSignUp.getAllowedReturnUrl(new URLSearchParams(window.location.search).get("returnUrl"));
    }
}
