import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get all available products
 */
export function getAvailableProducts(): string[] {
  const releasesDir = path.join(__dirname, '../releases');
  const entries = fs.readdirSync(releasesDir, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}


interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  created_at: string;
  published_at: string;
  draft: boolean;
  prerelease: boolean;
  author: {
    login: string;
    avatar_url: string;
  };
  assets: Array<{
    name: string;
    size: number;
    download_count: number;
    browser_download_url: string;
  }>;
  html_url: string;
}

interface ReleaseAnalysis {
  totalReleases: number;
  latestRelease?: GitHubRelease;
  latestStableRelease?: GitHubRelease;
  totalDownloads: number;
  releasesByYear: Record<string, number>;
  prereleaseCount: number;
  stableReleaseCount: number;
  releases: GitHubRelease[];
}

interface ProcessedRelease {
  product: string;
  analysis: ReleaseAnalysis;
  generatedAt: string;
}

/**
 * Parse version from tag_name and extract year
 */
function getYearFromTag(tagName: string): string {
  const match = tagName.match(/v?(\d{4})/);
  return match ? match[1] : 'unknown';
}

/**
 * Analyze releases and generate statistics
 */
function analyzeReleases(releases: GitHubRelease[]): ReleaseAnalysis {
  // Sort by published_at descending (newest first)
  const sortedReleases = [...releases].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  const latestRelease = sortedReleases[0];
  const latestStableRelease = sortedReleases.find((r) => !r.prerelease);

  const releasesByYear: Record<string, number> = {};
  let totalDownloads = 0;
  let prereleaseCount = 0;
  let stableReleaseCount = 0;

  for (const release of releases) {
    const year = getYearFromTag(release.tag_name);
    releasesByYear[year] = (releasesByYear[year] || 0) + 1;

    if (release.prerelease) {
      prereleaseCount++;
    } else {
      stableReleaseCount++;
    }

    for (const asset of release.assets) {
      totalDownloads += asset.download_count || 0;
    }
  }

  return {
    totalReleases: releases.length,
    latestRelease,
    latestStableRelease,
    totalDownloads,
    releasesByYear,
    prereleaseCount,
    stableReleaseCount,
    releases: sortedReleases,
  };
}

/**
 * Process a single release directory
 */
function processReleaseDirectory(productName: string, dirPath: string): ProcessedRelease {
  const files = fs.readdirSync(dirPath);
  const jsonFiles = files.filter((f) => f.endsWith('.json'));

  const releases: GitHubRelease[] = [];

  for (const file of jsonFiles) {
    const filePath = path.join(dirPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    try {
      const release = JSON.parse(content) as GitHubRelease;
      releases.push(release);
    } catch (error) {
      console.warn(`Failed to parse ${filePath}:`, error);
    }
  }

  const analysis = analyzeReleases(releases);

  return {
    product: productName,
    analysis,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Process all release directories and generate JSON files
 */
export function generateReleaseData(
  releasesDir: string = path.join(__dirname, '../releases'),
  outputDir: string = path.join(__dirname, '../../public/api/releases')
): Map<string, ProcessedRelease> {
  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  const results = new Map<string, ProcessedRelease>();

  // Read all directories in releases/
  const entries = fs.readdirSync(releasesDir, { withFileTypes: true });
  const directories = entries.filter((entry) => entry.isDirectory());

  for (const dir of directories) {
    const productName = dir.name;
    const dirPath = path.join(releasesDir, productName);

    console.log(`Processing releases for ${productName}...`);

    const processedData = processReleaseDirectory(productName, dirPath);
    results.set(productName, processedData);

    // Write individual product JSON file
    const outputPath = path.join(outputDir, `${productName}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2), 'utf-8');
    console.log(`Generated ${outputPath}`);
  }

  // Generate index file with all products
  const index = {
    products: Array.from(results.keys()),
    generatedAt: new Date().toISOString(),
  };

  const indexPath = path.join(outputDir, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8');
  console.log(`Generated ${indexPath}`);

  return results;
}

/**
 * Get processed release data for a specific product (for use in Astro pages)
 */
export function getReleaseData(productName: string): ProcessedRelease | null {
  const releasesDir = path.join(__dirname, '../releases');
  const dirPath = path.join(releasesDir, productName);

  if (!fs.existsSync(dirPath)) {
    return null;
  }

  return processReleaseDirectory(productName, dirPath);
}
