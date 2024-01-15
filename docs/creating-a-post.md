_Note: These instructions presume you have installed [VS Code](https://code.visualstudio.com/download) and [GitHub Desktop](https://desktop.github.com/)._

This guide will walk you through how to create a new post. You will create a new branch, create the post, push the branch to GitHub, and then create a Pull Request to ask the admins to make it public/live on the site.

## Creating a branch

1. Using GitHub Desktop, pull any changes from the main branch by clicking **Fetch origin**
2. Click **Current Branch**, then **New Branch**
3. Type in the name of the new branch, then click "Create Branch"
4. You are now working in your newly created branch.

## Creating the post

### Create the file

5. Click on **Open in Visual Studio Code**
6. In the Explorer on the left-hand size of the window, go to the current year's posts. If 2023, go to `_posts\2023`
7. To create a new post
    1. Right-click on a previous post and click Copy
    2. Paste the file (Ctrl + s on Windows, Cmd + s on macOS)
8. Name the file with the date and post title, like this:
    - `yyyy-mm-dd-post-title-goes-here.md`
    - `2023-12-28-verses-to-memorize.md`

### Update the Front Matter

The top of each blog post has what's called Front Matter and gives instructions on how to render the page.

```
---
layout: post
title: "Foundational Bible Verses to Memorize"
author: BibleQuiz.com Admin
date: "yyyy-mm-dd"
image: "image.jpg"
categories:
- "newsletter"
published: true
---
```

| item       | description                                                                                               |
| ---------- | --------------------------------------------------------------------------------------------------------- |
| layout     | leave this as `post`                                                                                      |
| title      | Self-explanatory, this is the title of the post                                                           |
| author     | Your name, or use `BibleQuiz.com Admin`                                                                   |
| date       | Uses a European date format, e.g. 2023-12-02                                                              |
| image      | The main image of your post. Put the image in `\assets\2023` or whatever year your post will be published |
| categories | helps organize posts...find [a list of existing categories on the blog](https://biblequiz.com/blog/)      |
| published  | `true` to show on the site, `false` to hide it                                                            |

### Updating the body with Markdown

Write the body of your post using Markdown. [Use this guide to learn the basics of Markdown](https://www.markdownguide.org/basic-syntax/).

An easy way to learn Markdown is to write your post [on a site like this](https://www.digitalocean.com/community/markdown), which will let you see a live preview as you type.

### Link to a page or file on the site

If you want to link to a page on BibleQuiz, you have two options.

**Option 1**

If the page or file already exists on the site, go to that resource and copy the URL. Then, you can use plain 'ol HTML like this.

`<a href="https://biblequiz.com/jbq/">JBQ Home</a>`

This will create text that says JBQ Home, and when someone clicks on it, it will take them to https://biblequiz.com/jbq/.

**Option 2**

Alternatively, you can use the syntax `{% link <path> %}`, where `<path>` is the relative path from the root of the repository.

For example, you can reference a file for downloading using something like this: `[Download now]({% link assets/2023/2024/3il.pdf %})`. This will create text that says "Download now", and when the user clicks on it, it will take them to the file to download.

### Adding Images

There are a few steps to add images to your post.

1. Add the file to the `assets` directory under the appropriate year.
    1. e.g. `/assets/2023`
2. If you're adding an image to the Front Matter (see above), format it like this: `image: "bible.jpg"`
3. If you're adding an image to your post, we have to tell GitHub where to find it. Use the syntax `{% link <path> %}` where `<path>` is the relative path from the root of the repository.
    1. e.g. `{% link assets/2023/bible.jpg %}`.

A few tips:

-   Double return between paragraphs (aka, put a clean line between paragraphs)
-   When you've made a change to a file, you will see a solid white dot to the right of the file name in VS Code. Hit `Cmd\Ctrl + s` or `File > Save` to save the file. Once it's saved, the dot will change to an **X**.
-   E-mail links won't render automatically (e.g., email@domain.com). If you want an e-mail address to be clickable, use this format `[email@domain.com](mailto:email@domain.com)`.
-   If you need HTML, you can add HTML within a markdown document without issues.
-   If you need to create a table of data, [Excel to Markdown Table Converter](https://tableconvert.com/excel-to-markdown) is the easiest way to generate a Markdown table. If you just need to format a table, use [Markdown Table Formatter](http://markdowntable.com).

## Commit your changes

Once your post is ready, go to Github Desktop. You will see all the files you've changed on the left sidebar.

At the bottom left, you'll see a Summary field where you need to write a note about what you've changed. (e.g. "New blog post titled "Tips for Memorizing Scripture")

Click on the blue **Commit** button.

Click on "Publish branch" along the top menu bar.

### Create a Pull Request

1. Click **Preview Pull Request**.
    - GitHub Desktop will open a preview dialog showing the diff of the changes between your current branch and the base branch.
2. Click **Create Pull Request**. GitHub Desktop will open your default browser to take you to GitHub.
3. Type a title and description for your pull request.
4. To create a pull request that is ready for review, click Create Pull Request.

## Questions?

Email [hello@biblequiz.com](mailto:hello@biblequiz.com) with any questions.
