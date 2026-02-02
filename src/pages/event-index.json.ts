import type { APIRoute } from "astro";
import path from "path";
import { promises as fs } from "fs";
import type { EventTypeList, EventList, EventInfo } from "types/EventTypes";
import { getAstroRootSourcePath, getFilesByWildcard } from "utils/FileSystem";

export const GET: APIRoute = async () => {
    const rootSourcePath = await getAstroRootSourcePath(import.meta.url);

    // Load all event JSON files (future events + historical seasons)
    const eventJsonFiles = [
        path.resolve(rootSourcePath, "data/generated/futureEvents.json"),
        ...(await getFilesByWildcard(
            path.resolve(rootSourcePath, "data/generated/seasons"),
            "*/events.json",
        )),
    ];

    // Build the event ID to URL mapping
    const eventIndex: Record<string, string> = {};

    for (const eventsFilePath of eventJsonFiles) {
        const events = JSON.parse(
            await fs.readFile(eventsFilePath, "utf-8"),
        ) as EventTypeList;

        for (const type of Object.keys(events)) {
            const typeEvents = events[type] as EventList;
            for (const urlPath of Object.keys(typeEvents)) {
                const event = typeEvents[urlPath] as EventInfo;
                // urlPath is in format "container/slug/"
                // Full URL is /{type}/seasons/{season}/{container}/{slug}/
                eventIndex[event.id] = `/${type}/seasons/${event.season}/${urlPath}`;
            }
        }
    }

    return new Response(JSON.stringify(eventIndex), {
        headers: {
            "Content-Type": "application/json",
        },
    });
};