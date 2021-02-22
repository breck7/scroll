# 📜 Scroll: A new way to publish

Scroll is simple static publishing software. Example site:

<a href="https://breckyunits.com/"><img src="screenshot.png"
/></a>

# What makes Scroll different?

1. Instead of a page per post, like a blog, a Scroll is a
   **single page**, like an old newspaper.
2. Instead of Markdown, Scrolls use <a
   href="https://github.com/treenotation/dumbdown">**Dumbdown**</a>,
   which makes it easy to combine languages to generate more
   creative content.
3. Instead of supporting licenses, Scroll is 100% focused on
   **public domain sites** and everything is
   designed with that assumption.

## How do I get Scroll?

Scroll is part of the <a href="https://www.npmjs.com/package/dumbdown-js"> dumbdown-js package on npm</a>.

You can get it by typing:

```
npm install -g dumbdown-js
```

## How do I use Scroll?

Scroll is used through the CLI. To see the options type:

```
scroll help
```

## Where do I get help?

Post an issue in this GitHub, join the <a href="https://www.reddit.com/r/treenotation/">Tree Notation subreddit</a> or email breck7@gmail.com.

### What are some example sites using Scroll?

On beta launch day we have:

- https://breckyunits.com/

Note: looking for beta users to share their sites!

### How does Scroll work?

<em>A Scroll</em> is a single folder containing Dumbdown files.
Scroll compiles those Dumbdown files into a static
index.html page.

Scroll is the name of the command line app that includes a
simple Node.js Express app for live preview.

### What does a typical project folder look like?

A typical Scroll project folder looks like this:

```
yourScrollProject/
 someDraft.dd
 readme.md
 yourDomainName.org/
  about.dd
  publishedArticle.dd
  anImageInTheArticle.png
  index.html
  scrollSettings.map
```

The `scrollSettings.map` file let's Scroll know that
a folder contains a Scroll.

When you "build" a Scroll site, you are simply generating
the `index.html` file in the site's folder.

The suggested project layout above let's you easily
separate drafts from published content and put all
under version control.

With Scroll your site's public static files, generated html,
and published article source dumbdown files, are all in the
public folder and checked into version control.

### How do I save drafts?

Save them outside your public folder like in the sample project
folder above.

### What File Formats does Scroll use?

Scroll articles are written as Dumbdown files with the file
extension `dd`.

Entire Scrolls are saved as <a href="https://github.com/treenotation/jtree/blob/master/langs/stamp/readme.md">
stamp</a> files with the extension `stamp`.

### What language is Scroll written in?

The Scroll app is written in plain Javascript and
runs in Node.js.

TypeScript may be used in the future but Scroll may
never get over 1kloc so that might not be necessary.

### How does versioning of articles work?

Scroll is designed for git. A single article is stored as
a single file tracked by git.

### Why is Scroll a single page?

Being able to scan the page like a newspaper is a
very fast reading experience. This is central to Scroll.

Additionally, making it easy to take the content with
you, and transform it to better suit the reader, is
also key to Scroll.

Because Scroll is designed for public domain sites,
we can optimize for the single page reading experience
but people can have the full Scroll contents and render
it however best suits them.

### Will you support publishing single pages for better SEO?

No.

### Will you make design decisions for non-public domain sites?

No.

### Will you support newest articles flowing right to left instead of having potentially older articles up top?

No.

### What were some alternatives considered?

There was no publishing software that reads and writes Dumbdown yet
so building Scroll was necessary. Jekyll and Brecksblog are 2 biggest
inspirations.

- https://jekyllrb.com/
- https://github.com/breck7/brecksblog

### What has changed in recent versions?

Version 4.1.0 released on 02-22-2021
 added a "git" scrollSetting for article source links.
