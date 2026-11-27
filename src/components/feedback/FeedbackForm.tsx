import { useCallback, useEffect, useRef, useState } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { CloudflareTurnstile } from "utils/CloudflareTurnstile";
import type { FeedbackContext } from "utils/feedback/FeedbackContext";
import {
    kindLabels,
    signedInMaxScreenshots,
    visitorMaxScreenshots,
    type FeedbackBridge,
    type FeedbackPicture,
} from "utils/feedback/FeedbackBridge";

/** A picture held by the form's own window: the main window's page (and its copy) can go before the report is sent. */
interface Shot {
    blob: Blob;
    url: string;
    source: "page" | "file";
    label: string;
}

interface Props {
    /** The bridge to use, looked up at each call (the main window's page can change between them). Null when there is none. */
    getBridge: () => FeedbackBridge | null;
    /** In the separate window: what to say when the main window has gone. */
    lostText: string;
    onClose: () => void;
    onDirtyChange?: (dirty: boolean) => void;
}

const maxLength = 4000;

/**
 * The Give feedback form (the same design as Study Hub's), in the separate window on a computer and in the sheet on a phone. The person chooses when to
 * take each screenshot and which to send: in the separate window they go back to biblequiz.com, get to the step, and press Take screenshot here, which
 * draws that page. Attach a picture adds one of their own. Each is shown in order with Remove. The report is sent first, saying how many screenshots
 * follow, and the screenshots after it in that order; if only some fail, the report still counts and the person is told which. A visitor who isn't
 * signed in passes Cloudflare Turnstile and may send fewer screenshots.
 */
