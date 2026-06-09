import { useEffect } from "react";

/**
 * Single entry on the global handler stack.
 *
 * `onClose` is invoked when Escape is pressed and this entry is the topmost
 * *non-disabled* entry on the stack. Disabled entries are skipped, so that
 * a parent dialog can still react to Escape when a descendant has opted out
 * of receiving Escape (e.g. an in-place fullscreen affordance that is not
 * currently active, or a dialog that is busy saving).
 */
interface Entry {
    onClose: () => void;
    disabled: boolean;
}

// Module-level stack. The last element is the "topmost" handler.
const stack: Entry[] = [];

// Sentinel used to make sure the document-level listener is attached
// exactly once, regardless of how many components mount the hook.
let isDocumentListenerAttached = false;

function handleDocumentKeyDown(event: KeyboardEvent): void {
    if (event.key !== "Escape") {
        return;
    }

    if (stack.length === 0) {
        return;
    }

    // Find the topmost *non-disabled* handler. A disabled handler is
    // effectively transparent to Escape — the next handler down the stack
    // is given the chance to handle it. This matters because some callers
    // (e.g. SchedulePreviewTable) keep a handler registered with
    // disabled=true while the relevant UI affordance is inactive; they
    // should not block their parent dialog from receiving Escape.
    let topmostEnabledIndex = -1;
    for (let i = stack.length - 1; i >= 0; i--) {
        if (!stack[i].disabled) {
            topmostEnabledIndex = i;
            break;
        }
    }

    if (topmostEnabledIndex === -1) {
        // Every registered handler is disabled. Let the event continue to
        // the browser (which may e.g. close a <dialog open> natively) and
        // do not invoke any callback.
        return;
    }

    // Consume the event so it doesn't propagate to any other listeners or
    // to the browser's default behavior (e.g. closing the <dialog open>
    // that backs the topmost dialog, which would skip the React state
    // updates the onClose handler is responsible for performing).
    event.preventDefault();
    event.stopImmediatePropagation();

    stack[topmostEnabledIndex].onClose();
}

/**
 * Registers an Escape-to-close handler that participates in a global LIFO
 * stack so that only the topmost enabled dialog reacts to the Escape key.
 *
 * This avoids the DOM pitfall that capture-phase listeners attached to the
 * same target (e.g. `document`) fire in *registration order*, which would
 * otherwise cause an outer dialog's handler to run before its nested child's
 * handler — closing the wrong dialog.
 *
 * @param onClose Handler invoked when Escape is pressed and this hook is
 *   currently the topmost enabled entry on the stack.
 * @param disabled When true, this entry is skipped: the next enabled entry
 *   down the stack (typically the parent dialog) handles Escape instead.
 *   If *all* entries on the stack are disabled, Escape falls through to the
 *   browser's default handling. This is useful both for dialogs that want
 *   to swallow Escape briefly (e.g. while saving — set `disabled=true` on
 *   your nested-dialog flags so the parent also reports disabled) and for
 *   non-modal helpers like a fullscreen toggle that only wants to react
 *   while the fullscreen mode is active.
 */
export function useEscapeToClose(onClose: () => void, disabled: boolean = false): void {
    useEffect(() => {
        const entry: Entry = { onClose, disabled };
        stack.push(entry);

        // Lazily attach the single document-level listener the first time
        // any consumer mounts.
        if (!isDocumentListenerAttached) {
            document.addEventListener("keydown", handleDocumentKeyDown, { capture: true });
            isDocumentListenerAttached = true;
        }

        return () => {
            // Remove this specific entry from the stack. Use a reference
            // check (not indexOf on a fresh object) so that re-renders that
            // recreate the entry don't accidentally remove the wrong one.
            const index = stack.lastIndexOf(entry);
            if (index !== -1) {
                stack.splice(index, 1);
            }
        };
    }, [onClose, disabled]);
}
