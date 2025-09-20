import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import ReactSidebarSublist from "./ReactSidebarSublist";
import { createMultiReactAtom } from "utils/MultiReactNanoStore";

interface Props {
    loadingElementId: string;
    nested: boolean;
}

export interface ReactSidebarBadge {
    variant: string;
    class: string;
    text: string;
}

export interface ReactSidebarLink {
    type: 'link';
    label: string;
    href: string;
    isCurrent: boolean;
    attrs: any;
}

export interface ReactSidebarGroup {
    type: 'group';
    label: string;
    entries: (ReactSidebarLink | ReactSidebarGroup)[];
    collapsed: boolean;
}

export type ReactSidebarEntry = ReactSidebarLink | ReactSidebarGroup;

export const reactSidebarEntries = createMultiReactAtom<ReactSidebarEntry[]>("reactSidebarEntries", []);

export default function ReactSidebar({ loadingElementId, nested }: Props) {

    const entries = useStore(reactSidebarEntries);

    useEffect(() => {
        const fallback = document.getElementById(loadingElementId);
        if (fallback) fallback.style.display = entries.length > 0 ? "none" : "";
    }, [loadingElementId, entries]);

    if (entries.length === 0) {
        return null;
    }

    return <ReactSidebarSublist entries={entries} keyPrefix="reactsb-" nested={nested} />;
}