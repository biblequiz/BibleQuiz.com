# ARCHITECTURE.md - Technical Architecture for BibleQuiz.com

## System Overview

BibleQuiz.com is a static website built with Astro and the Starlight documentation theme. It combines server-rendered Astro components with client-side React components for interactive features. The site communicates with two backend APIs for registration and scoring functionality.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        BibleQuiz.com                            │
│                    (Static Site - Astro)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Astro Pages  │  │    React     │  │   Starlight/MDX      │  │
│  │   (.astro)   │  │ Components   │  │     Content          │  │
│  │              │  │   (.tsx)     │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│           │                │                    │               │
│           └────────────────┼────────────────────┘               │
│                            │                                    │
│  ┌─────────────────────────┴─────────────────────────────────┐ │
│  │                    Service Layer                           │ │
│  │  (RemoteServiceUtility + Individual Service Classes)       │ │
│  └─────────────────────────┬─────────────────────────────────┘ │
└────────────────────────────┼────────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
   ┌──────────────────┐         ┌──────────────────┐
   │  registration.   │         │    scores.       │
   │  biblequiz.com   │         │  biblequiz.com   │
   │                  │         │                  │
   │  - Events        │         │  - Scoring       │
   │  - Registration  │         │  - Statistics    │
   │  - Payments      │         │  - Reports       │
   │  - Permissions   │         │  - Schedules     │
   │  - Churches      │         │                  │
   └──────────────────┘         └──────────────────┘
```

## Component Architecture

### Astro Components (`.astro`)

Server-rendered components used for:
- Page layouts and structure
- Static content rendering
- SEO-critical content
- Wrapper components that include React components

Location: `src/components/*.astro`

Key Astro Components:
| Component | Purpose |
|-----------|---------|
| `Header.astro` | Site header (overrides Starlight) |
| `Footer.astro` | Site footer (overrides Starlight) |
| `Sidebar.astro` | Custom sidebar implementation |
| `PageFrame.astro` | Main page wrapper |
| `EventList.astro` | Event listing container |

### React Components (`.tsx`)

Client-side interactive components used for:
- User interactions (forms, dialogs, filters)
- Real-time data fetching
- State-dependent UI
- Complex UI logic

Location: `src/components/*.tsx` and subdirectories

Key React Component Areas:
| Directory | Purpose |
|-----------|---------|
| `apps/event/` | Event management application |
| `apps/questionGenerator/` | Question generation tool |
| `apps/liveAndUpcoming/` | Live event display |
| `auth/` | Authentication components |
| `scores/` | Scoring and statistics display |
| `sidebar/` | React-based sidebar elements |

### React in Astro Pages

React components must be hydrated using Astro's client directives:

```astro
---
import MyComponent from 'components/MyComponent';
---

<!-- Hydrate immediately -->
<MyComponent client:load />

<!-- Hydrate when visible in viewport -->
<MyComponent client:visible />

<!-- Hydrate on idle -->
<MyComponent client:idle />
```

## State Management

### nanostores

Lightweight state management for cross-component communication.

```typescript
// src/utils/SharedState.ts
import { atom, map } from 'nanostores';

// Simple atom store
export const sharedGlobalStatusToast = atom<ToastMessage | null>(null);

// Map store for complex state
export const userPreferences = map<UserPreferences>({
  theme: 'auto',
  region: null
});
```

Usage in React components:
```typescript
import { useStore } from '@nanostores/react';
import { sharedGlobalStatusToast } from 'utils/SharedState';

function MyComponent() {
  const toast = useStore(sharedGlobalStatusToast);
  // ...
}
```

### Component-Level State

Standard React hooks for component-local state:
```typescript
const [loading, setLoading] = useState(false);
const [data, setData] = useState<DataType | null>(null);
```

## API Service Layer

### RemoteServiceUtility

Centralized HTTP client in `src/types/services/RemoteServiceUtility.ts`:

```typescript
class RemoteServiceUtility {
  // GET single record
  static getSingle<T>(auth, service, path, id, params?): Promise<T>
  
  // GET paginated results
  static getMany<T>(auth, service, path, pageSize?, pageNumber?, includeCount?, params?): Promise<T>
  
  // Generic HTTP request
  static executeHttpRequest<T>(auth, method, service, path, params?, data?): Promise<T>
  
  // File download
  static downloadFromHttpRequest(auth, method, service, path, params?, fileName?, data?): Promise<void>
}
```

### Service Classes

Individual services wrap RemoteServiceUtility for domain-specific operations:

| Service | File | Purpose |
|---------|------|---------|
| `EventsService` | `services/EventsService.ts` | Event CRUD operations |
| `RegistrationService` | `services/RegistrationService.ts` | Registration management |
| `ChurchesService` | `services/ChurchesService.ts` | Church lookup and management |
| `PeopleService` | `services/PeopleService.ts` | Person/quizzer data |
| `ReportService` | `services/ReportService.ts` | Report generation |
| `QuestionGeneratorService` | `services/QuestionGeneratorService.ts` | Question generation |

### API Endpoints

Two backend services:

**registration.biblequiz.com**
- `/events` - Event management
- `/registrations` - Event registrations
- `/payments` - Payment processing
- `/churches` - Church directory
- `/people` - Person records
- `/permissions` - Access control

**scores.biblequiz.com**
- `/reports` - Scoring reports
- `/statistics` - Quizzer/team stats
- `/schedules` - Meet schedules

## Authentication

### MSAL Integration

Azure AD authentication via `@azure/msal-browser`:

```typescript
// src/types/AuthManager.ts
class AuthManager {
  // Get current access token (refreshes if needed)
  async getLatestAccessToken(): Promise<string | null>
  
  // Trigger login popup
  requireLoginWindow(): void
  
  // Check if user is authenticated
  isAuthenticated(): boolean
}
```

### Protected Routes

Use `ProtectedRoute` component for authenticated sections:

```typescript
import ProtectedRoute from 'components/auth/ProtectedRoute';

function AdminPage() {
  return (
    <ProtectedRoute requiredPermission="admin">
      <AdminContent />
    </ProtectedRoute>
  );
}
```

## Content System

### Starlight Integration

The site uses Astro Starlight for documentation structure:

```javascript
// astro.config.mjs
starlight({
  title: "BibleQuiz.com",
  sidebar: [
    { label: "Apps", slug: "apps" },
    { label: "JBQ", collapsed: true, autogenerate: { directory: "jbq" }},
    { label: "TBQ", collapsed: true, autogenerate: { directory: "tbq" }},
    // ...
  ],
  components: {
    Header: "./src/components/Header.astro",
    Footer: "./src/components/Footer.astro",
    // Custom overrides...
  }
})
```

### MDX Content

Content files in `src/content/docs/`:

```
docs/
├── jbq/
│   ├── index.mdx
│   ├── current-season.mdx
│   ├── rules.mdx
│   └── Seasons/
│       └── 2026/
├── tbq/
│   ├── index.mdx
│   └── Seasons/
└── news/
    └── 2025-*.mdx
```

### Blog System

Uses `starlight-blog` plugin:
- Posts in `src/content/docs/news/`
- Naming convention: `YYYY-MM-DD-slug.mdx`
- Use `{/* excerpt */}` to mark post preview cutoff

## Styling Architecture

### TailwindCSS 4

Utility-first CSS with Vite plugin:

```javascript
// astro.config.mjs
vite: {
  plugins: [tailwindcss()]
}
```

### DaisyUI 5

Component library built on Tailwind:

```html
<!-- Button variants -->
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>

