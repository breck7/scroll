# ScrollSDK

A powerful SDK for building and extending Scroll with Particles and Parsers.

[![Tests Status](https://github.com/breck7/scrollsdk/actions/workflows/didTheTestsPass.yaml/badge.svg)](https://github.com/breck7/scrollsdk/actions/workflows/didTheTestsPass.yaml)

## 🔗 Quick Links

- [Scroll Homepage](https://scroll.pub)
- [The World Wide Scroll](https://wws.scroll.pub)
- [Particles Homepage](https://particles.scroll.pub)
- [Particles FAQ](https://faq.scroll.pub)
- [WWS Subreddit](https://www.reddit.com/r/WorldWideScroll)

## 🛠️ Tools

- [Parser Designer](designer/index.html) - Web IDE for writing Parsers
- [Particles Sandbox](sandbox/index.html) - Interactive environment for exploring Particles

## 📝 Documentation

- [SDK Release Notes](releaseNotes.html)
- [Particles FAQ](https://faq.scroll.pub)

## 🧪 Tests

- [ScrollSDK Node Tests](https://github.com/breck7/scrollsdk/actions/workflows/didTheTestsPass.yaml)
- [ScrollSDK Browser Unit Tests](sandbox/test.html)
- [ScrollSDK Browser Performance Tests](sandbox/perfTests.html)

## ❓ FAQ

### What is this repo?

This repository contains the code for Particle Syntax and the Parsers Programming Language. These are the core layers upon which Scroll is built.

### Who is this for?

This repo is for advanced Scroll developers.

### How do I write Parsers?

You can try the [Parsers tutorial](parsersTutorial.html).

## 📖 Writing Parsers

The ScrollSDK contains two implementations of Parsers: one in TypeScript and one in Parsers.

You write Parsers to extend Scroll. By creating Parsers with the SDK you get:
- A parser
- A type checker
- Syntax highlighting
- Autocomplete
- A compiler
- A virtual machine for executing your version of Scroll

The ScrollSDK also includes a simple web IDE for writing Parsers called [Parser Designer](designer/index.html).

At this point in time, to make your Parsers do very useful things, you also need to use another language that you know. The ScrollSDK lets you create new languages using just Scroll or Scroll + Javascript. Parsers can include code from any programming language, not just Javascript. Though at the moment only Scroll + Javascript is supported.

## 🚀 Using the ScrollSDK 

### Basic Particles library for npm projects:

```javascript
const {Particle} = require("scrollsdk/products/Particle.js")
const particle = new Particle("hello world")
console.log(particle.asString)
```

### Running the Particles Sandbox locally:

```bash
npm install .
npm run local
open http://localhost:3333/
```

### Running the Parser Designer locally:

```bash
npm install .
npm run local
open http://localhost:3333/designer
```

### Building all tools and running tests:

```bash
npm run build
npm test
```

## 📦 Monorepo Structure

The ScrollSDK is a monorepo. With on average over 1 major version released each month for the past 2.5 years, it would take a lot of overhead to constantly be updating 10+ different repositories and modules every month. Once we're more confident in the theory and best practices, it might make sense to break this repo into independent modules.

That being said, we despise unnecessary dependencies as much as anyone. If anyone wants to create some automated submodules built from the projects in this monorepo, to allow for consuming of a smaller subset of the code and dependencies in this module, feel free to do so.

## 📊 Codebase Visualization

[![Codebase Diagram](images/diagram.jpg)](https://mango-dune-07a8b7110.1.azurestaticapps.net/?repo=breck7%2Fscrollsdk)

## 🔄 Development Status

All breaking changes are mentioned in the [release notes](releaseNotes.html). We follow semantic versioning, so breaking changes should not happen if you stay on the same major version.

## 🌐 Particles Libraries in Other Languages

If you build a Particles library/SDK in another language, let us know and we'll add a link.

If you are working on a Particles library in a new host language, feel free to post an issue or ask for help in the [WWS subreddit](https://www.reddit.com/r/WorldWideScroll).

## 🔧 Development Notes

### How to bump versions:

```bash
npm run updateVersion NEW_NUMBER
```

### Historical Note

Particles was originally called Tree Notation. Parsers was originally called Grammar.

### Editing in Sublime Text

It is helpful to set `"goto_anything_exclude_gitignore": true` to ignore files in gitignore. Read more [here](https://breckyunits.com/code/my-sublime-setttings.html).

## ⚡ Alternatives Considered

This is the first Particles and Parsers libraries in existence, so there were no alternative implementations. Note and Space were predecessors to Particles. If a better alternative low level syntax to Particles is possible, it has yet to be discovered.

All that said, the important part of this repo is not the code but the design patterns. Particles is very simple, and you can implement the patterns contained here in your own code without using this library. In fact, that is often the best way to use Particles!

## Public Domain

ScrollSDK is published to the Public Domain.
