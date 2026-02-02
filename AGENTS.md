# AGENTS.md - AI Context for BibleQuiz.com

## Project Overview

BibleQuiz.com is the official website for AG (Assemblies of God) Bible Quiz, a scripture memorization and competition program. The site serves as a hub for event information, scoring reports, quizzer search, and resources for both Junior Bible Quiz (JBQ) and Teen Bible Quiz (TBQ).

## Tech Stack

- **Framework**: Astro 5.x with Starlight documentation theme
- **UI Library**: React 19 for interactive components
- **Styling**: TailwindCSS 4 + DaisyUI 5
- **Language**: TypeScript (strict mode)
- **State Management**: nanostores with @nanostores/react
- **Authentication**: Azure AD via @azure/msal-browser
- **Build Output**: Static site generation

## Essential Commands

```bash
npm run dev      # Start development server
npm run start    # Alias for dev
npm run build    # Type check + build for production
npm run check    # TypeScript type checking only
npm run preview  # Preview production build locally
```

## Project Structure

```
/
├── src/
│   ├── components/       # Reusable components (.astro and .tsx)
│   │   ├── apps/        # Full application components (event management, question generator)
│   │   ├── auth/        # Authentication-related components
│   │   ├── scores/      # Scoring and statistics components
│   │   ├── sidebar/     # Custom sidebar implementation
│   │   └── tiptap/      # Rich text editor components
│   ├── content/
│   │   └── docs/        # MDX content (JBQ, TBQ, news, etc.)
│   ├── data/            # JSON data files and generated content
│   ├── pages/           # Astro page routes
│   ├── types/           # TypeScript types and service definitions
│   │   └── services/    # API service layer
│   ├── utils/           # Utility functions
│   └── styles/          # Global CSS and Tailwind customizations
├── public/              # Static assets (images, PDFs, logos)
│   └── assets/          # Year-organized assets (1963-2026)
└── _data/               # Build-time data
```

## Path Aliases

Configured in `astro.config.mjs` and `tsconfig.json`:

```typescript
import { something } from 'assets/...';      // → src/assets
import { Component } from 'components/...';  // → src/components
import { data } from 'data/...';             // → src/data
import { Page } from 'pages/...';            // → src/pages
import { Type } from 'types/...';            // → src/types
import { util } from 'utils/...';            // → src/utils
```

## Key Architecture Patterns

### Component Types
- **`.astro` files**: Server-rendered, use for static content and layouts
- **`.tsx` files**: React components, use for interactive/client-side features

### State Management
Use nanostores for shared state:
```typescript
import { atom } from 'nanostores';
import { useStore } from '@nanostores/react';

// Define store
export const myStore = atom<string>('initial');

// Use in React component
const value = useStore(myStore);
```

### API Services
Located in `src/types/services/`. Use `RemoteServiceUtility` for HTTP requests:
```typescript
import { RemoteServiceUtility, RemoteServiceUrlBase } from 'types/services/RemoteServiceUtility';

// Two backend services available:
// - RemoteServiceUrlBase.Registration → registration.biblequiz.com
// - RemoteServiceUrlBase.Scores → scores.biblequiz.com
```

### Authentication
Uses MSAL for Azure AD authentication. Check `src/types/AuthManager.ts` for auth flow.

## Coding Conventions

### TypeScript
- Strict mode enabled
- Use explicit types, avoid `any`
- Interfaces for object shapes, types for unions/primitives

### React Components
- Functional components only
- Props interface defined above component
- Use `export default function ComponentName`

### Styling
- Use TailwindCSS utility classes
- DaisyUI components for common UI patterns (buttons, cards, modals)
- Custom CSS in `src/styles/custom.css` and `src/styles/global.css`

### Icons
FontAwesome icons via `FontAwesomeIcon` component:
```typescript
// Prefix conversion: fa-brands → fab, fa-regular → far, fa-solid → fas
// Icon name: kebab-case → camelCase (fa-battle-net → faBattleNet)
<FontAwesomeIcon icon={faBattleNet} prefix="fab" />
```

## Content Structure

### MDX Files
Located in `src/content/docs/`:
- `jbq/` - Junior Bible Quiz content
- `tbq/` - Teen Bible Quiz content  
- `news/` - Blog posts and newsletters

### Frontmatter Options
```yaml
---
title: "Page Title"
sidebar:
  label: "Sidebar Label"
  attrs:
    icon: fab fa-windows  # Sidebar icon
    href: /path/to/file   # External link override
tableOfContents: false    # Hide TOC
---
```

## Common Tasks

### Adding a New Page
1. Create `.mdx` file in appropriate `src/content/docs/` subdirectory
2. Add frontmatter with title and sidebar config
3. Sidebar auto-generates from directory structure

### Adding a React Component
1. Create `.tsx` file in `src/components/`
2. Import in Astro page with `client:load` or `client:visible` directive
3. Use path alias: `import Component from 'components/MyComponent'`

### Adding API Integration
1. Create service file in `src/types/services/`
2. Use `RemoteServiceUtility` methods for HTTP calls
3. Define response types in the service file

## Important Files

| File | Purpose |
|------|---------|
| `astro.config.mjs` | Astro and Starlight configuration |
| `src/content.config.ts` | Content collection schemas |
| `src/types/AuthManager.ts` | Authentication manager |
| `src/utils/SharedState.ts` | Global state stores |

## External Services

- **registration.biblequiz.com**: Event registration, payments, permissions
- **scores.biblequiz.com**: Scoring, statistics, reports

## Notes for AI Agents

1. This is a static site - no server-side runtime
2. React components need `client:` directives in Astro pages
3. Content uses Starlight's MDX processing with custom components
4. Check existing patterns in similar files before creating new ones
5. Run `npm run build` to verify changes compile correctly