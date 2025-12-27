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
    variant: string;
    class: string;
    text: string;
}

export interface ReactSidebarLink {
    type: 'link';
    label: string;
    isCurrent: boolean;
    icon?: string;
    iconClass?: string[];
    attrs?: any;
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