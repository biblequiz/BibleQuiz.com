import { getCollection } from "astro:content";

export interface DocPageLink {
    href: string;
    title: string;
    order: number;
}

/**
 * Lists the content pages directly or indirectly under a folder, for linking from Task Hubs.
 *
 * @param prefix Folder path, such as "tbq/history/nationals/" (matched case-insensitively).
 * @param exclude Optional pattern of page ids to leave out.
 */
export async function getDocPagesUnder(prefix: string, exclude?: RegExp): Promise<DocPageLink[]> {
    const lowerPrefix = prefix.toLowerCase();
    const docs = await getCollection("docs");

    return docs
        .filter((doc) => {
            const id = doc.id.toLowerCase();
            return id.startsWith(lowerPrefix) && (!exclude || !exclude.test(id));
        })
        .map((doc) => ({
            href: `/${doc.id.toLowerCase()}/`.replace(/\/index\/$/, "/"),
            title: doc.data.sidebar?.label ?? doc.data.title,
            order: doc.data.sidebar?.order ?? 0,
        }))
        .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

/**
 * Finds one content page's link by id, or null if it doesn't exist.
 */
export async function getDocPage(id: string): Promise<DocPageLink | null> {
    const lowerId = id.toLowerCase().replace(/\/$/, "");
    const docs = await getCollection("docs");
    const doc = docs.find((d) => d.id.toLowerCase() === lowerId);

    return doc
        ? { href: `/${lowerId}/`.replace(/\/index\/$/, "/"), title: doc.data.title, order: doc.data.sidebar?.order ?? 0 }
        : null;
}
