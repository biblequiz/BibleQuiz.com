# Keep Starlight, replace its shell

BibleQuiz.com is a scores, registration and resources site built on Starlight, a documentation theme. When we moved to task-first navigation (see [`docs/task-navigation-plan.md`](../task-navigation-plan.md)), we kept Starlight and replaced its components (header, page frame, sidebar, page outline, and others as needed) through its override slots, rather than rebuilding on plain Astro layouts. Starlight still provides site search (Pagefind), content collections and the MDX components used across hundreds of existing pages, and every URL keeps working. A screen that fights Starlight can be a plain Astro page instead.

## Considered Options

- **Remove Starlight and use plain Astro layouts.** Rejected: gives full design freedom, but means rebuilding search, the MDX components and sidebar logic, and touching every content page, with no gain for the agreed flow.
