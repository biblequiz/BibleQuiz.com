import path from "path";
import fg from 'fast-glob';
import { fileURLToPath } from 'url';
import { promises as fs } from "fs";

/**
 * Locates the root source path of an Astro project by searching for the 'src' directory based on the
 * URL of the current page.
 * 
 * @param metaUrl URL from import.meta.url.
 * @returns Root source path of the Astro project.
 * @throws Error if the 'src' directory cannot be found in the path.
 */
export async function getAstroRootSourcePath(metaUrl: string): Promise<string> {

    let potentialPath: string | null = fileURLToPath(metaUrl);

    while (potentialPath && potentialPath.length > 0) {
        const directoryName = path.basename(potentialPath);

        if (directoryName == "src") {
            // This is the /src directory.
            return potentialPath;
        }
        else if (directoryName == "dist") {
            // During the official build process, the code is built in the /dist directory,
            // a peer of /src.
            potentialPath = path.join(potentialPath, "..", "src");
            
            if (await fileExists(potentialPath)) {
                return potentialPath;
            }
        }

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

/**
 * Determines if filePath exists in the file system.
 * 
 * @param filePath Path to the file.
 * @returns Value indicating whether the file exists.
 */
export async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true; // File exists
    } catch {
        return false; // File does not exist
    }
}

/**
 * Attempts to a read a file and return its content as a string.
 * @param filePath Path to the file.
 * @returns Content of the file as a string, or null if the file does not exist.
 */
export async function tryReadFileAsString(filePath: string): Promise<string | null> {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return content; // Successfully read file
    } catch (error) {
        return null; // File does not exist or cannot be read
    }
}

/**
 * Attempts to a read a file and return its content as JSON.
 * @param filePath Path to the file.
 * @returns Content of the file as a JSON, or null if the file does not exist.
 */
export async function tryReadFileAsJson<T>(filePath: string): Promise<T | null> {

    const content = await tryReadFileAsString(filePath);
    if (null === content) {
        return null;
    }

    return JSON.parse(content) as T;
}