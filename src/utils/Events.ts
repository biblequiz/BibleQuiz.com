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
export async function getAllGeneratedEvents(
    metaUrl: string): Promise<{ type: string, urlPath: string, event: EventInfo }[]> {

    const rootSourcePath = await getAstroRootSourcePath(metaUrl);

    const eventJsonFiles = [
        path.resolve(rootSourcePath, "data/generated/futureEvents.json"),
        ...(await getFilesByWildcard(
            path.resolve(rootSourcePath, "data/generated/seasons"),
            "*/events.json",
        )),
    ];

    const results: { type: string, urlPath: string, event: EventInfo }[] = [];
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
