import { useEffect } from "react";

/**
 * Registers a capture-phase `keydown` listener that closes the current dialog
 * when the user presses Escape, and prevents the event from reaching any
 * outer dialog listeners. Because React effects run in mount order, the
 * most recently mounted (innermost) dialog's listener fires last in capture
 * phase — but it calls `stopImmediatePropagation()` so other listeners that
 * were registered earlier in the same phase still run *after* it have no
 * effect. In practice this means only the topmost dialog reacts to Escape,
 * which is the desired UX for nested dialogs.
 *
 * @param onClose Handler invoked when Escape is pressed.
 * @param disabled When true (e.g. while saving), Escape is ignored.
 */
export function useEscapeToClose(onClose: () => void, disabled: boolean = false): void {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.key !== "Escape") {
                return;
            }

            if (disabled) {
                return;
            }

            event.preventDefault();
            event.stopImmediatePropagation();
            onClose();
        };

        document.addEventListener("keydown", handleKeyDown, { capture: true });
        return () => {
            document.removeEventListener("keydown", handleKeyDown, { capture: true });
        };
    }, [onClose, disabled]);
}