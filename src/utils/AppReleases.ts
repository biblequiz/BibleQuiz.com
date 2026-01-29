import path from "path";
import { fileExists, getAstroRootSourcePath, getFilesByWildcard, tryReadFileAsJson } from './FileSystem';

const ROOT_SOURCE_PATH = await getAstroRootSourcePath(import.meta.url);

/**
 * Manifest for a specific app.
 */
export interface AppReleasesManifest {

  /**
   * URL for all releases.
   */
  allReleasesUrl: string;

  /**
   * Latest stable release.
   */
  latest: AppReleaseManifest;

  /**
   * Latest prerelease.
   */
  prerelease: AppReleaseManifest;
}

/**
 * Manifest for a specific app release.
 */
export interface AppReleaseManifest {

  /**
   * Version of the release.
   */
  version: string;

  /**
   * Release date in ISO format (YYYY-MM-DDTHH:mm:ssZ).
   */
  releaseDate: string;

  /**
   * Mapping of platform to the download URL for the installer.
   */
  platforms: Record<AppReleasePlatform, string>;
}

/**
 * Type of platform for an app installer.
 */
export enum AppReleasePlatform {

  /**
   * Android.
   */
  Android = "android",

  /**
   * macOS
   */
  MacOS = "macos",

  /**
   * Windows
   */
  Windows = "windows",
}

/**
 * Retrieves the list of available products.
 * @returns Array of available products.
 */
export async function getAvailableProducts(): Promise<string[]> {

  const assetFiles = await getFilesByWildcard(
    path.resolve(ROOT_SOURCE_PATH, "releases"),
    "*/assets.json");

  return assetFiles.map(file => path.basename(path.dirname(file)));
}

/**
 * Gets the app release manifest for the specified product.
 * 
 * @param productName Name of the product.
 * @returns The app release manifest or null if not found.
 */
export async function getAppReleaseManifest(productName: string): Promise<AppReleasesManifest | null> {

  // Read the assets file before doing any processing of the releases.
  const assetsPath = path.resolve(ROOT_SOURCE_PATH, "releases", productName, "assets.json");
  if (!await fileExists(assetsPath)) {
    return null;
  }

  const assetManifest = await tryReadFileAsJson<AppAssetManifest>(assetsPath);
  if (!assetManifest) {
    return null;
  }

  // Read all the versions that are present.
  const versionFileNames = await getFilesByWildcard(
    path.resolve(ROOT_SOURCE_PATH, "releases", productName),
    "v*.json");

  // Sort versions in descending order.
  versionFileNames.sort((a, b) => b.localeCompare(a));

  // Extract the latest stable and prerelease versions.
  let allReleasesUrl: string | null = null;
  let latestRelease: AppReleaseManifest | null = null;
  let prerelease: AppReleaseManifest | null = null;
  for (const fileName of versionFileNames) {
    const releaseData = await tryReadFileAsJson<GitHubRelease>(fileName);
    if (!releaseData || releaseData.draft) {
      continue;
    }

    const manifest = getAppManifest(releaseData, assetManifest);
    if (!manifest) {
      continue;
    }

    allReleasesUrl = manifest.allReleasesUrl;

    if (releaseData.prerelease) {
      prerelease = manifest.manifest;
    }
    else {
      latestRelease = manifest.manifest;
      prerelease ??= manifest.manifest;
      break;
    }
  }

  return {
    allReleasesUrl: allReleasesUrl!,
    latest: latestRelease!,
    prerelease: prerelease!,
  };
}

const URL_START_SENTINEL = "/repos/";
const URL_END_SENTINEL = "/releases/";

function getAppManifest(
  gitRelease: GitHubRelease,
  assetManifest: AppAssetManifest): ProcessedAppReleaseManifest | null {

  const startPosition = gitRelease.url.indexOf(URL_START_SENTINEL);
  const endPosition = gitRelease.url.indexOf(URL_END_SENTINEL, startPosition);
  if (startPosition < 0 || endPosition < 0) {
    return null;
  }

  const parts = gitRelease.url.substring(
    startPosition + URL_START_SENTINEL.length,
    endPosition).split("/");
  if (parts.length !== 2) {
    return null;
  }

  const platforms: Record<AppReleasePlatform, string> = {} as any;

  const urlPrefix = `https://github.com/${parts[0]}/${parts[1]}/releases/download/${gitRelease.tag_name}`;
  for (const platform of Object.values(AppReleasePlatform)) {
    const fileName = assetManifest.platforms[platform];
    if (!fileName) {
      continue;
    }

    platforms[platform] = `${urlPrefix}/${fileName}`;
  }

  return {
    allReleasesUrl: `https://github.com/${parts[0]}/${parts[1]}/releases`,
    manifest: {
      version: gitRelease.tag_name,
      releaseDate: gitRelease.published_at,
      platforms: platforms
    }
  };
}

/**
 * Manifest for app assets.
 */
interface AppAssetManifest {

  /**
   * Mapping of platform to the file name that will be found in the release.
   */
  platforms: Record<AppReleasePlatform, string>;
}

/**
 * Processed app release manifest with additional metadata.
 */
interface ProcessedAppReleaseManifest {

  /**
   * Manifest for the release.
   */
  manifest: AppReleaseManifest;

  /**
   * URL for all releases.
   */
  allReleasesUrl: string;
}

/**
 * Simplified schema for a GitHub release.
 */
interface GitHubRelease {

  /**
   * Name of the tag for the release.
   */
  tag_name: string;

  /**
   * Publish date in ISO format (YYYY-MM-DDTHH:mm:ssZ).
   */
  published_at: string;

  /**
   * Value indicating whether this is a draft.
   */
  draft: boolean;

  /**
   * Value indicating whether this is a prerelease.
   */
  prerelease: boolean;

  /**
   * URL containing the release.
   */
  url: string;
}