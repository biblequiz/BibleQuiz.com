# Authoring Notes

## /public vs. /src

* `/public`: Assets that will be accessed when the user is running the site (e.g., pdf file).
* `/src`: Assets used during the build (e.g., JSON files containing data).

## Longer Blogs

When writing a blog post, you need to add a line with just `{/* excerpt */}` near the beginning to ensure
the Starlight blog cuts it off in the feed. This isn't needed for shorter blogs.
