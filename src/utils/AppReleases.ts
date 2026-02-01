import path from "path";
import { getAstroRootSourcePath, getFilesByWildcard, tryReadFileAsJson } from './FileSystem';

const ROOT_SOURCE_PATH = await getAstroRootSourcePath(import.meta.url);

/**
 * Available product with platforms.
 */
export interface AvailableAppProduct {

  /**
   * Name of the product.
   */
  name: string;

  /**
   * Available platforms.
   */
  platforms: Set<AppReleasePlatform>;
}

/**
 * Manifest for a specific app.
 */
export interface AppReleasesManifest {

  /**
   * List of stable builds.
   */
  stable: AppReleaseManifest | null;

  /**
   * List of beta builds.
   */
  beta: AppReleaseManifest | null;

  /**
   * Previous builds.
   */
  previous: AppReleaseManifest[];
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
   * URL to download the installer for the app.
   */
  downloadUrl: string;

  /**
   * Size of the file in bytes.
   */
  size: number;

  /**
   * Value indicating whether this is a beta release.
   */
  isBeta: boolean;
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

  /**
   * Windows (Uno Framework)
   */
  WindowsUno = "windows-uno",
}

/**
 * Retrieves the list of available products.
 * @returns Array of available products.
 */
export async function getAvailableProducts(): Promise<AvailableAppProduct[]> {

  const assetFiles = await getFilesByWildcard(
    path.resolve(ROOT_SOURCE_PATH, "releases"),
    "**/v*.json");

  const products: Record<string, AvailableAppProduct> = {};
  for (const file of assetFiles) {

    // Read the release data to determine the available platforms.
    const releaseData = await tryReadFileAsJson<GitHubRelease>(file);
    if (!releaseData) {
      continue;
    }

    // Find the product entry.
    const productName = path.basename(path.dirname(path.dirname(file)));
    let product = products[productName];
    if (!product) {
      product = {
        name: productName,
        platforms: new Set<AppReleasePlatform>(),
      };

      products[productName] = product;
    }

    // Determine the platform from the assets.
    for (const asset of releaseData.assets) {
      const platform = getAppPlatform(file, asset);
      if (platform) {
        product.platforms.add(platform);
      }
    }
  }

  return Object.values(products);
}

/**
 * Gets the app release manifest for the specified product.
 * 
 * @param productName Name of the product.
 * @param platform Platform for the product.
 * @returns The app release manifest or null if not found.
 */
export async function getAppReleaseManifest(
  productName: string,
  platform: AppReleasePlatform): Promise<AppReleasesManifest | null> {

  // Read all the versions that are present.
  const versionFileNames = await getFilesByWildcard(
    path.resolve(ROOT_SOURCE_PATH, "releases", productName),
    "**/v*.json");

  // Sort versions in descending order.
  versionFileNames.sort((a, b) => b.localeCompare(a));

  // Extract the latest stable and prerelease versions.
  let latestStable: AppReleaseManifest | null = null;
  let latestBeta: AppReleaseManifest | null = null;
  const previousReleases: AppReleaseManifest[] = [];
  for (const fileName of versionFileNames) {
    const releaseData = await tryReadFileAsJson<GitHubRelease>(fileName);
    if (!releaseData || releaseData.draft) {
      continue;
    }

    for (const asset of releaseData.assets) {
      const assetPlatform = getAppPlatform(fileName, asset);
      if (assetPlatform !== platform) {
        continue;
      }

      const manifest = getAppManifest(releaseData, asset);
      if (!manifest) {
        continue;
      }

      if (latestStable) {
        previousReleases.push(manifest);
      }
      else {
        if (!releaseData.prerelease && !latestStable) {
          latestStable = manifest;
        }

        if (!latestBeta) {
          latestBeta = manifest;
        }
      }
    }
  }

  if (!latestStable && !latestBeta) {
    return null;
  }

  // Generate the final manifest.
  return {
    stable: latestStable,
    beta: latestBeta,
    previous: previousReleases
  };
}

function getAppManifest(
  gitRelease: GitHubRelease,
  asset: GitHubReleaseAsset): AppReleaseManifest | null {

  let appVersion = gitRelease.tag_name;
  if (appVersion.startsWith("v") || appVersion.startsWith("V")) {
    appVersion = appVersion.substring(1);
  }

  return {
    version: appVersion,
    releaseDate: gitRelease.published_at,
    downloadUrl: asset.browser_download_url,
    size: asset.size,
    isBeta: gitRelease.prerelease,
  };
}

function getAppPlatform(versionFileName: string, asset: GitHubReleaseAsset): AppReleasePlatform | null {
  const repoName = path.basename(path.dirname(versionFileName));
  const extension = path.extname(asset.name).toLowerCase();
  switch (extension) {
    case ".msix":
    case ".msixbundle":
    case ".exe":
      if (repoName.indexOf("Uno") >= 0) {
        return AppReleasePlatform.WindowsUno;
      }
      else {
        return AppReleasePlatform.Windows;
      }
    case ".dmg":
    case ".pkg":
      return AppReleasePlatform.MacOS;
    case ".apk":
      return AppReleasePlatform.Android;
    default:
      return null;
  }
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

  /**
   * List of assets for the release.
   */
  assets: GitHubReleaseAsset[];
}

/**
 * Simplified schema for a GitHub release asset.
 */
interface GitHubReleaseAsset {

  /**
   * File name for the asset.
   */
  name: string;

  /**
   * Size of the asset in bytes.
   */
  size: number;

  /**
   * URL to download the content.
   */
  browser_download_url: string;
}