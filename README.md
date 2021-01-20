# Dumbdown - The dumb alternative to markdown

(Note: this Readme.md file is written in markdown,
but if someone wants to work on Dumbdown syntax
highlighting for GitHub, once we have a spec,
that would be great!
Issue is here: https://github.com/treenotation/dumbdown/issues/1)

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
 - Dumbdown supports lists
 - Dumbdown is a demonstration Tree Language from the Tree Notation Lab
 - This is a very early version
 - Dumbdown is released to the public domain
 - If you want to make it better, please do!
```

## Try it Now

The original prototype:
https://jtree.treenotation.org/designer/#standard%20dumbdown

An actual v1 spec is now in the discussion phase.

## Why Dumbdown?

Do you want a markup language that doesn't
require memorizing esoteric symbols but uses words
instead?

Do you want a markup langauge where you not only
don't have to remember which order brackets go in—
is it ()[] or []()—but that doesn't use brackets
at all?!

Do you want a markup language that is extensible,
so you can store your own custom config data right
alongside your content?

Do you want a markup language where it is super
easy to embed any kind of data or code without
doing adding escape characters?

Do you want a markup language that you could
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

## Release Notes

Version 0.2 01/20/2021
 Let's make this a real thing. Readme and GitHub project started.
Version 0.1 09/01/2019
 Prototype and idea first launched.

## Important

It should go without saying, but this is public domain.

Dumbdown is dedicated to my friend, and one of my best
mentors and heroes Aaron Swartz.

http://www.aaronsw.com/weblog/001189
