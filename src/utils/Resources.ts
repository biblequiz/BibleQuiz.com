import { getCollection, type CollectionEntry } from "astro:content";

export type Program = "jbq" | "tbq" | "shared";
export type ResourceAudience =
    | "quizzer"
    | "parent"
    | "coach"
    | "event-coordinator";
export type ResourceTopic =
    | "apps"
    | "forms"
    | "graphics"
    | "history"
    | "learn"
    | "questions"
    | "rules"
    | "scoresheets"
    | "tools";
export type ResourceFormat =
    | "app"
    | "page"
    | "pdf"
    | "video"
    | "xls"
    | "zip";

type ResourceData = NonNullable<CollectionEntry<"docs">["data"]["resource"]>;

export interface ResourceViewModel extends Omit<ResourceData, "order"> {
    id: string;
    title: string;
    description?: string;
    href: string;
    order: number;
}

export interface ResourceFilters {
    program?: Program;
    audience?: ResourceAudience;
    topic?: ResourceTopic;
    current?: boolean;
    featured?: boolean;
}

export const programLabels: Record<Program, string> = {
    jbq: "JBQ",
    tbq: "TBQ",
    shared: "Shared",
};

export const audienceLabels: Record<ResourceAudience, string> = {
    quizzer: "Quizzer",
    parent: "Parent",
    coach: "Coach",
    "event-coordinator": "Event Coordinator",
};

export const topicLabels: Record<ResourceTopic, string> = {
    apps: "Apps",
    forms: "Forms",
    graphics: "Graphics",
    history: "History",
    learn: "Learn & Train",
    questions: "Questions",
    rules: "Rules",
    scoresheets: "Scoresheets",
    tools: "Tools",
};

export function getContentHref(entryId: string): string {
    const normalizedId = entryId
        .replace(/\\/g, "/")
        .replace(/\/index$/i, "")
        .toLowerCase();
    return `/${normalizedId}/`.replace(/\/+/g, "/");
}

function matchesFilters(
    resource: ResourceViewModel,
    filters: ResourceFilters,
): boolean {
    if (
        filters.program &&
        !resource.programs.includes(filters.program) &&
        !resource.programs.includes("shared")
    ) {
        return false;
    }

    if (
        filters.audience &&
        !resource.audiences.includes(filters.audience)
    ) {
        return false;
    }

    if (filters.topic && !resource.topics.includes(filters.topic)) {
        return false;
    }

    if (filters.current !== undefined && resource.current !== filters.current) {
        return false;
    }

    if (
        filters.featured !== undefined &&
        resource.featured !== filters.featured
    ) {
        return false;
    }

    return true;
}

export async function getResources(
    filters: ResourceFilters = {},
): Promise<ResourceViewModel[]> {
    const entries = await getCollection(
        "docs",
        ({ data }) => data.resource !== undefined,
    );

    return entries
        .map((entry): ResourceViewModel => {
            const resource = entry.data.resource!;
            const sidebar =
                typeof entry.data.sidebar === "object"
                    ? entry.data.sidebar
                    : undefined;
            return {
                ...resource,
                id: entry.id,
                title:
                    resource.label ??
                    sidebar?.label ??
                    entry.data.title,
                description: entry.data.description,
                href: resource.href ?? getContentHref(entry.id),
                order: resource.order ?? sidebar?.order ?? 0,
            };
        })
        .filter((resource) => matchesFilters(resource, filters))
        .sort(
            (left, right) =>
                Number(right.current) - Number(left.current) ||
                Number(right.featured) - Number(left.featured) ||
                left.order - right.order ||
                left.title.localeCompare(right.title),
        );
}
