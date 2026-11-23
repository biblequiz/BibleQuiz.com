import path from "path";
import type { EventTypeList } from "types/EventTypes";
import futureEvents from "data/generated/futureEvents.json";
import { getAstroRootSourcePath, tryReadFileAsJson } from "./FileSystem";
import { getCurrentSeasonResultsUrl, getSeasons } from "./Seasons";

export interface LiveAndUpcomingData {
    currentSeason: number;
    currentSeasonLinks: Record<string, string | undefined>;
    recentSeasonEvents: EventTypeList | null;
    futureEvents: EventTypeList;
}

/**
 * Loads the event data the Event List and Happening Now need at build time.
 *
 * @param metaUrl URL for the calling module.
 */
export async function getLiveAndUpcomingData(metaUrl: string): Promise<LiveAndUpcomingData> {
    const seasons = await getSeasons(metaUrl);
    const rootSourcePath = await getAstroRootSourcePath(metaUrl);

    const maxSeasonPath = path.resolve(
        rootSourcePath,
        `data/generated/seasons/${seasons[0]}/events.json`,
    );
    const lastSeasonPath = path.resolve(
        rootSourcePath,
        `data/generated/seasons/${seasons[1]}/events.json`,
    );

    const maxSeasonEvents = await tryReadFileAsJson<EventTypeList>(maxSeasonPath);

    return {
        currentSeason: maxSeasonEvents ? seasons[0] : seasons[1],
        currentSeasonLinks: {
            jbq: await getCurrentSeasonResultsUrl(metaUrl, "jbq"),
            tbq: await getCurrentSeasonResultsUrl(metaUrl, "tbq"),
        },
        recentSeasonEvents:
            maxSeasonEvents ?? (await tryReadFileAsJson<EventTypeList>(lastSeasonPath)),
        futureEvents: futureEvents as any as EventTypeList,
    };
}
