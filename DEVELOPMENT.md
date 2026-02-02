# DEVELOPMENT.md - Developer Guide for BibleQuiz.com

## Getting Started

### Prerequisites

- Node.js >= 18.20.8
- npm (included with Node.js)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/biblequiz/BibleQuiz.com.git
cd BibleQuiz.com

# Install dependencies
npm install

# Start development server
npm run dev
```

The development server runs at `http://localhost:4321` by default.

### Before Submitting Changes

Always run a production build to catch any errors:

```bash
npm run build
```

This performs TypeScript type checking followed by the full Astro build.

## Content Authoring

### Creating MDX Pages

1. Create a new `.mdx` file in the appropriate directory under `src/content/docs/`
2. Add required frontmatter:

```mdx
---
title: "Your Page Title"
description: "Optional description for SEO"
---

Your content here...
```

### Sidebar Configuration

The sidebar auto-generates from the directory structure. To customize:

```yaml
---
title: "Page Title"
sidebar:
  label: "Custom Sidebar Label"  # Different from title
  order: 1                        # Sort order (lower = higher)
  badge:
    text: "NEW"
    variant: "tip"               # tip, note, caution, danger
---
```

### Adding Sidebar Icons

```yaml
---
title: "Downloads"
sidebar:
  attrs:
    icon: fas fa-download
---
```

Icon format: `{prefix} {iconName}`
- Prefixes: `fas` (solid), `far` (regular), `fab` (brands)
- Convert CSS names: `fa-download` → `fa-download` (keep kebab-case in attrs)

### External Links in Sidebar

Create a placeholder page with an `href` attribute:

```mdx
---
title: "Rules PDF"
sidebar:
  attrs:
    href: /assets/2026/2026-jbq-rules.pdf
    target: _blank
---

:::caution
This page redirects to an external resource.
:::
```

### Table of Contents

Control TOC depth per page:

```yaml
---
title: "Detailed Page"
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 4
---
```

Or hide completely:

```yaml
---
tableOfContents: false
---
```

### Writing Blog Posts

1. Create file in `src/content/docs/news/`
2. Use naming convention: `YYYY-MM-DD-slug.mdx`
3. For longer posts, add excerpt marker:

```mdx
---
title: "Newsletter Title"
date: 2025-01-15
---

Brief introduction paragraph.

{/* excerpt */}

Rest of the content...
```

## Component Development

### Creating an Astro Component

```astro
---
// src/components/MyComponent.astro
interface Props {
  title: string;
  count?: number;
}

const { title, count = 0 } = Astro.props;
---

<div class="my-component">
  <h2>{title}</h2>
  <span class="badge">{count}</span>
</div>

<style>
  .my-component {
    /* Scoped styles */
  }
</style>
```

### Creating a React Component

```typescript
// src/components/MyComponent.tsx
interface Props {
  title: string;
  onAction?: () => void;
}

export default function MyComponent({ title, onAction }: Props) {
  const [count, setCount] = useState(0);
  
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">{title}</h2>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setCount(c => c + 1);
            onAction?.();
          }}
        >
          Count: {count}
        </button>
      </div>
    </div>
  );
}
```

### Using React in Astro Pages

```astro
---
// src/pages/my-page.astro
import MyComponent from 'components/MyComponent';
---

<html>
  <body>
    <!-- Hydrate when component enters viewport -->
    <MyComponent client:visible title="Interactive Section" />
    
    <!-- Hydrate immediately on page load -->
    <MyComponent client:load title="Critical Section" />
  </body>
</html>
```

### Client Directive Cheat Sheet

| Directive | When to Use |
|-----------|-------------|
| `client:load` | Critical interactivity needed immediately |
| `client:visible` | Below fold, hydrate when scrolled into view |
| `client:idle` | Low priority, hydrate when browser is idle |
| `client:only="react"` | Never SSR, client-only rendering |

## FontAwesome Icons

### Using the FontAwesomeIcon Component

