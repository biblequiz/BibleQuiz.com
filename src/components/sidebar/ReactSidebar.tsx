import { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import ReactSidebarSublist from "./ReactSidebarSublist";
import { createMultiReactAtom } from "utils/MultiReactNanoStore";
import type { NavigateFunction } from "react-router-dom";
import { AuthManager, type UserAccountProfile } from "types/AuthManager";

interface Props {
    loadingElementId: string;
    parentId: string;
    nested: boolean;
}

export interface ReactSidebarManifest {
    entries: ReactSidebarEntry[];
    navigate: NavigateFunction;
}

export interface ReactSidebarBadge {
    variant: 'info' | 'warning' | 'success' | 'error' | 'primary' | 'secondary' | 'neutral';
    text: string;
}

export interface ReactSidebarLink {
    type: 'link';
    label: string;
    isCurrent: boolean;
    icon?: string;
    iconClass?: string[];
    attrs?: any;
    badge?: ReactSidebarBadge;
    navigate: () => void | Promise<void>;
}

export interface ReactSidebarGroup {
    type: 'group';
    label: string;
    entries: (ReactSidebarLink | ReactSidebarGroup)[];
    collapsed: boolean;
    icon?: string;
    iconClass?: string[];
    id?: string;
}

export type ReactSidebarEntry = ReactSidebarLink | ReactSidebarGroup;

export interface ReactSidebarState {
    showParent: boolean;
    entries: ReactSidebarEntry[];
    refreshShowParent?: (state: ReactSidebarState, profile?: UserAccountProfile) => void;
}

export const reactSidebarEntries = createMultiReactAtom<ReactSidebarState>(
    "reactSidebarEntries",
    { showParent: true, entries: [] });

function getCurrentPage(entries: ReactSidebarEntry[]): ReactSidebarLink | null {
    for (const entry of entries) {
        if (entry.type === "link" && entry.isCurrent) {
            return entry;
        } else if (entry.type === "group") {
            const currentEntry = getCurrentPage(entry.entries);
            if (currentEntry) {
                return currentEntry;
            }
        }
    }

    return null;
}

/**
 * Gets the groups that lead to a page, outermost first, or null when the page isn't in these entries.
 */
function getGroupPath(entries: ReactSidebarEntry[], page: ReactSidebarLink): ReactSidebarGroup[] | null {
    for (const entry of entries) {
        if (entry === page) {
            return [];
        }
        else if (entry.type === "group") {
            const path = getGroupPath(entry.entries, page);
            if (path) {
                return [entry, ...path];
            }
        }
    }

    return null;
}

/**
 * Gets the label for the phone section bar (D28): the current page's name, with enough context to tell pages
 * of the same name apart. A group's "General" page uses the group's name (e.g. "Scoring"), and a page inside a
 * nested group such as a scoring database adds that group's name (e.g. "Region A: Teams & Quizzers").
 */
function getCurrentPageLabel(entries: ReactSidebarEntry[], page: ReactSidebarLink): string {
    const path = getGroupPath(entries, page) ?? [];
    if (page.label === "General" && path.length > 0) {
        return path[0].label;
    }
    else if (path.length > 1) {
        return `${path[path.length - 1].label}: ${page.label}`;
    }

    return page.label;
}

export default function ReactSidebar({ loadingElementId, parentId, nested }: Props) {

    const auth = AuthManager.useNanoStore();
    const sidebarState = useStore(reactSidebarEntries);

    const [currentPage, setCurrentPage] = useState<ReactSidebarLink | null>(null);
    const [isLatestShowParent, setIsLatestShowParent] = useState<boolean>(true);

    useEffect(() => {
        const fallback = document.getElementById(loadingElementId);
        if (fallback) {
            fallback.style.display = sidebarState.entries.length > 0 ? "none" : "";
        }

        const parent = document.getElementById(parentId);
        if (parent) {
            parent.style.display = sidebarState.showParent ? "" : "none";
        }

        if (sidebarState.entries.length > 0) {
            setCurrentPage(getCurrentPage(sidebarState.entries));
        }
    }, [loadingElementId, sidebarState, isLatestShowParent]);

    useEffect(() => {
        const label = document.querySelector<HTMLElement>("[data-bq-section-label]");
        if (label && currentPage) {
            label.textContent = `In this event: ${getCurrentPageLabel(sidebarState.entries, currentPage)}`;
        }
    }, [currentPage, sidebarState]);

    if (!sidebarState || sidebarState.entries.length === 0) {
        return null;
    }

    if (sidebarState.refreshShowParent && isLatestShowParent) {
        const originalShowParent = sidebarState.showParent;
        sidebarState.refreshShowParent(sidebarState, auth.userProfile ?? undefined);
        if (originalShowParent !== sidebarState.showParent) {
            setIsLatestShowParent(!isLatestShowParent);
        }
    }

    return <ReactSidebarSublist
        entries={sidebarState.entries}
        keyPrefix="reactsb-"
        nested={nested}
        setCurrentPage={p => {
            if (currentPage) {
                currentPage.isCurrent = false;
            }

            p.isCurrent = true;
            setCurrentPage(p);
        }}
    />;
}