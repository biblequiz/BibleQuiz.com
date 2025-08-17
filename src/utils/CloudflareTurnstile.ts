/**
 * Helpers for interacting with Cloudflare Turnstile.
 */
export class CloudflareTurnstile {

    /**
     * Client-side site key for the Cloudflare Turnstile widget.
     */
    public static readonly siteKey: string = window.location.origin === "https://localhost:4321"
        // "2x00000000000000000000AB", // Always Fails on the Client-Side
        ? "1x00000000000000000000AA" // Always Succeeds on the Client-Side
        : "0x4AAAAAAAXk4HMKok3R9V7x";

    /**
     * Retrieves the captcha response from the form.
     */
    public static getCaptchaResponse(): string | null {

        const responseControl = document.querySelector(`input[name="cf-turnstile-response"]`) as HTMLInputElement;
        if (responseControl) {
            return responseControl.value;
        }

        return null;
    }

    /**
     * Resets the captcha control from the form.
     */
    public static resetCaptcha(): void {

        const turnstile: any = (<any>window).turnstile;
        if (turnstile) {
            turnstile.reset();
        }
    }
}