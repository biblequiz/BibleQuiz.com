/**
 * Copies text to the clipboard. If the browser blocks the clipboard (permission denied, an http origin, etc.), it
 * shows the text in a prompt to copy by hand instead of failing silently.
 *
 * @param text Text to copy.
 * @param promptMessage Message for the prompt if the clipboard is blocked (e.g. "Copy this registration link:").
 *
 * @returns True if the text was copied; false if it was shown in the prompt instead.
 */
export async function copyToClipboard(text: string, promptMessage: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        window.prompt(promptMessage, text);
        return false;
    }
}
