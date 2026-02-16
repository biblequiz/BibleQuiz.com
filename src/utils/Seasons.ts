import { fileExists, getAstroRootSourcePath, getFilesByWildcard } from "./FileSystem";

/**
 * Retrieves all available seasons.
 * 
 * @param metaUrl URL for the current module.
 * @param minSeason Optional minimum season to include.
 * @returns Ordered (in descending order) array of seasons.
 */
export async function getSeasons(metaUrl: string, minSeason?: number): Promise<number[]> {

    const rootSourcePath = await getAstroRootSourcePath(metaUrl);
    const patternSuffix = "/index.mdx";
    const seasonFiles = await getFilesByWildcard(
        `${rootSourcePath}/content/docs`,
        "*/Seasons/[0-9][0-9][0-9][0-9]" + patternSuffix,
    );

    const uniqueSeasons = new Set<number>();
    for (const file of seasonFiles) {
        const startPosition = file.lastIndexOf(
            "/",
            file.length - patternSuffix.length - 1,
        );
        if (startPosition >= 0) {
            const parts = file
                .substring(startPosition + 1, file.length - patternSuffix.length)
                .split("/");
            if (parts.length === 1) {
                const fileSeason = parseInt(parts[0]);
                if (!minSeason || fileSeason >= minSeason) {
                    uniqueSeasons.add(fileSeason);
                }
            }
        }
    }

    const seasons = Array.from(uniqueSeasons);
    seasons.sort((a, b) => b - a);

    return seasons;
}

/**
 * Calculates the link to the current season's results page.
 * @param metaUrl URL for the current module.
 * @param eventType Type of the event.
 * 
 * @returns URL for the current season's results page (if it exists) or the season page if not.
 */
export async function getCurrentSeasonResultsUrl(
    metaUrl: string,
    eventType: string): Promise<string | undefined> {

    const rootSourcePath = await getAstroRootSourcePath(metaUrl);

    const rootSeasonsForType = `${rootSourcePath}/content/docs/${eventType}/Seasons`;

    const seasons = await getSeasons(metaUrl);
    for (const season of seasons) {
        if (await fileExists(`${rootSourcePath}/data/generated/seasons/${season}/events.json`)) {
            if (
                await fileExists(`${rootSeasonsForType}/${season}/results.mdx`)
            ) {
                return `/${eventType}/seasons/${season}/results/`;
            } else {
                return `/${eventType}/seasons/${season}/`;
            }
        }
    }
}