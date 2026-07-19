# Content and Resource Authoring

This is the target authoring model for the navigation migration. Content contributors continue editing pages in `src/content/docs` and use frontmatter to control how pages are discovered.

## Routine page updates

Edit the page title, description, sidebar metadata, and body as you do today. Pages do not need Resource metadata unless they should appear in a Program, audience, topic, or Tools & Downloads view.

```yaml
---
title: "Training for Coaches"
description: "Practical guidance for starting and leading a Bible Quiz team."
---
```

## Make a page discoverable as a Resource

Add a `resource` block. The page URL is used automatically when `href` is omitted.

```yaml
---
title: "Training for Coaches"
description: "Practical guidance for starting and leading a Bible Quiz team."
resource:
  programs: [tbq]
  audiences: [coach]
  topics: [learn]
  format: page
---
```

## Show one Resource in multiple places

Use arrays. This does not duplicate the page.

```yaml
resource:
  programs: [jbq]
  audiences: [quizzer, parent, coach]
  topics: [questions, learn, tools]
  format: app
  featured: true
  actionLabel: Open Tool
```

This example can appear in JBQ, Learn & Train, Tools & Downloads, and relevant audience pages while retaining one title and destination.

## Link directly to a file

Use `href` when the Resource should open or download a file instead of the metadata page.

```yaml
---
title: "2026 JBQ Official Rules"
description: "The current official Junior Bible Quiz rules."
resource:
  programs: [jbq]
  audiences: [parent, coach, event-coordinator]
  topics: [rules, learn, tools]
  format: pdf
  href: /assets/2026/2026-jbq-rules.pdf
  season: 2026
  current: true
  featured: true
  label: Official Rules
  order: -90
  actionLabel: Download PDF
---
```

The MDX body may be empty when the file itself is the destination.

`label` and `order` are optional. When omitted, the new Resource views reuse
`sidebar.label` and `sidebar.order`, then fall back to the page title and normal
alphabetical ordering. This preserves the intentional labels and sequencing
already maintained by contributors.

## Pages with several downloads

Keep the explanatory page as the Resource when its files belong together. The TBQ Rules page is an example: visitors benefit from seeing the official, simplified, and special rule options in context.

Create separate lightweight metadata pages only when individual files need independent filtering, promotion, or descriptions.

## Vocabulary

The implementation will validate these values and report misspellings during `npm run check`.

**Programs**

- `jbq`
- `tbq`
- `shared`

**Audiences**

- `quizzer`
- `parent`
- `coach`
- `event-coordinator`

**Topics**

- `apps`
- `forms`
- `graphics`
- `history`
- `learn`
- `questions`
- `rules`
- `scoresheets`
- `tools`

**Formats**

- `app`
- `page`
- `pdf`
- `video`
- `xls`
- `zip`

The lists should grow only when a genuinely different concept is needed. Prefer reusing an existing value so filters stay understandable.

## Validation

Run:

```sh
npm run check
```

Invalid Program, audience, topic, or format values should produce a content-schema error that points to the page frontmatter.

## Maintenance rules

- Keep the Resource metadata with its canonical page.
- Keep existing `sidebar.label` and `sidebar.order` unless the replacement view has been reviewed and intentionally differs.
- Do not add the same Resource to a TypeScript list.
- Do not copy a Resource just to make it appear in another category; add another topic or audience value.
- Keep historical event files in their event or season context unless they need promotion in Tools & Downloads.
- Use clear titles and descriptions because cards and search results derive from them.