<!-- Card -->
<div class="card bg-base-100 shadow-xl">
  <div class="card-body">Content</div>
</div>

<!-- Modal -->
<dialog class="modal">
  <div class="modal-box">Content</div>
</dialog>
```

### Custom Styles

```
src/styles/
├── custom.css   # Starlight theme overrides
└── global.css   # Global styles and utilities
```

## Build System

### Astro Build Process

```
Source Files → Astro Build → Static HTML/CSS/JS
     │              │
     │              ├── MDX Processing (Starlight)
     │              ├── React Hydration Bundles
     │              └── Asset Optimization (Sharp)
     │
     └── TypeScript Compilation
```

### Build Configuration

```javascript
// astro.config.mjs
export default defineConfig({
  site: "https://biblequiz.com",
  output: "static",
  build: {
    format: "directory",
    assets: "_astro"
  }
});
```

### Type Checking

Strict TypeScript configuration:
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noErrorTruncation": true
  }
}
```

## Data Flow

### Static Data

JSON files in `src/data/`:
- `districts.json` - District definitions
- `regions.json` - Region definitions
- `stateRegionsAndDistricts.json` - Geographic mapping

### Dynamic Data

Fetched at runtime via service layer:
1. Component mounts
2. Calls service method
3. Service uses RemoteServiceUtility
4. Data returned and stored in component state
5. UI updates

### Content Collections

Defined in `src/content.config.ts`:
- Schema validation for frontmatter
- Type-safe content queries
- Automatic slug generation

## Error Handling

### API Errors

`RemoteServiceError` interface:
```typescript
interface RemoteServiceError {
  message: string;
  statusCode?: number;
  mitigationCode?: RemoteServiceMitigationCode;
}
```

Mitigation codes enable specific error recovery flows (e.g., redirect to sign-up, request birthdate).

### Global Toast

Error display via shared state:
```typescript
sharedGlobalStatusToast.set({
  type: 'error',
  message: 'Operation failed'
});
```

## Performance Considerations

1. **Static Generation**: Pages pre-rendered at build time
2. **Selective Hydration**: Only interactive components hydrate
3. **Image Optimization**: Sharp for image processing
4. **Code Splitting**: React components loaded on demand
5. **Pagefind**: Client-side search index