export default function FeedbackForm({ getBridge, lostText, onClose, onDirtyChange }: Props) {
    const [kind, setKind] = useState("idea");
    const [description, setDescription] = useState("");
    const [shots, setShots] = useState<Shot[]>([]);
    const [context, setContext] = useState<FeedbackContext | null>(null);
    const [signedIn, setSignedIn] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [capturing, setCapturing] = useState(false);
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState("");
    const [captureMessage, setCaptureMessage] = useState("");
    const [sent, setSent] = useState<{ warning: string } | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);
    const shotsList = useRef<HTMLOListElement>(null);
    const turnstile = useRef<TurnstileInstance | null>(null);
    const shotsRef = useRef<Shot[]>([]);
    shotsRef.current = shots;

    const limit = signedIn ? signedInMaxScreenshots : visitorMaxScreenshots;
    const full = shots.length >= limit;
    const canSend = !sending && !capturing && description.trim() !== "" && (signedIn || !!captchaToken);

    const readContext = useCallback(() => {
        const bridge = getBridge();
        try {
            setContext(bridge ? bridge.context() : null);
            setSignedIn(bridge ? bridge.isSignedIn() : false);
        }
        catch {
            setContext(null);
        }
    }, [getBridge]);

    useEffect(() => {
        readContext();
        const onFocus = () => readContext();
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, [readContext]);

    useEffect(() => {
        onDirtyChange?.(!sent && (description.trim() !== "" || shots.length > 0));
    }, [description, shots.length, sent, onDirtyChange]);

    const release = (shot: Shot) => URL.revokeObjectURL(shot.url);

    // Copies a picture the main window made into this window, and lets the main window's copy go.
    const keep = async (bridge: FeedbackBridge, picture: FeedbackPicture, source: Shot["source"], label: string): Promise<Shot> => {
        const blob = new Blob([await picture.blob.arrayBuffer()], { type: picture.type });
        try {
            bridge.release(picture.url);
        }
        catch {
            // That page has gone already.
        }

        return { blob, url: URL.createObjectURL(blob), source, label };
    };

    // Let go of every picture when the form goes.
    useEffect(() => () => shotsRef.current.forEach(release), []);

    const added = (shot: Shot) => {
        setShots(current => [...current, shot]);
        setTimeout(() => shotsList.current?.lastElementChild?.scrollIntoView?.({ block: "nearest" }), 0);
    };

    const capture = async () => {
        if (full) {
            return;
        }

        const bridge = getBridge();
        if (!bridge) {
            setCaptureMessage(lostText);
            return;
        }

        setCaptureMessage("");
        setCapturing(true);
        try {
            const picture = await bridge.capture();
            if (!picture) {
                setCaptureMessage("The page is too big to send as a picture. You can send your feedback without it.");
                return;
            }

            added(await keep(bridge, picture, "page", "Screenshot"));
            readContext();
        }
        catch {
            setCaptureMessage("The page couldn't be drawn. You can try again, or send your feedback without it.");
        }
        finally {
            setCapturing(false);
        }
    };

    const attachFiles = async (files: File[]) => {
        if (files.length === 0) {
            return;
        }

        const bridge = getBridge();
        if (!bridge) {
            setCaptureMessage(lostText);
            return;
        }

        setCaptureMessage("");
        const room = Math.max(0, limit - shotsRef.current.length);
        const skipped: string[] = [];
        setCapturing(true);
        try {
            for (const file of files.slice(0, room)) {
                let picture: FeedbackPicture | null = null;
                try {
                    // Its bytes go to the main window, which makes (and sends) the picture.
                    picture = await bridge.adopt(await file.arrayBuffer(), file.type);
                }
                catch {
                    picture = null;
                }

                if (!picture) {
                    skipped.push(file.name);
                    continue;
                }

                added(await keep(bridge, picture, "file", file.name || "Picture"));
            }
        }
        finally {
            setCapturing(false);
        }

        const notes: string[] = [];
        if (skipped.length > 0) {
            notes.push(`${skipped.join(", ")} couldn't be added: attach a picture (PNG, JPEG or WebP, for example).`);
        }

        if (files.length > room) {
            const left = files.length - room;
            notes.push(`Up to ${limit} can be sent with your feedback, so ${left} of the files you picked ${left === 1 ? "was" : "were"} not added.`);
        }

        setCaptureMessage(notes.join(" "));
    };

    const removeShot = (index: number) => {
        const shot = shots[index];
        if (!shot) {
            return;
        }

        release(shot);
        setShots(current => current.filter((_, at) => at !== index));
        setCaptureMessage("");
    };

    const send = async () => {
        if (!canSend) {
            return;
        }

        const bridge = getBridge();
        if (!bridge) {
            setMessage(lostText);
            return;
        }

        setMessage("");
        setSending(true);
        try {
            const current = bridge.context();
            const result = await bridge.send({
                kind,
                description: description.trim(),
                context: current,
                screenshotCount: shots.length,
                captchaToken,
            });
            if (!result.ok) {
                setMessage(result.message);
                // A Turnstile token is good for one try.
                turnstile.current?.reset();
                setCaptchaToken(null);
                return;
            }

            // One at a time, in the order taken, so they are numbered in that order. Any past what this report may carry is not sent.
            const failed: string[] = [];
            let why = "";
            for (const [index, shot] of shots.slice(0, result.maxScreenshots).entries()) {
                const sender = getBridge();
                const uploaded = sender
                    ? await sender.sendScreenshot(result.id, result.uploadToken, await shot.blob.arrayBuffer(), shot.blob.type)
                    : { ok: false, status: 0, message: lostText };
                if (!uploaded.ok) {
                    failed.push(shot.source === "file" ? shot.label : `screenshot ${index + 1}`);
                    why ||= uploaded.message;
                }
            }

            let warning = "";
            if (failed.length > 0) {
                warning = failed.length === 1 && shots.length === 1
                    ? `Your feedback was sent, but the screenshot couldn't be added. ${why}`
                    : `Your feedback was sent, but ${failed.length === 1 ? "this" : "these"} couldn't be added: ${failed.join(", ")}. ${why}`;
            }

            shots.forEach(release);
            setShots([]);
            setDescription("");
            setKind("idea");
            setCaptchaToken(null);
            setSent({ warning });
        }
        finally {
            setSending(false);
        }
    };

    const another = () => {
        setSent(null);
        setMessage("");
        setCaptureMessage("");
        readContext();
    };

    if (sent) {
        return (
            <div className="space-y-3" data-test="feedback-sent">
                <p role="status" className="alert alert-success" data-test="feedback-sent-message">
                    Thank you. Your feedback was sent.
                </p>
                {sent.warning && (
                    <p role="alert" className="alert alert-warning" data-test="feedback-screenshot-warning">{sent.warning}</p>
                )}
                <div className="flex justify-end gap-2">
                    <button type="button" className="btn" onClick={another} data-test="feedback-another">Send another</button>
                    <button type="button" className="btn btn-primary" onClick={onClose} data-test="feedback-done">Close</button>
                </div>
            </div>
        );
    }

    return (
        <form
            className="space-y-4"
            data-test="feedback-form"
            onSubmit={event => {
                event.preventDefault();
                send();
            }}>
            <fieldset>
                <legend className="font-semibold mb-2">What is it?</legend>
                <div className="join w-full" role="group" aria-label="What is it?">
                    {kindLabels.map(option => (
                        <button
                            key={option.code}
                            type="button"
                            className={`btn join-item flex-1 h-auto min-h-11 py-2 px-2 text-sm sm:text-base whitespace-normal ${kind === option.code ? "btn-primary" : ""}`}
                            aria-pressed={kind === option.code}
                            data-test={`feedback-kind-${option.code}`}
                            onClick={() => setKind(option.code)}>
                            {option.label}
                        </button>
                    ))}
                </div>
            </fieldset>

            <label className="block">
                <span className="font-semibold">
                    {kind === "idea" ? "What would you like?" : kind === "problem" ? "What happened?" : "What would you like to tell us?"}
                </span>
                <textarea
                    className="textarea w-full mt-1"
                    rows={5}
                    maxLength={maxLength}
                    value={description}
                    onChange={event => setDescription(event.target.value)}
                    data-test="feedback-description" />
            </label>

            <div className="space-y-2" data-test="feedback-shots">
                <div className="font-semibold">Screenshots</div>
                <p className="text-sm opacity-80">
                    Take a screenshot at each step of what you're showing: go back to biblequiz.com, get to the step, then come back here and press
                    Take screenshot. Only the biblequiz.com page is drawn, never your screen or other tabs; password fields and email addresses are
                    covered first. Up to {limit} go with your feedback{signedIn ? "" : " (sign in to send more)"}, and you see each one before you send it.
                </p>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        className="btn"
                        disabled={capturing || sending || full}
                        aria-busy={capturing}
                        onClick={capture}
                        data-test="feedback-take-screenshot">
                        {capturing ? "Taking the picture…" : shots.length > 0 ? "Take another screenshot" : "Take screenshot"}
                    </button>
                    <button
                        type="button"
                        className="btn"
                        disabled={capturing || sending || full}
                        onClick={() => fileInput.current?.click()}
                        data-test="feedback-attach">
                        Attach a picture
                    </button>
                    <input
                        ref={fileInput}
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        tabIndex={-1}
                        aria-hidden="true"
                        data-test="feedback-attach-input"
                        onChange={event => {
                            const files = Array.from(event.target.files ?? []);
                            event.target.value = "";
                            attachFiles(files);
                        }} />
                </div>
                {full && (
                    <p className="text-sm" data-test="feedback-shots-full">
                        That's the most that can go with one report ({limit}). Remove one to add another.
                    </p>
                )}
                {captureMessage && <p role="alert" className="text-sm text-error" data-test="feedback-capture-message">{captureMessage}</p>}
                {shots.length > 0 && (
                    <ol ref={shotsList} className="grid grid-cols-2 gap-2 p-0 m-0" style={{ listStyle: "none" }} data-test="feedback-preview">
                        {shots.map((shot, index) => (
                            <li key={shot.url} className="min-w-0 m-0" style={{ listStyle: "none" }} data-test={`feedback-shot-${index}`}>
                                <img
                                    src={shot.url}
                                    alt={`${shot.label}, to be sent with your feedback`}
                                    className="block w-full h-28 object-contain object-top border border-base-300 rounded bg-base-200"
                                    data-test="feedback-preview-image" />
                                <div className="flex items-center justify-between gap-1 mt-1 min-w-0">
                                    <span className="truncate text-sm" data-test="feedback-shot-label">{index + 1}. {shot.label}</span>
                                    <button
                                        type="button"
                                        className="btn btn-sm"
                                        disabled={sending}
                                        aria-label={`Remove ${shot.label} ${index + 1}`}
                                        onClick={() => removeShot(index)}
                                        data-test="feedback-remove">
                                        Remove
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ol>
                )}
            </div>

            <details data-test="feedback-context" onToggle={readContext}>
                <summary className="cursor-pointer font-semibold">What's sent with your feedback</summary>
                {context ? (
                    <dl className="mt-2 text-sm space-y-1">
                        <dt className="font-semibold">Page</dt>
                        <dd data-test="feedback-context-route">{context.route}</dd>
                        <dt className="font-semibold">Site version</dt>
                        <dd>{context.appVersion}</dd>
                        <dt className="font-semibold">Browser</dt>
                        <dd>{context.browser} on {context.operatingSystem}</dd>
                        <dt className="font-semibold">Last requests to our servers</dt>
                        <dd>
                            {context.recentApiCalls.length > 0 ? (
                                <ol className="font-mono text-xs pl-4" data-test="feedback-context-calls">
                                    {context.recentApiCalls.map((call, index) => (
                                        <li key={index}>{call.method} {call.path} → {call.status || "no answer"}</li>
                                    ))}
                                </ol>
                            ) : "None yet"}
                        </dd>
                    </dl>
                ) : (
                    <p className="text-sm mt-2">{lostText}</p>
                )}
                <p className="text-sm mt-2 opacity-80">
                    {signedIn
                        ? "Your account goes with it (as an id; not your name or email address in what our team reads)."
                        : "You're not signed in, so nothing identifies you."}{" "}
                    No page content is sent unless you add a screenshot or picture.
                </p>
            </details>

            {!signedIn && (
                <div data-test="feedback-captcha">
                    <Turnstile
                        ref={turnstile}
                        siteKey={CloudflareTurnstile.siteKey}
                        onSuccess={token => setCaptchaToken(token)}
                        onExpire={() => setCaptchaToken(null)}
                        onError={() => setCaptchaToken(null)} />
                </div>
            )}

            {message && <p role="alert" className="alert alert-error" data-test="feedback-message">{message}</p>}
            <div className="flex justify-end gap-2">
                <button type="button" className="btn" disabled={sending} onClick={onClose} data-test="feedback-cancel">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!canSend} aria-busy={sending} data-test="feedback-send">
                    {sending && <span className="loading loading-spinner loading-sm"></span>}
                    {sending ? "Sending…" : "Send"}
                </button>
            </div>
        </form>
    );
}
