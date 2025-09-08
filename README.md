# Authoring Notes

## Docs

* [Starlight](https://starlight.astro.build/getting-started/)

## /public vs. /src

* `/public`: Assets that will be accessed when the user is running the site (e.g., pdf file).
* `/src`: Assets used during the build (e.g., JSON files containing data).

## Longer Blogs

When writing a blog post, you need to add a line with just `{/* excerpt */}` near the beginning to ensure
the Starlight blog cuts it off in the feed. This isn't needed for shorter blogs.

## Icons

When using the `FontAwesome` component, convert the CSS Style from fontawesome.com to:

1. Prefix converts from `Docs Prefix` value to `Prefix` (e.g., `fa-brands` becomes `fab`).
2. Icon name is converted to camel case where the `-` (dash) is removed and the following character
   is replaced with upper case (e.g., `fa-battle-net` becomes `faBattleNet`).

| Name    | Free | Paid | Prefix | Docs Prefix | NPM Package (free)                  |
| ------- | ---- | ---- | ------ | ----------- | ----------------------------------- |
| Brands  | Yes  | No   | fab    | fa-brands   | @fortawesome/free-brands-svg-icons  |
| Regular | Yes  | Yes  | far    | fa-regular  | @fortawesome/free-regular-svg-icons |
| Solid   | Yes  | Yes  | fas    | fa-solid    | @fortawesome/free-solid-svg-icons   |

## Sidebar

### Icon

To use an icon on the sidebar, add the following to the frontmatter of the page (replacing the icon with the
desired value):

```yaml
sidebar:
  attrs:
    icon: fab fa-windows
```

### External Link

To use a link not backed by a page, you can add an `href` to the attrs that will be used by the sidebar.
For example:

```mdx
---
title: "Results"
sidebar:
  attrs:
    href: /assets/2026/2026-jbq-rules.pdf
    target: _blank
---

:::caution
The content of this page is programmatically replaced by the automatic event page generation. The 
frontmatter is used to sort and label the item in the sidebar. If you see this, it's an error or you
manually navigated to this page.
:::
```

### Sorting

By default, sorting happens based on the *file name*, not the title.

## Table of Contents

### Change the Header Levels

You can set the `minHeaderLevel` and `maxHeaderLevel` in the frontmatter for each page to override how deep
into the headers the table of content generation will run.

```yaml
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 4
```

### Hide Table of Contents

Add `tableOfContents: false` to the frontmatter.

### Event Pages

Event pages are generated in a programmatic way with predictable links. If you want to override where it
appears in the Sidebar, create a `*.mdx` file in the same path with the following content:

```mdx
---
title: "Results"
sidebar:
  label: Results
---

:::caution
The content of this page is programmatically replaced by the automatic event page generation. The frontmatter is used to sort
and label the item in the sidebar. If you see this, it's an error.
:::
```

## Developing

For local development, run:
```
npm run start
```

Before you submit, run to avoid failures remotely:
```
npm run build
```