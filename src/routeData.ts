// @ts-nocheck - Starlight's sidebar entry types aren't exported in a way TypeScript can resolve here.
import { defineRouteMiddleware } from "@astrojs/starlight/route-data";
import type { SidebarEntry } from "@astrojs/starlight/utils/routing/types";
import { getTaskForPath, type TaskId } from "utils/Tasks";

/**
 * Replaces Starlight's site-wide sidebar with Section Navigation (D10, D12 in
 * docs/task-navigation-plan.md):
 *
 * - Public pages have no sidebar unless their Task has several pages worth listing.
 * - Pages that keep a sidebar list only the pages of their own Task.
 */
export const onRequest = defineRouteMiddleware((context) => {
    const route = context.locals.starlightRoute;
    if (!route.hasSidebar) {
        return;
    }

    const pathname = normalizePath(context.url.pathname);
    const task = getTaskForPath(pathname);

    const entries = task ? buildSectionNavigation(task.id, route.sidebar, pathname) : null;
    if (entries && entries.length > 0) {
        route.sidebar = entries;
    } else {
        route.hasSidebar = false;
        route.sidebar = [];
    }
});

function normalizePath(pathname: string): string {
    const lower = pathname.toLowerCase();
    return lower.endsWith("/") ? lower : `${lower}/`;
}

function buildSectionNavigation(
    taskId: TaskId,
    sidebar: SidebarEntry[],
    pathname: string,
): SidebarEntry[] | null {

    switch (taskId) {
        case "manage": {
            const group = findGroup(sidebar, "Manage Events");
            if (!group) {
                return null;
            }

            const entries = group.entries.map(cloneEntry);
            entries.push(link("People & Permissions", "/admin/permissions/", pathname, "fas faShieldHalved"));
            return entries;
        }

        case "study": {
            const tbq = findGroup(sidebar, "Teen Bible Quiz (TBQ)");
            const tbqSeasons = tbq ? findGroup(tbq.entries, "Seasons") : null;
            const [tbqNext, tbqCurrent] = getNextAndCurrentSeasons(tbqSeasons);

            const tbqEntries: SidebarEntry[] = [];
            if (tbqCurrent) {
                for (const entry of flattenLinks(tbqCurrent.entries)) {
                    // Results and events belong to other Tasks; rules belong to Apps, rules & downloads.
                    if (/\/(results|events|rules)\//i.test(entry.href)) {
                        continue;
                    }

                    const label = entry.label === "Overview"
                        ? `${tbqCurrent.label} season material`
                        : entry.label;
                    tbqEntries.push(link(label, entry.href, pathname));
                }
            }

            if (tbqNext) {
                tbqEntries.push(link(`Next season (${tbqNext.label})`, `/tbq/seasons/${tbqNext.label}/`, pathname));
            }

            tbqEntries.push(link("Practice questions", "/tbq/questions/", pathname));

            const training = tbq ? findGroup(tbq.entries, "Training") : null;
            if (training) {
                for (const entry of flattenLinks(training.entries)) {
                    tbqEntries.push(link(`Training: ${entry.label}`, entry.href, pathname));
                }
            }

            tbqEntries.push(link("Study Hub sign-up", "/study-hub-sign-up/", pathname));

            // A JBQ season's page holds its results, so it belongs to Past scores & history.
            const jbqEntries: SidebarEntry[] = [
                link("Question Generator", "/jbq/question-generator/", pathname),
            ];

            return [
                link("Study & practice", "/study/", pathname, "fas faBookOpen"),
                group("Teen Bible Quiz (TBQ)", tbqEntries),
                group("Junior Bible Quiz (JBQ)", jbqEntries),
            ];
        }

        case "scores": {
            // Only the history pages are a set worth listing; season results and event scores
            // are reached from the Past scores & history hub.
            if (!pathname.startsWith("/tbq/history/")) {
                return null;
            }

            const tbq = findGroup(sidebar, "Teen Bible Quiz (TBQ)");
            const history = tbq ? findGroup(tbq.entries, "History") : null;
            if (!history) {
                return null;
            }

            return [
                link("Past scores & history", "/scores/", pathname, "fas faTrophy"),
                ...history.entries.map(cloneEntry),
            ];
        }

        default:
            return null;
    }
}

function findGroup(entries: SidebarEntry[], label: string): SidebarEntry | null {
    return entries.find(e => e.type === "group" && e.label === label) ?? null;
}

/**
 * The Seasons group lists one group per season. The highest year is the Next Season and the one
 * before it is the Current Season (see CONTEXT.md).
 */
function getNextAndCurrentSeasons(seasons: SidebarEntry | null): [SidebarEntry | null, SidebarEntry | null] {
    if (!seasons) {
        return [null, null];
    }

    const years = seasons.entries
        .filter(e => e.type === "group" && /^\d{4}$/.test(e.label))
        .sort((a, b) => b.label.localeCompare(a.label));

    return [years[0] ?? null, years[1] ?? null];
}

function flattenLinks(entries: SidebarEntry[]): SidebarEntry[] {
    return entries.flatMap(e => e.type === "link" ? [e] : flattenLinks(e.entries));
}

function cloneEntry(entry: SidebarEntry): SidebarEntry {
    return entry.type === "link"
        ? { ...entry }
        : { ...entry, collapsed: false, entries: entry.entries.map(cloneEntry) };
}

function link(label: string, href: string, pathname: string, icon?: string): SidebarEntry {
    return {
        type: "link",
        label,
        href,
        isCurrent: normalizePath(href) === pathname,
        badge: undefined,
        attrs: icon ? { icon } : {},
    };
}

function group(label: string, entries: SidebarEntry[]): SidebarEntry {
    return {
        type: "group",
        label,
        entries,
        collapsed: false,
        badge: undefined,
    };
}
