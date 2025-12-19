import { getAstroRootSourcePath, getFilesByWildcard } from "./FileSystem";

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