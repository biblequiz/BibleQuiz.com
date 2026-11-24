/**
 * The Tasks visitors navigate the site by (see docs/task-navigation-plan.md and CONTEXT.md).
 *
 * This is the single list used by the header, the Menu, the Task Chooser (home page), the
 * breadcrumb and the route middleware that decides which Section Navigation a page shows.
 */

export type TaskId =
    | "events"
    | "scores"
    | "downloads"
    | "study"
    | "learn"
    | "news"
    | "manage";

export interface TaskInfo {
    id: TaskId;

    /** Full label, used on the Task Chooser, in the Menu and in breadcrumbs. */
    label: string;

    /** Short label for the desktop header links. */
    shortLabel: string;

    /** One-line description shown under the label on the Task Chooser and in the Menu. */
    description: string;

    /** URL of the Task Hub. */
    href: string;

    /** Font Awesome icon name (see components/FontAwesomeIcon). */
    icon: string;

    /** True if the Task is for signed-in administrators (shown quieter, never as a header link). */
    isAdmin?: boolean;
}

export const TASKS: readonly TaskInfo[] = [
    {
        id: "events",
        label: "Live & upcoming events",
        shortLabel: "Live & upcoming",
        description: "Today's scores, schedules & registration",
        href: "/events/",
        icon: "fas faTowerBroadcast",
    },
    {
        id: "scores",
        label: "Past scores & history",
        shortLabel: "Past scores",
        description: "Results by season, Nationals records",
        href: "/scores/",
        icon: "fas faTrophy",
    },
    {
        id: "downloads",
        label: "Apps, rules & downloads",
        shortLabel: "Apps & rules",
        description: "Apps, rulebooks, scoresheets & forms",
        href: "/downloads/",
        icon: "fas faDownload",
    },
    {
        id: "study",
        label: "Study & practice",
        shortLabel: "Study",
        description: "Season material, questions, training",
        href: "/study/",
        icon: "fas faBookOpen",
    },
    {
        id: "learn",
        label: "Learn about Bible Quiz",
        shortLabel: "Learn",
        description: "New here? What JBQ and TBQ are",
        href: "/learn/",
        icon: "fas faCircleInfo",
    },
    {
        id: "news",
        label: "News",
        shortLabel: "News",
        description: "Newsletters & announcements",
        href: "/news/",
        icon: "fas faNewspaper",
    },
    {
        id: "manage",
        label: "Manage events, people & more",
        shortLabel: "Manage",
        description: "Events, reports, permissions · sign in",
        href: "/manage/",
        icon: "fas faLock",
        isAdmin: true,
    },
];

export function getTask(id: TaskId): TaskInfo {
    return TASKS.find(t => t.id === id)!;
}

/**
 * Rules mapping a URL path to the Task it belongs to. The first match wins, so more specific
 * rules come first.
 */
const PATH_RULES: readonly [RegExp, TaskId][] = [
    // Manage events and the other admin tools.
    [/^\/(manage|manage-events|admin)(\/|$)/, "manage"],

    // Live & upcoming events, including registration.
    [/^\/(events|register|my-registrations)(\/|$)/, "events"],

    // Rules are downloads, even when they live under a season.
    [/^\/(jbq|tbq)\/seasons\/\d{4}\/rules(\/|$)/i, "downloads"],
    [/^\/(downloads|apps)(\/|$)/, "downloads"],
    [/^\/(jbq|tbq)\/(rules|downloads)(\/|$)/i, "downloads"],

    // A season's list of invitational tournaments and training events.
    [/^\/(jbq|tbq)\/seasons\/\d{4}\/events(\/|$)/i, "events"],

    // A season's Nationals pages are the event itself.
    [/^\/(jbq|tbq)\/seasons\/\d{4}\/nationals(\/|$)/i, "scores"],

    // Season results and event scores.
    [/^\/(jbq|tbq)\/seasons\/\d{4}\/results(\/|$)/i, "scores"],
    [/^\/(jbq|tbq)\/seasons\/\d{4}\/[^/]+\/[^/]+(\/|$)/i, "scores"],
    [/^\/(scores|quizzer-search)(\/|$)/, "scores"],
    [/^\/tbq\/(history|season-awards)(\/|$)/i, "scores"],

    // A JBQ season's page is its results; a TBQ season's page is its study material.
    [/^\/jbq\/seasons\/\d{4}(\/|$)/i, "scores"],

    // Season material, practice and training.
    [/^\/tbq\/seasons\/\d{4}(\/|$)/i, "study"],
    [/^\/(study|study-hub-sign-up)(\/|$)/, "study"],
    [/^\/jbq\/question-generator(\/|$)/, "study"],
    [/^\/tbq\/(questions|training)(\/|$)/i, "study"],

    [/^\/news(\/|$)/, "news"],

    // Everything about the programs themselves.
    [/^\/(learn|jbq|tbq|subscribe|discord|wiki)(\/|$)/, "learn"],
];

/**
 * Finds the Task a page belongs to.
 *
 * @param pathname URL path of the page.
 * @returns The Task, or null for pages outside every Task (the home page, terms, privacy).
 */
export function getTaskForPath(pathname: string): TaskInfo | null {
    for (const [pattern, id] of PATH_RULES) {
        if (pattern.test(pathname)) {
            return getTask(id);
        }
    }

    return null;
}
