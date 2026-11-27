import { useCallback, useEffect, useRef, useState } from "react";
import { openerBridge } from "utils/feedback/FeedbackBridge";
import FeedbackForm from "./FeedbackForm";

const lostText =
    "The biblequiz.com window was closed, is still loading, or is on another site. Go back to it (or open Give feedback from biblequiz.com again); what you wrote here is kept.";

/**
 * The separate Give feedback window (/feedback). It works through the bridge of the biblequiz.com window that opened it, looked up again at every call,
 * since that window loads a new page each time the person moves on. Opened any other way, it says to open it from biblequiz.com.
 */
export default function FeedbackWindowRoot() {
    const getBridge = useCallback(() => openerBridge(), []);
    const [connected] = useState(() => !!window.opener);
    const dirty = useRef(false);

    useEffect(() => {
        document.getElementById("feedback-fallback")?.remove();
        const onKeydown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !dirty.current) {
                window.close();
            }
        };
        const onBeforeUnload = (event: BeforeUnloadEvent) => {
            if (dirty.current) {
                event.preventDefault();
            }
        };
        document.addEventListener("keydown", onKeydown);
        window.addEventListener("beforeunload", onBeforeUnload);
        return () => {
            document.removeEventListener("keydown", onKeydown);
            window.removeEventListener("beforeunload", onBeforeUnload);
        };
    }, []);

    if (!connected) {
        return (
            <div className="space-y-3" data-test="feedback-no-opener">
                <p>Open Give feedback from the biblequiz.com page you want to tell us about, so it can include that page.</p>
                <a className="btn btn-primary" href="/">Go to biblequiz.com</a>
            </div>
        );
    }

    return (
        <FeedbackForm
            getBridge={getBridge}
            lostText={lostText}
            onClose={() => window.close()}
            onDirtyChange={value => { dirty.current = value; }} />
    );
}
