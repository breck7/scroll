# Dud: Dud Uses Dumbdown

Dud is simple publishing software whose purpose is to
demonstrate the pros and cons of Dumbdown for static
publishing.

## Installing

Dud is part of the dumbdown-js package on npm

https://www.npmjs.com/package/dumbdown-js

```
npm install -g dumbdown-js
```

### CLI Usage

To see the CLI options type:

```
dud help
```

## Design Notes

### Architecture

You use Dud through the command line. A Dud is a
folder with a specific project layout. Dud compiles that
Dud folder into a static HTML folder.

Dud also contains a simple Node.js Express app for live
preview.

### Folder Layout

A Dud project looks like this:

```
yourDomainName.tld/
 settings.map
 someDraft.dd
 readme.dd
 published/
  publishedArticle.dd
  anImageInTheArticle.png
  index.html
```

When you "build" a dud site, you are simply generating
the index.html file in the site's "published" folder.

This folder layouts let's you easily put any static
files you have directly into the "published/" folder.

Your sites static files, generated html, and published
article source dumbdown files, are all in the "published/"
folder and checked into version control.

The root level folder is where you can keep drafts
and any private files.

### File Formats

In Dud individual posts are saved as dumbdown files with the
file extension "dd".

Entire duds are saved as [stamp](https://jtree.treenotation.org/designer/#standard%20stamp)
files with the extension "stamp".

### Language

Dud is written in plain Javascript. Instead of using
TypeScript, JSDoc TypeScript will be attempted. Much
ergonomic pain is expected but we'll see.

https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html

TypeScript may be used in the future, but for now a
design goal of Dud is to keep things minimial and
close to the metal, and if it means slightly worse
type checking and docs.

### Git

Dud is designed with git in mind. Articles are stored as
files tracked by git.

### Writing Experience

When you are writing you want to stay constrained to the
article's purpose. Each article has it's own purpose and
it's own history. Hence, each article is stored as a
separate file in git.

### Reading Experience

Being able to scan the page like a newspaper is a
very fast reading experience. This is central to dud.

Additionally, making it easy to take the content with
you, and transform it to better suit the reader, is
also key to dud.

## Alternatives Considered

There is no publishing software that reads and writes dumbdown yet
so building Dud was necessary. Jekyll and Brecksblog are 2 biggest
inspirations.

- https://jekyllrb.com/
