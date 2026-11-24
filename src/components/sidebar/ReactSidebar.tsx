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
 * Gets the label for the phone section bar (D28): the current page's name, or its top-level group's name when
 * the page is just that group's "General" page (e.g. "Scoring").
 */
function getCurrentPageLabel(entries: ReactSidebarEntry[], page: ReactSidebarLink): string {
    if (page.label !== "General") {
        return page.label;
    }

    for (const entry of entries) {
        if (entry.type === "group" && getCurrentPage(entry.entries) === page) {
            return entry.label;
        }
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