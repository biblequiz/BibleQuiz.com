import { useEffect, type RefObject } from "react";

/**
 * Opens a native <dialog> in the browser's top layer via showModal() on mount.
 *
 * Using the `open` attribute (or daisyUI's `modal-open` class) renders the
 * dialog inline in the normal DOM flow, which makes it subject to ancestor
 * stacking contexts (e.g. Starlight's header and sidebar). A plain z-index
 * cannot lift the dialog above those contexts. showModal() promotes the dialog
 * to the top layer, which always paints above all normal page content
 * regardless of stacking contexts.
 *
 * @param dialogRef Ref to the <dialog> element to open.
 */
export function useShowModal(dialogRef: RefObject<HTMLDialogElement | null>): void {
    useEffect(() => {
        const dialog = dialogRef.current;
        if (dialog && !dialog.open) {
            dialog.showModal();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}