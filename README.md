# BibleQuiz.com
This is the repo backing the [biblequiz.com](https://biblequiz.com/) web site using [GitHub Pages](https://docs.github.com/en/pages).

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/biblequiz/BibleQuiz.com. This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the [Contributor Covenant](http://contributor-covenant.org) code of conduct. Contribution 

## Development
Any change committed to the `main` branch will automatically be published to [biblequiz.com](https://biblequiz.com/). The easiest way to determine if your deployment succeeded is to look for a green checkmark near the top of the screen on the [main page](https://github.com/biblequiz/BibleQuiz.com) (next to the number of commits).

### Making Changes
There are two ways to make changes to the site:

1. **Branches & Pull Requests**\
Create a branch with all of your changes and submit a Pull Request for the `BibleQuiz.com` repository. Use this approach when making significant changes that should all be grouped together.

2. **Direct Changes**\
Add or Update a file in the appropriate path and commit it directly to `main`.

Regardless of the method chosen, please ensure the commit messages are meaningful for the changes being made. This will help future users to understand why something was added or changed.

### Directory & File Structure

The web site is powered by [GitHub Pages and Jekyll](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/about-github-pages-and-jekyll) using the [bulma-clean-theme](http://www.csrhymes.com/bulma-clean-theme/) along with some customizations specific to the site.

| Folder   | Purpose                                                |
|----------|--------------------------------------------------------|
| `_posts` | Individual blog posts segmented by year.               |
| `_pages` | Non-blog post pages making up the rest of the content. |
| `assets` | Images, files, scripts, etc., supporting the pages.    |

### Task: New Blog Post
The most common type of contribution will be creating a new blog post.

1. **Create the Page**\
    Create a new file in the format `<yyyy>-<mm>-<dd>-<simplified title>.md` in the appropriate year directory under `_posts` by clicking the `Add file` button on https://github.com/biblequiz/BibleQuiz.com. The file name has a date component `<yyyy>-<mm>-<dd>` and a `<simplified title>`, which will be used in the URL for the post.

    The top section, called [Front Matter](https://jekyllrb.com/docs/front-matter/) tells GitHub how to render the page. Be sure to complete the following fields:
    * `title`
    * `author`
    * `date`
    * `categories`

    ```
    ---
    layout: post
    title: "<Full Title>"
    author: <Author Name>
    date: "yyyy-mm-dd"
    categories: 
    - "newsletter"
    published: true
    ---
    ```

    >**TIP:** The `*.md` is a markdown file following [kramdown syntax](https://kramdown.gettalong.org/syntax.html), which is a simplified text format that can be easily converted to HTML. A few things to keep in mind for markdown:
    >* When creating a new paragraph, insert *two* newlines:
    >   ```markdown
    >   Paragraph 1
    >
    >   Paragraph 2
    >   ```
    >   To force a newline within a paragraph, end the line with `\`:
    >   ```markdown
    >   Line 1\
    >   Line 2
    >   ```
    >* Use `**` for **Bold** (e.g., `**Bolded Text**`), `*` for *Italics* (e.g., `*Italics Text*`), and `***` for ***Bold and Italics*** (e.g., `***Bold and Italics Text***`).
    >* For headers, prefix a line with `#`, `##`, `###`, etc. *Be sure to leave a blank line after the header to avoid formatting issues*:
    >   ```markdown
    >   # Header 1
    >   
    >   Some text.
    >   ```
    >* If you need HTML, you can add HTML within a markdown document without issues.
    >* [Excel to Markdown Table Converter](https://tableconvert.com/excel-to-markdown) is the easiest way to generate a Markdown table from existing data. If you just need to format a table, use [Markdown Table Formatter](http://markdowntable.com).

2. **Upload Image for Post**\
    If you want to add an image for your post, there are two steps:
    1. Add the file to the `assets` directory under the appropriate year.
    2. Add an `image:` tag to the Front Matter for the post. For example, `image: "BQ-Newsletter-Graphics_Page_13-scaled.jpg"`.

### Linking to Images or Pages
If you want to reference a page or image, use the syntax `{% link <path> %}` where `<path>` is the relative path from the root of the repository. For example, you can reference a file for downloading using `{% link assets/2023/2023-April.pdf %}`.

### Other Useful Links

* **bulma-clean-theme**\
Additional functionality and documentation is available for the [bulma-clean-theme](https://bulma.io/documentation/). In fact, the documentation web site is built using the theme. If you want to see how something was done, look at the [GitHub repo](https://github.com/chrisrhymes/bulma-clean-theme) behind it.

* **Font Awesome**\
[Free v5 Font Awesome icons](https://fontawesome.com/v5/search?o=r&m=free) are available for use in the site.

* **Running Site Locally**\
When making large changes or debugging an issue, it can be helpful to [run the site locally](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/testing-your-github-pages-site-locally-with-jekyll).
