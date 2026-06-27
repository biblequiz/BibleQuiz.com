import { type RefObject } from "react";
import { useEscapeToClose } from "hooks/useEscapeToClose";
import { useShowModal } from "hooks/useShowModal";

/**
 * Convenience hook for native <dialog>s that combines the two concerns every
 * modal dialog in the app needs:
 *
 *  1. {@link useEscapeToClose} — registers `onClose` on the global LIFO Escape
 *     stack so that pressing Escape closes only the top-most enabled dialog
 *     (the most deeply nested dialog is dismissed before its parent).
 *  2. {@link useShowModal} — promotes the <dialog> to the browser's top layer
 *     via showModal() so it paints above Starlight's header/sidebar and any
 *     parent dialog.
 *
 * `useEscapeToClose` is intentionally invoked before `useShowModal` so the
 * Escape handler is registered ahead of the dialog being shown.
 *
 * Note: the underlying hooks remain available individually. Components that
 * need Escape handling without a native <dialog> (e.g. a fullscreen toggle in
 * SchedulePreviewTable) should keep calling `useEscapeToClose` directly.
 *
 * @param dialogRef Ref to the <dialog> element to open.
 * @param onClose   Handler invoked when Escape closes this dialog while it is
 *                  the top-most enabled entry on the stack. Typically updates
 *                  React state to unmount/close the dialog.
 * @param disabled  When true, this dialog is skipped by the Escape stack so the
 *                  next enabled dialog down the stack (typically the parent)
 *                  handles Escape instead. Pass true while a nested child dialog
 *                  owned by this dialog is open (so the child closes first) or
 *                  while this dialog is busy (e.g. saving). Defaults to false.
 */
export function useModalDialog(
    dialogRef: RefObject<HTMLDialogElement | null>,
    onClose: () => void,
    disabled: boolean = false,
): void {
    useEscapeToClose(onClose, disabled);
    useShowModal(dialogRef);
}