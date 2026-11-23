import { useCallback, useEffect, useRef, useState } from "react";
import { AuthManager } from "types/AuthManager";
import { useModalDialog } from "hooks/useModalDialog";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import { installFeedbackBridge, openFeedbackWindow, prefersSheet, type FeedbackBridge } from "utils/feedback/FeedbackBridge";
import FeedbackForm from "./FeedbackForm";

interface Props {
    /** In the phone menu: a full-width button. */
    mobile?: boolean;
}

/**
 * The Give feedback button, in the header on a computer and in the menu on a phone. It also makes this page's bridge, which the separate feedback
 * window uses for the context, the screenshots and the calls to the API. On a phone, or when the browser blocks the window, the form opens in a
 * full-screen sheet over the page instead, left out of its screenshots.
 */
export default function FeedbackButton({ mobile = false }: Props) {
    const auth = AuthManager.useNanoStore();
    const bridge = useRef<FeedbackBridge | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);

    useEffect(() => {
        bridge.current = installFeedbackBridge(auth);
    }, [auth]);

    const open = () => {
        if (prefersSheet() || !openFeedbackWindow()) {
            // The phone menu or the Menu, where this button is, closes first: a screenshot is of the page, not the menu.
            document.querySelector<HTMLButtonElement>('starlight-menu-button[aria-expanded="true"] button')?.click();
            document.querySelector<HTMLDialogElement>("#bq-menu-dialog[open]")?.close();
            setSheetOpen(true);
        }
    };

    return (
        <>
            <button
                type="button"
                className={mobile ? "btn btn-outline w-full mt-2" : "btn btn-ghost btn-sm"}
                onClick={open}
                data-test="feedback-open">
                <FontAwesomeIcon icon="fas faCommentDots" />
                <span>Give feedback</span>
            </button>
            {sheetOpen && <FeedbackSheet getBridge={() => bridge.current} onClose={() => setSheetOpen(false)} />}
        </>
    );
}

function FeedbackSheet({ getBridge, onClose }: { getBridge: () => FeedbackBridge | null; onClose: () => void }) {
    const dialog = useRef<HTMLDialogElement>(null);
    const dirty = useRef(false);
    const [busy, setBusy] = useState(false);
    const close = useCallback(() => {
        if (busy) {
            return;
        }

        if (!dirty.current || window.confirm("Close without sending your feedback?")) {
            onClose();
        }
    }, [onClose, busy]);
    // Escape doesn't close it while a send is under way.
    useModalDialog(dialog, close, busy);

    return (
        <dialog ref={dialog} className="modal" data-report-exclude="" onCancel={event => { event.preventDefault(); close(); }}>
            <div className="modal-box w-full max-w-lg max-h-[100dvh] sm:max-h-[90vh] h-full sm:h-auto rounded-none sm:rounded-box">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold m-0">Give feedback</h2>
                    <button type="button" className="btn btn-sm btn-ghost" aria-label="Close" disabled={busy} onClick={close}>✕</button>
                </div>
                <FeedbackForm
                    getBridge={getBridge}
                    lostText="Reload the page and open Give feedback again."
                    onClose={onClose}
                    onCancel={close}
                    onBusyChange={setBusy}
                    onDirtyChange={value => { dirty.current = value; }} />
            </div>
        </dialog>
    );
}
