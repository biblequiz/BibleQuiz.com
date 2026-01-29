# Release Data Generator

This system processes JSON files from the `src/releases/` directory and generates aggregated release data with analysis that can be:
- Downloaded as JSON files
- Used at build time in Astro components
- Accessed via API endpoints

## Directory Structure

```
src/
├── releases/
│   ├── ScoreKeep/
│   │   ├── v2026.1.26.2.json
│   │   └── v2026.1.26.3.json
│   └── [OtherProduct]/
│       └── *.json
├── utils/
│   └── releaseProcessor.ts
├── pages/
│   └── api/
│       └── releases/
│           ├── index.json.ts
│           └── [product].json.ts
└── components/
    └── ReleaseSummary.astro

scripts/
└── generate-releases.js

public/
└── api/
    └── releases/
        ├── index.json
        └── ScoreKeep.json
```

## Usage

### 1. At Build Time

The release data is automatically generated during build:

```bash
npm run build
```

This runs `npm run generate:releases` before building, which creates static JSON files in `public/api/releases/`.

### 2. Manually Generate JSON Files

```bash
npm run generate:releases
```

### 3. In Astro Components (Server-Side)

```astro
---
import { getReleaseData, getAvailableProducts } from '../utils/releaseProcessor';

// Get specific product
const scoreKeepData = getReleaseData('ScoreKeep');

// Get all available products
const products = getAvailableProducts();
---

{scoreKeepData && (
  <div>
    <h2>Total Releases: {scoreKeepData.analysis.totalReleases}</h2>
    <p>Latest: {scoreKeepData.analysis.latestRelease?.tag_name}</p>
  </div>
)}
```

### 4. Using the Pre-built Component

```astro
---
import ReleaseSummary from '../components/ReleaseSummary.astro';
---

<ReleaseSummary product="ScoreKeep" />
```

### 5. Via API Endpoints

The JSON files are available at:

- **Index**: `/api/releases/index.json` - Lists all available products
- **Product**: `/api/releases/[product].json` - Full release data for a specific product

Example:
- `https://biblequiz.com/api/releases/ScoreKeep.json`

### 6. Download Links

Add download links in your pages:

```html
<a href="/api/releases/ScoreKeep.json" download>
  Download ScoreKeep Release Data
</a>
```

## Data Structure

### Input (GitHub Release JSON)

Each JSON file in `src/releases/[Product]/` should follow the GitHub Release API format:

```json
{
  "id": 280320447,
  "tag_name": "v2026.1.26.2",
  "name": "Test Release 5",
  "body": "Release description...",
  "created_at": "2026-01-27T14:16:40Z",
  "published_at": "2026-01-27T14:21:35Z",
  "draft": false,
  "prerelease": true,
  "author": {
    "login": "michsco",
    "avatar_url": "https://..."
  },
  "assets": [],
  "html_url": "https://github.com/..."
}
```

### Output (Processed Release Data)

```typescript
{
  "product": "ScoreKeep",
  "analysis": {
    "totalReleases": 10,
    "latestRelease": { /* GitHub Release object */ },
    "latestStableRelease": { /* GitHub Release object */ },
    "totalDownloads": 523,
    "releasesByYear": {
      "2025": 3,
      "2026": 7
    },
    "prereleaseCount": 4,
    "stableReleaseCount": 6,
    "releases": [ /* All releases sorted by date */ ]
  },
  "generatedAt": "2026-01-27T15:00:00.000Z"
}
```

## Analysis Features

The processor automatically calculates:

- **Total Releases**: Count of all releases
- **Latest Release**: Most recent release (including pre-releases)
- **Latest Stable Release**: Most recent non-prerelease
- **Total Downloads**: Sum of all asset download counts
- **Releases by Year**: Breakdown of releases per year
- **Pre-release Count**: Number of pre-releases
- **Stable Release Count**: Number of stable releases
- **Sorted Releases**: All releases ordered by publish date (newest first)

## Adding New Products

1. Create a new directory in `src/releases/[ProductName]/`
2. Add GitHub release JSON files to that directory
3. Run `npm run generate:releases` or rebuild the site
4. The new product will automatically be available

## TypeScript Types

All types are defined in `src/utils/releaseProcessor.ts`:

- `GitHubRelease`: GitHub release structure
- `ReleaseAnalysis`: Analysis results
- `ProcessedRelease`: Final output format

## Client-Side Fetching

To fetch release data client-side:

```typescript
// Fetch product list
const indexResponse = await fetch('/api/releases/index.json');
const index = await indexResponse.json();

// Fetch specific product
const productResponse = await fetch('/api/releases/ScoreKeep.json');
const releaseData = await productResponse.json();
```

## Caching

API endpoints are configured with:
- `Cache-Control: public, max-age=3600` (1 hour cache)
- Static pre-rendering at build time

## Notes

- All JSON files are pre-rendered at build time for optimal performance
- The system supports any number of products and releases
- Release data is automatically sorted by publish date
- Pre-releases are identified and tracked separately
- Download counts are aggregated from all assets
