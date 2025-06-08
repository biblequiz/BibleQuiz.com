import path from "path";
import fg from 'fast-glob';
import { fileURLToPath } from 'url';

/**
 * Locates the root source path of an Astro project by searching for the 'src' directory based on the
 * URL of the current page.
 * 
 * @param metaUrl URL from import.meta.url.
 * @returns Root source path of the Astro project.
 * @throws Error if the 'src' directory cannot be found in the path.
 */
export function getAstroRootSourcePath(metaUrl: string): string {

    let potentialPath: string | null = fileURLToPath(metaUrl);

    while (potentialPath && potentialPath.length > 0 && path.basename(potentialPath) != "src") {
        potentialPath = path.dirname(potentialPath);
    }

    if (potentialPath) {
        return potentialPath;
    }

    throw new Error(`Could not find the 'src' directory in the path: ${fileURLToPath(metaUrl)}`);
}

/**
 * Retrieves all files matching a wildcard pattern in a specified directory.
 * 
 * @param baseDirectory Root directory for the search.
 * @param pattern Pattern to match.
 * @returns Array of matching file paths.
 */
export async function getFilesByWildcard(baseDirectory: string, pattern: string): Promise<string[]> {
    const files = await fg(pattern, { cwd: baseDirectory, absolute: true });
    return files;
}