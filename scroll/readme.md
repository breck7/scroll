# 📜 Scroll: An old way to publish

Scroll is simple static publishing software whose purpose is
to demonstrate the pros and cons of Dumbdown for static
publishing.

## Installing

Scroll is part of the dumbdown-js package on npm

https://www.npmjs.com/package/dumbdown-js

```
npm install -g dumbdown-js
```

### CLI Usage

To see the CLI options type:

```
scroll help
```

## Design Notes

### Architecture

You use Scroll through the command line. A Scroll is a
single folder containing Dumbdown files. Scroll compiles
those Dumbdown files into a static index.html page.

Scroll also contains a simple Node.js Express app for live
preview.

### Folder Layout

A typical Scroll project folder looks like this:

```
yourScrollProject/
 someDraft.dd
 readme.dd
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

### File Formats

In Scroll individual posts are saved as dumbdown files with the
file extension `dd`.

Entire Scrolls are saved as [stamp](https://jtree.treenotation.org/designer/#standard%20stamp)
files with the extension `stamp`.

### Language

Scroll is currently written in plain Javascript.

TypeScript may be used in the future but Scroll may
never get over 1KLOC so that might not be necessary.

### Git

Scroll is designed with git in mind. Articles are stored as
files tracked by git.

### Writing Experience

When you are writing you want to stay constrained to the
article's purpose. Each article has it's own purpose and
it's own history. Hence, each article is stored as a
separate file in git.

### Reading Experience

Being able to scan the page like a newspaper is a
very fast reading experience. This is central to Scroll.

Additionally, making it easy to take the content with
you, and transform it to better suit the reader, is
also key to Scroll.

## Questions and Answers

**Will you support publishing single pages for better SEO?**

No.

**Will you provide support to people that don't publish in
the public domain?**

No.

**Will you support newest articles flowing right to left
instead of having potentially older articles up top?**

No.

## Alternatives Considered

There is no publishing software that reads and writes dumbdown yet
so building Scroll was necessary. Jekyll and Brecksblog are 2 biggest
inspirations.

- https://jekyllrb.com/
- https://github.com/breck7/brecksblog
