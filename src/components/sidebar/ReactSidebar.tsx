import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import ReactSidebarSublist from "./ReactSidebarSublist";
import { createMultiReactAtom } from "utils/MultiReactNanoStore";
import type { NavigateFunction } from "react-router-dom";

interface Props {
    loadingElementId: string;
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

export const reactSidebarManifest = createMultiReactAtom<ReactSidebarManifest | undefined>("reactSidebarEntries", undefined);

export default function ReactSidebar({ loadingElementId, nested }: Props) {

    const manifest = useStore(reactSidebarManifest);

    useEffect(() => {
        const fallback = document.getElementById(loadingElementId);
        if (fallback) fallback.style.display = manifest && manifest.entries.length > 0 ? "none" : "";
    }, [loadingElementId, manifest]);

    if (!manifest || manifest.entries.length === 0) {
        return null;
    }

    return <ReactSidebarSublist
        entries={manifest.entries}
        navigate={manifest.navigate}
        keyPrefix="reactsb-"
        nested={nested} />;
}