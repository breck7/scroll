# Dumbdown - The dumb alternative to markdown

## First, an example

```dumbdown
title This is Dumbdown. The keyword for title is title.
subtitle Dumbdown compiles to html.
paragraph Dumbdown is an alternative to Markdown.

paragraph Blank lines get turned into <br>

link https://treenotation.org/ It is built on Tree Notation

code
 alert(`The keyword for code blocks is "code"`)

list
 item Dumbdown supports lists
 item For now the keyword for an item is "item"
 item This is a very early version
 item Dumbdown is released to the public domain
 item If you want to make it better, please do!
```

## Try it Now

The original prototype:
https://jtree.treenotation.org/designer/#standard%20dumbdown

An actual v1 spec is now in the discussion phase.

### 📜 Scroll: Demonstration app

In addition to containing the Dumbdown spec,
this repo contains a demo application which is
a simple static publishing software called "Scroll".

Scroll has its own readme:

https://github.com/treenotation/dumbdown/blob/master/scroll/readme.md

## Why Dumbdown?

- Do you want a markup language that doesn't
  require memorizing esoteric symbols but uses words
  instead?

- Do you want a markup langauge where you not only
  don't have to remember which order brackets go in—
  is it ()[] or []()—but that doesn't use brackets
  at all?!

- Do you want a markup language that is extensible,
  so you can store your own custom config data right
  alongside your content?

- Do you want a markup language where it is super
  easy to embed any kind of data or code without
  doing adding escape characters?

- Do you want a markup language that you could
  write your own parser for without having to
  learn complex parsing techniques?

If you answered YES to the questions above, then
Dumbdown is for you?!

## Features

1. Keywords instead of key characters. ie "title" instead of "#".
2. No brackets. Links are just "link", or type the full url for inline links.
3. Stick your own custom config data in. Every file parses to a map. i.e. "published true".
4. No need to escape characters for snippets. Just indent blocks.
5. Very easy to write your own parsers for. It's just Tree Notation.

## Project Status

**Currently: Discussing spec for v1.**

**Goal by January, 2022: Ship a final v1 spec**

Note: this Readme.md file is written in markdown,
but if someone wants to work on Dumbdown syntax
highlighting for GitHub, once we have a spec,
that would be great!

Issue is here: https://github.com/treenotation/dumbdown/issues/1

## FAQ

**How do I do inline formatting like bold, italics,
and links?**

Tree Languages are very different than
traditional languages.

They combine exceptionally well.

You can literally just copy and paste
2 grammars together, and then change
just 1 or 2 lines of code and get a
new "3rd" language that incorporates
both.

This enables many approaches to supporting
any style of node that would support
inline formats.

For example, I could create a node type
called `markdownParagraph` and then a
user could use normal markdown inside
a Dumbdown document:

    markdownParagraph
     Put **bold** or _italic_ text
     here, or [links](/link).

But that's just the beginning! Imagine
extending Dumbdown with brand new ideas,
never before tried:

    emojiParagraph
     In this hypothetical emoji
     paragraph you can wrap a
     sentence in <b></b> simply
     by ending it with❗

**Why not use a shorter syntax?**

Although you can use Dumbdown with any text
editor, since it is so simple, Dumbdown is not
designed with today's editors in mind.

It's designed for a new upcoming wave of
so called "2-Dimensional" editors. Think
of Spreedsheets, with grids, instead of IDEs.

Dumbdown is designed to be best used in
editors that support advanced autocomplete,
type checking, syntax highlighting,
additional secondary notations, and real
time projections.

**Can I compile my dumbdown docs into markdown instead of HTML?**

Yes. The first prototype compiled to markdown.
That was just dropped for simplicity in the second
prototype which just compiles to HTML. But
actual real implementations will likely compile
to both.

## Release Notes

- Version 0.2 01/20/2021
  -- Let's make this a real thing. Readme and GitHub project started.
- Version 0.1 09/01/2019
  -- Prototype and idea first launched.

## Leadership

breck7 is currently the BDFL: Benevolent Dummy
For Life. But if you feel like you can be a better
Dummy, please either fork this project and prove
it, or just get involved and stage a peaceful
coup. Breck would happily relinguish the BDFL
title if a better Dummy comes along.

## Important

    There is a domain
    the public domain
    the only domain there should be.
    Where ideas can mingle
    improve and change
    So that the people can be free.

Dumbdown is made with love in memory and honor
of Aaron Swartz.

http://www.aaronsw.com/weblog/001189
