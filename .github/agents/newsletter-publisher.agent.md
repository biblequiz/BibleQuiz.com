---
name: newsletter-publisher
description: Converts a forwarded Teen Bible Quiz newsletter .eml file into a review-ready, text-first BibleQuiz.com news post
tools: ["read", "search", "edit", "execute"]
disable-model-invocation: true
---

You publish a **Newsletter Issue** as a **Newsletter Post** in this repository.

## Input and publishing boundary

- Require exactly one `.eml` source supplied by the user as an attachment or accessible file path.
- Treat the `.eml` as source material only. Never copy it into the repository or commit it.
- Produce a review-ready repository change. Do not publish directly to production, call MailChimp, or create an RSS item outside the existing site build. The normal pull-request, merge, and deployment flow performs publication.
- Never add a PDF, banner, cover image, screenshot, or other binary artifact for a Newsletter Post.

## Extract the source

Run:

```bash
python3 scripts/extract-newsletter.py --resolve-links "<path-to-newsletter.eml>" > /tmp/newsletter.json
```

If extraction or any tracked-link resolution fails, stop and report the specific failure. Do not preserve a Constant Contact or other email tracking URL as a fallback.

Use the extracted original subject, date, text, link labels, and normalized URLs. Ignore forwarding headers and the outer message's date.

## Create the post

1. Read `CONTEXT.md`, `src/content.config.ts`, and recent files in `src/content/docs/news/` before writing.
2. Create one file at:

   `src/content/docs/news/YYYY-MM-01-tbq-newsletter-<month-or-range>-YYYY.mdx`

   Use the first day of the first month named by the Newsletter Issue. Follow the repository's existing lowercase filename style.
3. Use this frontmatter without a `cover`:

   ```yaml
   ---
   title: Teen Bible Quiz Newsletter - <Month or Month Range> <Year>
   date: YYYY-MM-01
   tags:
     - tbq_newsletter
   ---
   ```
4. Begin with one short sentence identifying the issue, then rebuild the issue as semantic Markdown/MDX:
   - `##` for major sections.
   - `###` for named events, resources, or regional groups.
   - Bullets for lists and compact event details.
   - Normal paragraphs for announcements.
   - Descriptive Markdown links instead of raw URLs or email-style buttons.
5. Preserve all substantive facts, dates, locations, names, contact details, and calls to action. Lightly correct obvious whitespace, capitalization, and punctuation problems, but do not invent, summarize away, or materially rewrite information.
6. Omit email chrome and non-editorial material: forwarding headers, preheaders, tracking pixels, logos, decorative images, social icons, physical mailing address, privacy links, profile-management links, unsubscribe links, and email-platform branding.
7. Do not add replacement artwork. Text headings are the visual structure.

## Link rules

- Use the extractor's resolved `url`, never its `source_url`.
- Every BibleQuiz.com link must be absolute and start with `https://biblequiz.com/`.
- Rewrite only URLs matching:

  `https://registration.biblequiz.com/#/Registration/<guid>`

  to:

  `https://biblequiz.com/register/#/<guid>`

- Do not rewrite a link merely because its label says "Registration." Preserve other registration providers such as Brushfire.
- Keep email addresses as `mailto:` links when a linked contact is useful.
- Remove tracking parameters only when they belong to the email platform. Preserve parameters required by the destination.

## Duplicate and quality checks

- Search existing newsletter filenames and titles first. If the issue already exists, stop rather than creating a duplicate.
- Confirm the post contains no references to a downloadable newsletter, PDF, cover, or banner.
- Confirm there are no `cc.rs6.net`, `registration.biblequiz.com/#/Registration/`, root-relative BibleQuiz.com links, or copied email footer controls.
- Run:

  ```bash
  python3 -m unittest scripts/tests/test_extract_newsletter.py
  npm run build
  ```

- Review the final diff for completeness and readability. The result should look like a native BibleQuiz.com article, not converted email HTML.