```typescript
import FontAwesomeIcon from 'components/FontAwesomeIcon';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';

// In JSX
<FontAwesomeIcon icon={faUser} />
<FontAwesomeIcon icon={faGithub} className="text-2xl" />
```

### Icon Packages

| Package | Prefix | Import |
|---------|--------|--------|
| `@fortawesome/free-solid-svg-icons` | `fas` | `import { faXxx } from '...'` |
| `@fortawesome/free-regular-svg-icons` | `far` | `import { faXxx } from '...'` |
| `@fortawesome/free-brands-svg-icons` | `fab` | `import { faXxx } from '...'` |

### Converting CSS Class to Import

```
fa-solid fa-user     → import { faUser } from '@fortawesome/free-solid-svg-icons'
fa-brands fa-github  → import { faGithub } from '@fortawesome/free-brands-svg-icons'
fa-regular fa-heart  → import { faHeart } from '@fortawesome/free-regular-svg-icons'
```

## Styling Guide

### TailwindCSS Classes

Use utility classes for styling:

```html
<div class="flex items-center gap-4 p-4 bg-base-200 rounded-lg">
  <span class="text-lg font-bold text-primary">Title</span>
  <p class="text-sm text-base-content/70">Description</p>
</div>
```

### DaisyUI Components

Common components:

```html
<!-- Buttons -->
<button class="btn">Default</button>
<button class="btn btn-primary">Primary</button>
<button class="btn btn-outline btn-secondary">Outlined</button>
<button class="btn btn-sm">Small</button>

<!-- Cards -->
<div class="card bg-base-100 shadow-xl">
  <figure><img src="..." alt="..." /></figure>
  <div class="card-body">
    <h2 class="card-title">Title</h2>
    <p>Content</p>
    <div class="card-actions justify-end">
      <button class="btn btn-primary">Action</button>
    </div>
  </div>
</div>

<!-- Modals -->
<dialog id="my-modal" class="modal">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Title</h3>
    <p>Content</p>
    <div class="modal-action">
      <form method="dialog">
        <button class="btn">Close</button>
      </form>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>

<!-- Badges -->
<span class="badge">Default</span>
<span class="badge badge-primary">Primary</span>
<span class="badge badge-secondary badge-outline">Outline</span>
```

### Custom CSS

Add custom styles in:
- `src/styles/custom.css` - Starlight theme overrides
- `src/styles/global.css` - Global utilities

## API Integration

### Creating a New Service

```typescript
// src/types/services/MyService.ts
import { RemoteServiceUtility, RemoteServiceUrlBase } from './RemoteServiceUtility';
import type { AuthManager } from '../AuthManager';

export interface MyRecord {
  id: string;
  name: string;
  // ...
}

export class MyService {
  static async getById(auth: AuthManager, id: string): Promise<MyRecord> {
    return RemoteServiceUtility.getSingle<MyRecord>(
      auth,
      RemoteServiceUrlBase.Registration,
      '/my-endpoint',
      id
    );
  }
  
  static async getAll(
    auth: AuthManager,
    pageSize: number = 20,
    pageNumber: number = 1
  ): Promise<MyRecord[]> {
    const result = await RemoteServiceUtility.getMany<{ Items: MyRecord[] }>(
      auth,
      RemoteServiceUrlBase.Registration,
      '/my-endpoint',
      pageSize,
      pageNumber,
      true
    );
    return result.Items;
  }
  
  static async create(auth: AuthManager, data: Partial<MyRecord>): Promise<MyRecord> {
    return RemoteServiceUtility.executeHttpRequest<MyRecord>(
      auth,
      'POST',
      RemoteServiceUrlBase.Registration,
      '/my-endpoint',
      null,
      data
    );
  }
}
```

### Using Services in Components

```typescript
import { MyService } from 'types/services/MyService';
import { useAuth } from 'components/auth/AuthContext';

function MyComponent() {
  const auth = useAuth();
  const [data, setData] = useState<MyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    MyService.getById(auth, 'some-id')
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [auth]);

  if (loading) return <LoadingPlaceholder text="Loading..." />;
  if (error) return <div className="alert alert-error">{error}</div>;
  
  return <div>{data?.name}</div>;
}
```

