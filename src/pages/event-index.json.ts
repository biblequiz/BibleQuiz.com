import type { APIRoute } from "astro";
import { getAllGeneratedEvents } from "utils/Events";

export const GET: APIRoute = async () => {

    // Build the event ID to URL mapping. urlPath is in format "container/slug/" so the full URL is
    // /{type}/seasons/{season}/{container}/{slug}/
    const eventIndex: Record<string, string> = {};
    for (const { type, urlPath, event } of await getAllGeneratedEvents(import.meta.url)) {
        eventIndex[event.id] = `/${type}/seasons/${event.season}/${urlPath}`;
    }

    return new Response(JSON.stringify(eventIndex), {
        headers: {
            "Content-Type": "application/json",
        },
    });
};
