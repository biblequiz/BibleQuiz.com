import { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import ReactSidebarSublist from "./ReactSidebarSublist";
import { createMultiReactAtom } from "utils/MultiReactNanoStore";
import type { NavigateFunction } from "react-router-dom";

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
    attrs?: any;
    navigate: () => void;
}

export interface ReactSidebarGroup {
    type: 'group';
    label: string;
    entries: (ReactSidebarLink | ReactSidebarGroup)[];
    collapsed: boolean;
    icon?: string;
    id?: string;
}

export type ReactSidebarEntry = ReactSidebarLink | ReactSidebarGroup;

export interface ReactSidebarState {
    showParent: boolean;
    entries: ReactSidebarEntry[];
}

export const reactSidebarEntries = createMultiReactAtom<ReactSidebarState>("reactSidebarEntries", []);

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

    const sidebarState = useStore(reactSidebarEntries);

    const [currentPage, setCurrentPage] = useState<ReactSidebarLink | null>(null);

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
    }, [loadingElementId, sidebarState]);

    if (!sidebarState || sidebarState.entries.length === 0) {
        return null;
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