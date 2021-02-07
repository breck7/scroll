# Dud: Dud Uses Dumbdown

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

You use Dud through the command line. A Dud blog is a
folder with a specific project layout. Dud compiles that
Dud folder into a static HTML folder.

Dud also contains a simple Node.js Express app for live
preview.

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

TypeScript may be used in the future, but for now a
design goal of Dud is to keep things minimial and
close to the metal, and if it means slightly worse
type checking and docs.

### Roadmap

In the future there may also be a single page web app
called DudEditor that is plain HTML and CSS. You can use
this HTML file standalone and just read and write to your
browsers local storage.

## Alternatives Considered

There is no blog software that reads and writes dumbdown yet
so building Dud was necessary.
