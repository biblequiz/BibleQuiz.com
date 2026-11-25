import { useEffect, useRef } from "react";

/**
 * Keeps a form control's custom validity message in step with what is currently on screen.
 *
 * The message is applied after every render, so it follows the value the user has now (including
 * values the browser fills in on its own, like autofill) and it is cleared as soon as the cause is
 * fixed, even when the cause was a different control (e.g. a duplicate label on another card).
 * Setting it from blur handlers instead leaves a stale message behind until the user tabs through
 * the control again.
 */
export function useCustomValidity<T extends HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    message: string | null | undefined) {

    const ref = useRef<T>(null);

    useEffect(() => {
        ref.current?.setCustomValidity(message ?? "");
    });

    return ref;
}