## State Management

### Creating a Shared Store

```typescript
// src/utils/SharedState.ts
import { atom, map } from 'nanostores';

// Simple value
export const isMenuOpen = atom<boolean>(false);

// Complex object
export const userSettings = map<{
  theme: 'light' | 'dark' | 'auto';
  region: string | null;
}>({
  theme: 'auto',
  region: null
});
```

### Using Stores

```typescript
// In React components
import { useStore } from '@nanostores/react';
import { isMenuOpen, userSettings } from 'utils/SharedState';

function MyComponent() {
  const menuOpen = useStore(isMenuOpen);
  const settings = useStore(userSettings);
  
  return (
    <button onClick={() => isMenuOpen.set(!menuOpen)}>
      Toggle Menu
    </button>
  );
}
```

## Testing Locally

### Development Server

```bash
npm run dev
```

Features:
- Hot module replacement
- Error overlay
- Fast refresh for React components

### Production Preview

```bash
npm run build
npm run preview
```

This builds the site and serves it locally to test production behavior.

### Type Checking Only

```bash
npm run check
```

Runs Astro's TypeScript checking without building.

## Common Patterns

### Loading States

```typescript
function DataComponent() {
  const [loading, setLoading] = useState(true);
  
  if (loading) {
    return (
      <LoadingPlaceholder 
        id="data-loader"
        text="Loading data..."
        spinnerSize="lg"
      />
    );
  }
  
  return <div>Content</div>;
}
```

### Error Handling

```typescript
import { sharedGlobalStatusToast } from 'utils/SharedState';

async function handleAction() {
  try {
    await MyService.doSomething();
    sharedGlobalStatusToast.set({
      type: 'success',
      message: 'Operation completed!'
    });
  } catch (error) {
    sharedGlobalStatusToast.set({
      type: 'error',
      message: error.message || 'Something went wrong'
    });
  }
}
```

### Confirmation Dialogs

```typescript
import ConfirmationDialog from 'components/ConfirmationDialog';

function MyComponent() {
  const [showConfirm, setShowConfirm] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowConfirm(true)}>
        Delete Item
      </button>
      
      {showConfirm && (
        <ConfirmationDialog
          title="Delete Item?"
          message="This action cannot be undone."
          onConfirm={() => {
            handleDelete();
            setShowConfirm(false);
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
```

## File Organization

### Where to Put Files

| File Type | Location |
|-----------|----------|
| Astro pages | `src/pages/` |
| MDX content | `src/content/docs/` |
| Shared components | `src/components/` |
| App-specific components | `src/components/apps/{appName}/` |
| TypeScript types | `src/types/` |
| API services | `src/types/services/` |
| Utilities | `src/utils/` |
| Static assets | `public/` |
| Build-time data | `src/data/` |

### Naming Conventions

- **Components**: PascalCase (`MyComponent.tsx`, `EventCard.astro`)
- **Utilities**: PascalCase (`DataTypeHelpers.ts`)
- **Types**: PascalCase (`EventTypes.ts`)
- **Data files**: camelCase (`districts.json`)
- **MDX content**: kebab-case (`current-season.mdx`)
- **Blog posts**: `YYYY-MM-DD-slug.mdx`

## Troubleshooting

### Build Failures

1. Run `npm run check` to isolate TypeScript errors
2. Check for missing imports or type mismatches
3. Verify all referenced files exist

### React Hydration Errors

- Ensure server and client render the same content
- Check for browser-only APIs (use `useEffect` for client-side code)
- Verify `client:` directive is present on React components

### Style Issues

- Clear browser cache
- Check DaisyUI class names against documentation
- Verify Tailwind classes are valid

### API Errors

- Check browser Network tab for request/response
- Verify authentication token is present
- Check `RemoteServiceError` for mitigation codes