/**
 * The screenshots sent with Give feedback (the same approach as Study Hub's). A screenshot is drawn from the page itself (modern-screenshot, loaded
 * only when used), never from the screen: it shows biblequiz.com only and asks the browser for nothing. It is the part of the page on screen when
 * Take screenshot is pressed (many of the site's pages are long, and the person scrolls to what they mean to show), not the whole page. Nothing is drawn until the person presses Take
 * screenshot. Before drawing, every email address in the page's text and fields is replaced with "[email hidden]", and password and email fields and
 * anything marked data-report-redact are covered, in the copy that is drawn (never the page itself). An address is found within one run of text, so
 * one split across elements (a name and a domain in separate tags) is not; a screen that shows other people's addresses that way should mark them
 * data-report-redact. The feedback sheet (data-report-exclude) is left
 * out, and pictures from another site are drawn blank rather than fetched again. Text put in by CSS (::before, ::after) is not covered.
 *
 * A picture the person attaches is always drawn again, so only its pixels are sent (a phone photo's place, device and time never leave the device).
 */

export const redactSelector = 'input[type="password" i], input[type="email" i], input[inputmode="email" i], [data-report-redact]';
export const maxScreenshotBytes = 2 * 1024 * 1024;
export const sentImageTypes = ["image/png", "image/jpeg", "image/webp"];
/** The most pixels drawn: a long page is drawn smaller rather than refused. */
export const maxScreenshotPixels = 4_000_000;
export const emailPattern = /[^\s@<>()[\]"',;:]+@[^\s@<>()[\]"',;:]+\.[A-Za-z]{2,}/g;
export const emailStandIn = "[email hidden]";

const blankImage = "data:image/png;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const maskColor = "#3d4451";
const attempts = [
    { scale: 1, quality: 0.85 },
    { scale: 0.75, quality: 0.7 },
    { scale: 0.5, quality: 0.6 },
];

function maskEmailText(root: Element): void {
    const doc = root.ownerDocument;
    if (!doc?.createTreeWalker) {
        return;
    }

    const walker = doc.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (node.nodeValue && node.nodeValue.includes("@")) {
            node.nodeValue = node.nodeValue.replace(emailPattern, emailStandIn);
        }
    }

    for (const field of Array.from(root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea"))) {
        if (typeof field.value === "string" && field.value.includes("@")) {
            field.value = field.value.replace(emailPattern, emailStandIn);
            if (field.hasAttribute("value")) {
                field.setAttribute("value", field.value);
            }
        }
    }
}

/** Covers every redacted element in a copy of the page (the one about to be drawn), and every email address in its text. Returns how many it covered. */
export function maskClone(root: Node | null): number {
    if (!root || !(root as Element).querySelectorAll) {
        return 0;
    }

    const element = root as HTMLElement;
    maskEmailText(element);
    const found = Array.from(element.querySelectorAll<HTMLElement>(redactSelector));
    if (element.matches?.(redactSelector)) {
        found.unshift(element);
    }

    for (const covered of found) {
        if (covered.tagName === "INPUT" || covered.tagName === "TEXTAREA" || covered.tagName === "SELECT") {
            (covered as HTMLInputElement).value = "";
            covered.removeAttribute("value");
            covered.removeAttribute("placeholder");
            if (covered.tagName === "TEXTAREA") {
                covered.textContent = "";
            }
        }

        for (const inner of Array.from(covered.querySelectorAll<HTMLElement>("*"))) {
            inner.style.setProperty("visibility", "hidden", "important");
        }

        covered.style.setProperty("background", maskColor, "important");
        covered.style.setProperty("color", "transparent", "important");
        covered.style.setProperty("-webkit-text-fill-color", "transparent", "important");
        covered.style.setProperty("text-shadow", "none", "important");
        covered.setAttribute("data-report-masked", "");
    }

    return found.length;
}

function sameOrigin(url: string, win: Window): boolean {
    try {
        return new URL(url, win.location.href).origin === win.location.origin;
    }
    catch {
        return false;
    }
}

type DomToBlob = (node: Node, options: Record<string, unknown>) => Promise<Blob | null>;

const fixedAttribute = "data-feedback-fixed";

/**
 * Marks the elements fixed on screen (the header, the menu, the page's contents list) with where they are now, so the copy drawn can pin them there:
 * otherwise they are drawn where they would be at the top of the page, out of the picture. Returns what puts the page back.
 */
function markFixed(win: Window): () => void {
    const marked: HTMLElement[] = [];
    for (const element of Array.from(win.document.body.querySelectorAll<HTMLElement>("*"))) {
        if (win.getComputedStyle(element).position !== "fixed") {
            continue;
        }

        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            continue;
        }

        element.setAttribute(fixedAttribute, `${rect.left + win.scrollX},${rect.top + win.scrollY},${rect.width},${rect.height}`);
        marked.push(element);
    }

    return () => marked.forEach(element => element.removeAttribute(fixedAttribute));
}

