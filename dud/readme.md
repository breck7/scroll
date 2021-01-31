# Dud: Don't Use Dumbdown

Dud is simple blogging software whose purpose is to
demonstrate the pros and cons of Dumbdown for static
blogging.

## Installing

Dud is part of the dumbdown-js package on npm

https://www.npmjs.com/package/dumbdown-js

```
npm install -g dumbdown-js
```

### CLI Usage

```
dud
```

## Design Notes

### Architecture

Dud consists of a single page web app called DudEditor that
is plain HTML and CSS. You can use this HTML file standalone
and just read and write to your browsers local storage.

Dud also contains a single page Node.js Express app if
you'd like to read and write a site to disk.

Dud imports and exports entire blogs as Stamp files.

Dud publishes an entire blog as simply a folder with HTML
files.

### File Formats

In Dud individual posts are saved as dumbdown files with the
file extension "dd".

Entire blogs are saved as [stamp](https://jtree.treenotation.org/designer/#standard%20stamp) files with the extension
"stamp".

### Language

Dud is written in plain Javascript. Instead of using
TypeScript, JSDoc TypeScript will be attempted. Much
ergonomic pain is expected but we'll see.

https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html


## Alternatives Considered

There is no blog software that reads and writes dumbdown yet
so building Dud was necessary.
