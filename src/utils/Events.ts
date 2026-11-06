import path from "path";
import { promises as fs } from "fs";
import type { EventInfo, EventList, EventTypeList } from "types/EventTypes";
import { getAstroRootSourcePath, getFilesByWildcard } from "./FileSystem";

/**
 * Retrieves every generated event and report (upcoming and live events plus all archived seasons).
 *
 * @param metaUrl URL for the current module.
 * @returns Events with the type and URL path (e.g., "tournaments/slug/") they are keyed by in the JSON.
 */
export function getAllGeneratedEvents(
    metaUrl: string): Promise<GeneratedEvent[]> {

    // Several pages need these during the same build, so read the files once.
    generatedEventsPromise ??= loadGeneratedEvents(metaUrl);
    return generatedEventsPromise;
}

/**
 * Maps each generated event or report id to the archive version it was generated from (null if the entry
 * predates versions). Embedded in pages at build time since it only changes when the archive job commits.
 *
 * @param metaUrl URL for the current module.
 */
export async function getArchiveVersions(metaUrl: string): Promise<{ [id: string]: string | null }> {
    return Object.fromEntries(
        (await getAllGeneratedEvents(metaUrl)).map(e => [e.event.id, e.event.archiveVersion ?? null]));
}

type GeneratedEvent = { type: string, urlPath: string, event: EventInfo };

let generatedEventsPromise: Promise<GeneratedEvent[]> | null = null;

async function loadGeneratedEvents(metaUrl: string): Promise<GeneratedEvent[]> {

    const rootSourcePath = await getAstroRootSourcePath(metaUrl);

    const eventJsonFiles = [
        path.resolve(rootSourcePath, "data/generated/futureEvents.json"),
        ...(await getFilesByWildcard(
            path.resolve(rootSourcePath, "data/generated/seasons"),
            "*/events.json",
        )),
    ];

    const results: GeneratedEvent[] = [];
    for (const eventsFilePath of eventJsonFiles) {
        const events = JSON.parse(
            await fs.readFile(eventsFilePath, "utf-8"),
        ) as EventTypeList;

        for (const type of Object.keys(events)) {
            const typeEvents = events[type] as EventList;
            for (const urlPath of Object.keys(typeEvents)) {
                results.push({ type, urlPath, event: typeEvents[urlPath] as EventInfo });
            }
        }
    }

    return results;
}