function pinFixed(root: Node): void {
    const element = root as HTMLElement;
    if (!element.querySelectorAll) {
        return;
    }

    for (const fixed of Array.from(element.querySelectorAll<HTMLElement>(`[${fixedAttribute}]`))) {
        const [left, top, width, height] = (fixed.getAttribute(fixedAttribute) ?? "").split(",").map(Number);
        fixed.style.setProperty("position", "absolute", "important");
        fixed.style.setProperty("left", `${left}px`, "important");
        fixed.style.setProperty("top", `${top}px`, "important");
        fixed.style.setProperty("width", `${width}px`, "important");
        fixed.style.setProperty("height", `${height}px`, "important");
        fixed.style.setProperty("right", "auto", "important");
        fixed.style.setProperty("bottom", "auto", "important");
        fixed.style.setProperty("margin", "0", "important");
    }
}

/** The options given to modern-screenshot for `win`, at `scale` and `quality`. */
export function screenshotOptions(win: Window, scale: number, quality: number, type: string): Record<string, unknown> {
    return {
        scale,
        quality,
        type,
        backgroundColor: win.getComputedStyle?.(win.document.body)?.backgroundColor || "#ffffff",
        filter: (node: Node) => !(node.nodeType === 1 && (node as Element).hasAttribute("data-report-exclude")),
        onCloneNode: (cloned: Node) => {
            pinFixed(cloned);
            maskClone(cloned);
        },
        fetchFn: async (url: string) => (url.startsWith("data:") || sameOrigin(url, win) ? false : blankImage),
        features: { restoreScrollPosition: true },
        timeout: 10000,
    };
}

/**
 * The part of the page on screen as an image Blob, drawn smaller and then at a lower quality when it would be too big to send. Null when it is still too
 * big. `render` is modern-screenshot's domToBlob (a test passes its own).
 */
export async function captureScreenshot(win: Window = window, render: DomToBlob | null = null): Promise<Blob | null> {
    const domToBlob: DomToBlob = render ?? ((await import("modern-screenshot")).domToBlob as unknown as DomToBlob);
    const root = win.document.documentElement;
    const width = Math.max(1, win.innerWidth || root.clientWidth || 1);
    const height = Math.max(1, win.innerHeight || root.clientHeight || 1);
    const fit = Math.min(1, Math.sqrt(maxScreenshotPixels / (width * height)));
    // The page is drawn at the size of the window, where it is scrolled to (modern-screenshot keeps the scroll), so the picture is what is on screen.
    const onScreen = { width, height };
    const unmark = markFixed(win);
    try {
        for (const attempt of attempts) {
            const blob = await domToBlob(root, { ...screenshotOptions(win, fit * attempt.scale, attempt.quality, "image/webp"), ...onScreen });
            if (blob && blob.size > 0 && blob.size <= maxScreenshotBytes) {
                return blob;
            }
        }

        return null;
    }
    finally {
        unmark();
    }
}

/**
 * A picture the person attached, always drawn again (as WebP, or as JPEG where the browser can't write WebP: Safari, so every iPhone, would otherwise
 * give a PNG too big to send), smaller and at a lower quality until it fits. Null when it can't be read as a picture or made small enough.
 */
export async function fitImage(win: Window, blob: Blob): Promise<Blob | null> {
    if (typeof win.createImageBitmap !== "function") {
        return null;
    }

    let bitmap: ImageBitmap;
    try {
        bitmap = await win.createImageBitmap(blob);
    }
    catch {
        return null;
    }

    try {
        const fit = Math.min(1, Math.sqrt(maxScreenshotPixels / Math.max(1, bitmap.width * bitmap.height)));
        for (const attempt of attempts) {
            const canvas = win.document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(bitmap.width * fit * attempt.scale));
            canvas.height = Math.max(1, Math.round(bitmap.height * fit * attempt.scale));
            const drawing = canvas.getContext("2d");
            if (!drawing) {
                return null;
            }

            // On white, so a transparent picture isn't black as a JPEG.
            drawing.fillStyle = "#ffffff";
            drawing.fillRect(0, 0, canvas.width, canvas.height);
            drawing.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            const encode = (type: string) => new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, attempt.quality));
            let drawn = await encode("image/webp");
            if (drawn && drawn.type !== "image/webp") {
                drawn = await encode("image/jpeg");
            }

            if (drawn && drawn.size > 0 && drawn.size <= maxScreenshotBytes && sentImageTypes.includes(drawn.type)) {
                return drawn;
            }
        }

        return null;
    }
    finally {
        bitmap.close?.();
    }
}
