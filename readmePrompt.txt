Below is the contents of this project/repo.

Generate a beautiful readme.md file from this.

```readme.scroll
permalink index.html
title Scroll is a language for scientists of all ages

header.scroll

# Scroll is a language for scientists of all ages
 style font-weight: 300; font-size: 200%;
 class printTitleParser

## Publish and evolve your most intelligent ideas
 style font-weight: 300;

css :root { --scrollBaseFontSize: 18px !important; }

br
mediumColumns 1

animation.scroll

ScrollHub &nbsp;&nbsp; Try now
 center
 http://hub.scroll.pub/ ScrollHub
 class scrollButton ScrollHub
 https://try.scroll.pub/ Try now
 class scrollButton Try now

LeetSheet · Blog · Release Notes · FAQ · Tutorial
 center
 leetsheet.html LeetSheet
 blog/index.html Blog
 faq.html FAQ
 releaseNotes.html Release Notes
 tutorial.html Tutorial
 style margin:15px; margin-top: 40px;

Videos · GitHub · Subreddit
 center
 https://www.youtube.com/playlist?list=PLnN2hBdpELHqcBeZIJyxT-WKyJ34lqqt- Videos
 https://github.com/breck7/scroll GitHub
 https://www.reddit.com/r/WorldWideScroll/ Subreddit
 style margin:15px;

npm package · Tests · Parser Designer
 center
 https://www.npmjs.com/package/scroll-cli npm package
 tests/index.html Tests
 https://sdk.scroll.pub/designer#url%20https%3A%2F%2Fscroll.pub%2Fscroll.parsers Parser Designer
 style margin:15px;

scroll prompt · parser prompt
 center
 link scrollPrompt.txt scroll prompt
 link parserPrompt.txt parser prompt
 style margin:15px;

endColumns

footer.scroll

```
```releaseNotes.scroll
buildConcepts releaseNotes.csv releaseNotes.json releaseNotes.tsv
buildMeasures releaseNotesMeasures.tsv
title Scroll Release Notes
linkTitle Release Notes

microlangs/changes.parsers

header.scroll
printTitle
nav.scroll
## A list of what has changed in Scroll releases.

thinColumn
Download as CSV | TSV | JSON
 link releaseNotes.csv CSV
 link releaseNotes.tsv TSV
 link releaseNotes.json JSON
br
center
ciBadges.scroll

br
thinColumns

📦 165.2.0 1/08/2025
🎉 added `keywords` parser because AI keeps trying to use it.
🏥 slideshow fixes

📦 165.1.1 1/06/2025
🏥 fix regression in pdf building

📦 165.1.0 1/06/2025
🎉 support larger data science sessions by using memory if not enough local storage

📦 165.0.0 1/05/2025
🎉 quick css and js tags now compile to blank html snippets
⚠️ BREAKING: (no one should be affected) CSS and Javascript tags will no longer be included by default when compiling snippets

📦 164.12.0 1/02/2025
🎉 added support for URLS with query strings as table data source

📦 164.11.0 12/29/2024
🎉 added slashComment support to table flows
🎉 added assertRowCount parser for fast testing of table transformers
🏥 fix regression where empty and nonEmpty filters were not working
🏥 fix "first" reduction to select the first non-blank value
🏥 fix syntax highlighting in table flows

📦 164.10.0 12/29/2024
🎉 added scrollModalParser
🎉 added click afterText parser
🎉 renamed `linkParser` to `scrollLinkParser` to clean up linkParser for userspace

📦 164.9.0 12/24/2024
🎉 added `belowAsHtml` and `aboveAsHtml` from btheado
 https://github.com/btheado btheado

📦 164.8.0 12/19/2024
🎉 added title, subtitle and caption parsers to plots
🎉 added linechart parser
🎉 added parseDate parser
🎉 added sampleData parser

📦 164.7.0 12/19/2024
🎉 added width and height parsers to plots

📦 164.6.0 12/19/2024
🎉 added barchart parser
🎉 added sort parser to barchart and scatterplot for sorting x axis
🎉 updated Observable plot

📦 164.5.0 12/19/2024
🏥 perf fix: reuse same disk cache when doing `scroll list | scroll build`

📦 164.4.0 12/17/2024
🎉 assertions now can also be one liners
🎉 `inlineJs` and `inlineCss` can now take filenames as subparticles
🏥 bug fixes in buildCss methods

📦 164.3.0 12/16/2024
🎉 update ScrollSDK

📦 164.2.0 12/16/2024
🎉 add `reduceParser` to `groupBy`. Functionality was there but Parser was not.
🎉 atom color fixes

📦 164.1.0 12/16/2024
🎉 atom color fixes

📦 164.0.0 12/15/2024
🎉 much easier to create themes
🎉 all 5 themes should largely work now.
⚠️ BREAKING: if you manually included a theme's CSS file, you now need to include ".scroll.css" after it.

📦 163.2.1 12/15/2024
🏥 fix regression in printColumn

📦 163.2.0 12/15/2024
🎉 added `summarize` parser

📦 163.1.0 12/15/2024
🎉 column names in table particles now try to match users intent (case insensitive and close match).
🎉 new `assertIgnoreBelowErrorsParser` for automated testing purposes

📦 163.0.0 12/13/2024
### Organized the debug parsers into a common namespace.
🎉 new `debugParsers` parser
🎉 new `debugAll` parser
🎉 `debugBelow` and `debugAbove` now have better txt output
⚠️ BREAKING: `inspectBelow` is now `debugBelow`.
⚠️ BREAKING: `inspectAbove` is now `debugAbove`.
⚠️ BREAKING: `printSourceStack` is now `debugSourceStack`.

📦 162.1.0 12/07/2024
🎉 upgrade ScrollSDK

📦 162.0.1 12/06/2024
🏥 npm fix

📦 162.0.0 12/06/2024
🎉 much cleaner strategy for CSS and JS files shipped with Scroll
⚠️ BREAKING: all external Javascript and CSS files now begin with `.`.

Before this change, people's folders were getting filled with theme and JS files that had to be .gitignored. Now, all of those files will start with a ".".

So we use the hidden file convention for separating files you want to track from external libs you are using.

📦 161.3.0 12/04/2024
🎉 handle macro failures gracefully

📦 161.2.0 12/04/2024
🎉 update SDK for better Fusion

📦 161.1.0 12/04/2024
🎉 added `outputFileNames` internal API

📦 161.0.4 12/02/2024
🏥 scroll cli format command regression fix

📦 161.0.3 12/02/2024
🏥 scroll format regression fix

📦 161.0.2 12/02/2024
🏥 scroll format regression fix

📦 161.0.1 12/02/2024
🏥 scroll form fixes

📦 161.0.0 12/01/2024
🎉 added new theme `prestige`
🎉 upgrade ScrollSDK
🎉 scroll theme cleanup:
⚠️ BREAKING: .dinkus is now .abstractDinkusParser
⚠️ BREAKING: .scrollTitle is now .printTitleParser
⚠️ BREAKING: .scrollByLine is now .printAuthorsParser
⚠️ BREAKING: .scrollDateline is now .printDateParser
⚠️ BREAKING: dateParser is now scrollDateParser

📦 160.0.0 11/30/2024
🎉 upgrade ScrollSDK

📦 159.1.0 11/30/2024
🎉 make Scroll version work in browser version

📦 159.0.0 11/30/2024
⚠️ BREAKING: (almost no one should be affected). `paragraphParser` is now `scrollParagraphParser` to avoid namespace collisions.

📦 158.0.4 11/29/2024
🏥 fix right button regression

📦 158.0.3 11/29/2024
🏥 try/catch of buildHtml for better robustness
🏥 fix left/right buttons regression

📦 158.0.2 11/29/2024
🏥 fix stumpParser namespace bug

📦 158.0.1 11/29/2024
🏥 more graceful error handling

📦 158.0.0 11/29/2024
🎉 import Scroll files now by URLS
⚠️ BREAKING: (no one should be affected). Lines that are just a URL to a Scroll file now will attempt an import.

📦 157.0.0 11/29/2024
⚠️ BREAKING: (userspace unaffected. dev API changes only) switched to async Fusion file system.
⚠️ BREAKING: (userspace unaffected. dev API changes only) `build` method is now split into `load` and `execute` methods.

📦 156.0.0 11/28/2024
⚠️ BREAKING: (no one should be affected) updated scrollsdk to get Fusion

📦 155.4.2 11/26/2024
🏥 fix regression in limit on getFilesByTag

📦 155.4.1 11/25/2024
🏥 namespace cleanup

📦 155.4.0 11/23/2024
🎉 loadConcepts now supports other concept cues than "id"

📦 155.3.0 11/22/2024
🎉 added `notices` parser

📦 155.2.0 11/22/2024
🎉 added `name` parser to support naming the field in one textarea

📦 155.1.0 11/21/2024
🎉 added splitYear parser
🎉 added splitMonth parser
🎉 added splitDayOfMonth parser
🎉 added splitDay parser
🎉 added splitMonthName parser
🎉 added splitDayName parser

📦 155.0.3 11/20/2024
🏥 temp inheritance parser bug patch.

📦 155.0.2 11/20/2024
🏥 fixed regression from version 154.

📦 155.0.1 11/20/2024
🏥 fixed bug in buildParsers

📦 155.0.0 11/19/2024
🎉 cleaner Parsers autocomplete
⚠️ BREAKING: (no one should be affected) updated scrollsdk

📦 154.3.0 11/18/2024
🎉 container parser now extends aftertext

📦 154.2.0 11/16/2024
🎉 Added `footer` parser to import statements. Now you can import a footer at top of file.
🎉 Added scrollClearStackParser
🎉 Upgraded ScrollSDK

📦 154.1.0 11/15/2024
🎉 JSON table parser now handles more common kinds of json data
 - Thanks TBD!
  https://x.com/tbdr/status/1857446832923652190

📦 154.0.0 11/15/2024
🎉 `compile` is now renamed to specific output methods such as `buildHtml`.
⚠️ BREAKING: if you've written custom parsers please rename your `compile` methods to `buildHtml`, `buildTxt`, et cetera

📦 153.1.0 11/14/2024
🎉 added `font` parser for quickly setting font family
🎉 added `color` parser for quickly setting font family
🎉 lorem ipsum parsers now extend aftertext properly

📦 153.0.0 11/14/2024
🎉 refactored build system so try.scroll.pub can access all build outputs, not just HTML
⚠️ BREAKING: (no one should be affected) low level internal build APIs have changed

📦 152.0.0 11/13/2024
🎉 upgraded ScrollSDK
🏥 fixed problems from namespace collisions

📦 151.0.0 11/13/2024

## 🚨 MAJOR RELEASE
- try.scroll.pub now supports writing parsers!

🎉 moved code from desktop to parsers
🏥 fixed regression where parsers were printing

📦 150.0.0 11/13/2024
🎉 added `concepts` parser for loading concepts in a file into a table
⚠️ BREAKING: (no one should be affected) nearly all Scroll code is now available to Scroll in the browser. Some internal APIs may have changed if using Scroll programmatically.

This is prep work for the major release coming imminently which brings the full power of PPS to the browser, including ability to write Parsers, fully user Scrollsets, and more, dynamically, clientside in browser.

📦 149.0.0 11/13/2024
🎉 `parsers.parsers` now ships with Scroll! Syntax highlighting, autocomplete, and other tools for writing parsers in try.scroll.pub.
 - Note: compiling these Parsers still requires desktop Scroll. Not everything runs in browser...yet
⚠️ BREAKING: (no one should be affected) any custom parsers in your Scroll files will now be fully parsed. So previously undetected errors will now be caught. There may also be some namespace conflicts as we cleanup the Parser code.

📦 148.3.1 11/12/2024
🏥 fix author bug in postsMeta

📦 148.3.0 11/12/2024
🎉 moved format code to root parser for use in browser

📦 148.2.0 11/12/2024
🎉 created `bindTo` parsers property which tells particles to stick with next/previous when formatting
🎉 created `allowTrailingWhitespace` parser property to allow particles to allow trailing whitespace when formatting

📦 148.1.0 11/12/2024
🎉 added `codeFromFile` parser
🎉 buildTxt + code parsers now output code surrounded by backticks

📦 148.0.0 11/11/2024

## 🚨 MAJOR RELEASE
- Vastly improved data science capabilities!
- Major cleanup of Scroll to remove loops concept. Tables is all we need.
- Major cleanup toward running Scroll fully in browser

🎉 added `buildTsv` parser
🎉 added `buildJson` parser
🎉 added `posts` parser for iterating over posts as a table
🎉 added `postsMeta` parser for iterating over post metadata as a table
🎉 added `assertBuildIncludes`
🎉 `printTable` combined with `buildTsv/Csv/Json` will now save the table to disk.
⚠️ BREAKING: removed `loop`. `tables` can do everything loops could, much better.
⚠️ BREAKING: removed `printCsv` parser
⚠️ BREAKING: removed `printSearchTable` parser. Can now be done with:

code
 posts All
  printTable
 tableSearch

📦 147.1.0 11/11/2024
🎉 added `shuffle` parser
🎉 added `iris` parser for easier quick testing/demoing of scroll tables

📦 147.0.0 11/09/2024
🎉 added `quickRunScriptParser` to run python, php, ruby, perl, and sh scripts and include output in compiled output
 - Thanks to TBD for the idea
  https://x.com/tbdr TBD
  https://x.com/tbdr/status/1855391565373641140 idea
🏥 match less in quick tables
⚠️ BREAKING: (no one should be affected) if you have a line that is just a filename like *.(py|rb|sh|php|pl), it will now attempt to run that script

📦 146.4.0 11/09/2024
🎉 when using maps, geolocate now adds an icon to current location

📦 146.3.0 11/08/2024
🎉 inlineJs now concats without script tag when paired with buildJs

📦 146.2.0 11/07/2024
🎉 more comment support across parsers

📦 146.1.0 11/05/2024
🎉 added `background` parser

📦 146.0.0 11/02/2024
🎉 upgrade ScrollSDK to get "imported" functionality.
🎉 added importedParser
🎉 added support for optional imports using a temporary parser. Long term implementation coming soon.
⚠️ BREAKING: (no one should be affected) import particles are now replaced by "imported" particles

📦 145.12.0 11/02/2024
🎉 assertion parsers can now be chained and will test the output of previous non-assertion parser
🎉 added dependenciesParser

📦 145.11.1 11/01/2024
🎉 remove carriage returns ('\r') when running scroll format

📦 145.11.0 10/31/2024
🎉 add `join` parser to printColumn

📦 145.10.0 10/30/2024
🎉 much improved inspector parsers

📦 145.9.0 10/30/2024
🎉 added `buildParsersParser`
🎉 added `scrollDefParser`
🎉 added `inspectBelowParser`
🎉 added `inspectAboveParser`
🏥 atom highlight fixes for css and html
🏥 allow scrollForms gracefully handle zero params

This version starts introduces "Defs", a new short hand way to create forms/parsers/scrollsets.

Expect Def parsers to evolve quickly.

📦 145.8.0 10/27/2024
🎉 added `scrollNavParser`
🎉 added `scrollLinkTitleParser`

📦 145.7.0 10/27/2024
🎉 improved how long ago magic column to handle timestamps better and also show original date on hover

📦 145.6.0 10/27/2024
🎉 added magic `last[Verbed]` columns to tables which now renders a "how long ago" value

📦 145.5.1 10/26/2024
🏥 table fix for missing values

📦 145.5.0 10/25/2024
🎉 new internal build API to support single file building

📦 145.4.0 10/25/2024
🎉 added startsWith and endsWith atoms to where parser

📦 145.3.0 10/24/2024
🎉 added nav styling

📦 145.2.0 10/24/2024
🎉 add HAML parser for plain tags

📦 145.1.2 10/23/2024
🏥 clone fixes

📦 145.1.1 10/23/2024
🏥 clone fix

📦 145.1.0 10/23/2024
🎉 clone command api updates

📦 145.0.0 10/23/2024
🎉 added onclickParser
🎉 added scrollEvalParser
🎉 started refactoring CSS code to make theming easier
⚠️ BREAKING: if using `--base-font-size` rename to `--scrollBaseFontSize`

📦 144.0.0 10/22/2024
🎉 big refactor to make more of Scroll work entirely in browser
⚠️ BREAKING: (no user breaking changes). Changes for ScrollFile API users: some methods have moved to scrollProgram.

📦 143.0.0 10/19/2024
⚠️ BREAKING: "viewSource" is now "edit" globally

📦 142.3.0 10/19/2024
🎉 command line output cleanup

📦 142.2.0 10/18/2024
🎉 added `inlineCss` and `inlineJs` parsers

📦 142.1.0 10/18/2024
🎉 added new `post` parser to buttons

📦 142.0.2 10/16/2024
🏥 clone fix

📦 142.0.1 10/14/2024
🏥 clone fixes

📦 142.0.0 10/14/2024
🎉 added new `clone` cli command

📦 141.3.1 10/14/2024
🏥 whoops! major format regression

📦 141.3.0 10/14/2024
🎉 format command should not insert newlines into blank files

📦 141.2.0 10/14/2024
🎉 `toStamp` supports a single file
🎉 moved prompt to parsersPrompt
🎉 added scrollPrompt

📦 141.1.0 10/14/2024
🎉 added `toStamp` parser
🎉 created `prompt.scroll`

📦 141.0.0 10/12/2024
🎉 updated ScrollSDK
🏥 bug fix in maps nested under tables. Thanks TD for the report!
⚠️ BREAKING: `firstAtom` is now `cue` everywhere

📦 140.0.0 10/12/2024
🎉 updated ScrollSDK
⚠️ BREAKING: `crux`, a "temporary" word that lasted years 😀, is now `cue`

📦 139.1.0 10/11/2024
🎉 added qrcode parser

📦 139.0.1 10/11/2024
🏥 bug fix in quick tables. Thanks TD for the report!

📦 139.0.0 10/11/2024
🎉 the quickTable parser now works with JSON files as well.
 // Thank you to TD for the report!
⚠️ BREAKING: to use the JSON Script parser, instead of *.json you now need to use the cue "jsonScript"

Regex find:
code
 ^[^\s]+\.json

📦 138.4.0 10/09/2024
🎉 added `placeholder` and `value` parsers to ScrollForms

📦 138.3.0 10/09/2024
🎉 add `geolocate` parser for better map UX.

📦 138.2.0 10/08/2024
🎉 add `theScrollButton` parser

📦 138.1.1 10/08/2024
🎉 scroll forms fixes

📦 138.1.0 10/08/2024
🎉 scroll forms can now post

📦 138.0.0 10/08/2024
🎉 compiled HTML of all aftertext nodes now deep linkable. Thanks to Hari for the request!
 https://www.reddit.com/r/WorldWideScroll/comments/1fz7qpm/questions_from_hari/ request
⚠️ BREAKING: upgraded ScrollSDK so getIndex is now index on Particles

📦 137.4.0 10/08/2024
🎉 maps now can request users location

📦 137.3.0 10/07/2024
🎉 export SimpleCLI

📦 137.2.0 10/06/2024
🎉 added `tiles` parser to maps

📦 137.1.0 10/05/2024
🎉 added `rank` parser to tables

📦 137.0.0 10/04/2024
🎉 maps now takes a table
🎉 maps now supports fullscreen
🎉 maps now supports custom hover template strings
🎉 maps now supports color
🎉 maps now supports fillColor
🎉 maps now supports radius
🎉 maps now supports fillOpacity
🎉 added `compute` table parser
⚠️ BREAKING: remove "points" parser. maps now takes a table as input.

📦 136.12.0 10/04/2024
🎉 `table` now accepts urls
🎉 build now works in web version

📦 136.11.1 10/02/2024
🎉 description escape fix

📦 136.11.0 10/02/2024
🎉 added `printShortSnippetsParser`

📦 136.10.0 10/02/2024
🎉 added `footer` Parser

📦 136.9.0 9/30/2024
🎉 added `stopwatch` Parser

📦 136.8.0 9/30/2024
🎉 viewSourceButton can now take a url

📦 136.7.0 9/30/2024
🎉 dark theme improvements

📦 136.6.0 9/27/2024
🎉 added `printColumn` parser

📦 136.5.0 9/27/2024
🎉 added `disk` parser which generates a table from local disk contents

📦 136.4.1 9/27/2024
🏥 type fix in table links

📦 136.4.0 9/27/2024
🎉 new aftertext relative link parser. relative links with 33% fewer words.
🎉 use quick links in image tags.
🏥 bug fix where tableSearch was getting applied to non scroll tables such as Dashboards

Find/Replace for shorter relative links:
code
 ^ link ([^\s]+)\.html
  $1.html

📦 136.3.0 9/27/2024
🎉 new expand/collapse button on tables and removed confusing zoom in/zoom out
🎉 copy button on tables now generates just data, no more header/footer cruft
🎉 removed rarely used csv button on tables in favor of better copy button

📦 136.2.1 9/26/2024
🏥 container style fix when in snippets

📦 136.2.0 9/26/2024
🎉 added `container` parser

📦 136.1.0 9/26/2024
🎉 added `hakon` parser

📦 136.0.0 9/26/2024
⚠️ BREAKING: (no one should be affected). haml was matching too much. now haml parser requires an #id.

📦 135.0.0 9/26/2024
🎉 added `tufte` theme
⚠️ BREAKING: removed `gazetteCss`. Now use `theme gazette`.
⚠️ BREAKING: removed `tufteCss`. Now use `theme tufte`.

📦 134.1.0 9/26/2024
🎉 added `theme` parser and 3 themes: roboto, dark, and gazette
🎉 added `iframes` parser

📦 134.0.0 9/25/2024
🎉 added `haml` quick html tags
⚠️ BREAKING: (no one should be affected) if you have lines starting with a sequence like tag#id or tag.someClassName, they will now get matched to HAML parser.

📦 133.6.0 9/24/2024
🎉 added `links` parser to tables

📦 133.5.0 9/24/2024
🎉 added `compose` parser to tables

📦 133.4.0 9/24/2024
🎉 added `quickIncludeJsonParser` parser

📦 133.3.0 9/24/2024
🎉 added `cloc` parser
🎉 you can now use quickHtml in table flows

📦 133.2.0 9/22/2024
🎉 added `favIcon` parser

📦 133.1.0 9/21/2024
🎉 groupBy now supports better reductions including concat and first

📦 133.0.1 9/15/2024
🏥 better error message when eval'ing macros

📦 133.0.0 9/15/2024
🎉 Updated ScrollSDK to get new "atoms" terminology.
⚠️ BREAKING: see ScrollSDK breaking changes

📦 132.0.1 9/14/2024
🏥 fix unix timestamps in printTable

📦 132.0.0 9/14/2024
🎉 Updated ScrollSDK to get new "subparticle" terminology
⚠️ BREAKING: see ScrollSDK breaking changes

📦 131.0.0 9/14/2024
🎉 new parser: `quickCssParser`
🎉 new parser: `quickIncludeHtmlParser`
🎉 new parser: `quickScriptParser`
⚠️ BREAKING: (no one should be affected) if you have a one atom line that ends with .js, .css, or .html it will now be consumed by these parsers above.

📦 130.5.0 9/13/2024
🎉 new `assertHtmlEqualsParser` for faster and more intelligent testing
🏥 fix edge bug in inline markup parsers

📦 130.4.2 9/13/2024
🏥 counter should be floor not ceil

📦 130.4.1 9/12/2024
🎉 support for relative links in Url columns in `printTable`
🏥 scroll init style fix

📦 130.4.0 9/12/2024
🎉 add detection of timestamp columns and print them as dates in `printTable`
🎉 remove "Exported data" from copied text in datatables copy buttons
 // todo: need to remove this properly from the bundle, including the extra 2 blank lines.

📦 130.3.6 9/12/2024
🏥 buttons with link should be fully clickable

📦 130.3.5 9/11/2024
🏥 ScrollSetCLI fix
// todo: is this the right place for this file?

📦 130.3.4 9/10/2024
🏥 ScrollSetCLI fix

📦 130.3.3 9/10/2024
🏥 ScrollSetCLI fix

📦 130.3.2 9/10/2024
🏥 make just text clickable in view source links

📦 130.3.1 9/9/2024
🏥 npm fix

📦 130.3.0 9/9/2024
🎉 upstream ScrollSetCLI

📦 130.2.1 9/8/2024
🏥 table loop fixes
🏥 table json parsing fixes

📦 130.2.0 9/8/2024
🎉 added `limit` parser to tables
🎉 `loop` parser can now loop over tables

📦 130.1.1 9/5/2024
🎉 oneTextarea max height

📦 130.1.0 9/5/2024
🎉 oneTextarea forms now show a placeholder and example form

📦 130.0.0 9/4/2024
🎉 forms now submit via email and generate a nicely formatted email
⚠️ BREAKING: (no one should be effected) `classicForm` and `scrollForm` work differently now.

📦 129.0.0 9/4/2024
🎉 added `quickImport` parser for imports.
⚠️ BREAKING: (no one should be effected) if you had any lines that were just [filename].(scroll|parser), those will now be parsed as imports

📦 128.0.1 9/4/2024
🏥 better handling of circular dependencies with tables

📦 128.0.0 9/4/2024
🎉 added `quickVideo` parser for including videos.
🎉 added `quickMusic` parser for including sound files.
🎉 added `quickTable` parser for including csvs, tsvs, psvs, and ssvs.
⚠️ BREAKING: (no one should be effected) if you had any catch all lines starting with [filename].[one of the above extensions] will now be caught by one of these quick parsers

### Demos

belowAsCode 3
tests/sipOfCoffee.m4a
 loop
tests/spirit.mp4
 loop
pages.csv
 printTable

tableSearch

📦 127.0.0 9/4/2024
🎉 added `quickImage` parser. Add an image with just the filename. quickImageParser detects by filename.
⚠️ BREAKING: (no one should be effected) if you had any lines starting with [filename].(png|jpg|et cetera) will be parsed as image.

belowAsCode
particles.png

📦 126.1.0 9/3/2024
🎉 `scrollForm` now implements the One Textarea design pattern. Thanks Alejandro for your help!
 https://breckyunits.com/oneTextarea.html One Textarea design pattern

📦 126.0.1 9/3/2024
🏥 column stack fix

📦 126.0.0 9/3/2024
🎉 added `scrollForm` parser
🎉 added support for `textarea` to ScrollSet forms
🎉 added `abstractTextareaMeasureParser`
🎉 added `mediumColumn`, `thinColumn`, and `wideColumn` parsers.
⚠️ BREAKING: renamed `form` to `classicForm`

📦 125.8.0 9/2/2024
🎉 show * on required form fields

📦 125.7.0 9/2/2024
🎉 added `form` parser

📦 125.6.0 9/2/2024
🎉 metaParser now emits link to git tags

📦 125.5.1 9/2/2024
🏥 make printCsv work with buildCsv

📦 125.5.0 9/2/2024
🎉 heatrix drops first row if after a transpose
🎉 heatrix now does not color years if first row

📦 125.4.0 9/1/2024
🎉 upgrade ScrollSDK

📦 125.3.0 9/1/2024
🎉 cleanup docs to switch to term Particle Syntax (aka Particles).

📦 125.2.0 8/31/2024
🎉 chat parser now supports repeated messages from 1 side via blank lines

Example:

belowAsCode
chat
 I have some questions
 
 What is your current productivity tool
 pen and paper
 Hmm and for project management?
 pen and paper

📦 125.1.0 8/30/2024
🎉 switch `youTube` parser to `youtube` (all lowercase). Deprecate old spelling.

📦 125.0.1 8/29/2024
🏥 particles table fix

📦 125.0.0 8/29/2024
🎉 upgraded ScrollSDK to 84
⚠️ BREAKING: ScrollSDK updates require updating any Parsers with new "Particle" nomenclature
⚠️ BREAKING: `tree` is no longer a table format. Use `particles` instead.

📦 124.1.0 8/28/2024
🎉 added `buildPdf` parser. Currently requires MacOS + Chrome.

📦 124.0.0 8/27/2024
⚠️ BREAKING: removed `printMeasures`
⚠️ BREAKING: removed `printConcepts`
⚠️ BREAKING: `buildConcepts` and `buildMeasures` now generates `csv` by default instead of `tsv`

Before:
codeWithHeader contacts.scroll
 buildConcepts
 printConcepts

After:
codeWithHeader contacts.scroll
 buildConcepts
 table
  printTable

📦 123.3.0 8/27/2024
🎉 ending a column with "Url" in tables will now print the column name linked rather than url

📦 123.2.0 8/26/2024
🎉 added popularity table to leetsheet
🎉 added popularity numbers to parsers
🎉 added csv output to `printUsageStats`

📦 123.1.0 8/26/2024
🎉 updated ScrollSDK
🎉 better Parsers leetsheet documentation

📦 123.0.0 8/25/2024
🎉 updated ScrollSDK
⚠️ BREAKING: (no one should be affected). `printLeetSheet` is now `printScrollLeetSheet`
⚠️ BREAKING: (no one should be affected). `printAvancedLeetSheet` is now `printparsersLeetSheet`

📦 122.0.0 8/25/2024
🎉 updated ScrollSDK to get `paintParser` which replaces `highlightScopeParser`
⚠️ BREAKING: rename `highlightScope` to `paint`

📦 121.0.1 8/20/2024
🏥 web version printTitle fix.

📦 121.0.0 8/19/2024
🎉 emailButton, homeButton, downloadButton can now take a link
⚠️ BREAKING: `wwsButton` is now `downloadButton`
⚠️ BREAKING: removed `email`. Now do `emailButton [email]`
⚠️ BREAKING: removed `downloadUrl`. Now do `downloadButton [url]`

📦 120.2.1 8/19/2024
🏥 fix indent bug in `printRelated`

📦 120.2.0 8/15/2024
🎉 added `br` parser
🎉 added `buildCsv` parser

📦 120.1.0 8/15/2024
🎉 add clickable examples to leetsheet

📦 120.0.0 8/14/2024
🎉 added `emailButton` parser.
🎉 added `scrollVersionLink` parser.
🎉 added `wwsButton` parser.
🎉 `center` parser now also creates centered sections:

center
This should be centered.

⚠️ BREAKING: `printViewSource` is now `viewSourceLink`
⚠️ BREAKING: `pageFooter` has been split into simpler parsers.
codeWithHeader Find/Replace
 find ^pageFooter
 replace
  center
  emailButton
  downloadButton
  viewSourceButton
  scrollVersionLink

📦 119.0.0 8/13/2024
🎉 added `homeButton` parser.
🎉 added `leftRightButtons` parser.
🎉 added `viewSourceButton` parser.
⚠️ BREAKING: removed `pageHeader`. Split that into 3 simpler parsers. Change `pageHeader` to:
codeWithHeader Find/Replace
 find ^pageHeader
 replace
  homeButton
  leftRightButtons
  viewSourceButton
⚠️ BREAKING: `printViewSourceBadge` is now `viewSourceButton`
⚠️ BREAKING: removed `homeUrl`. Insead do:
code
 homeButton
  link ../someOtherURL.html

📦 118.9.0 8/11/2024
🎉 added `video` parser.
belowAsCode
video tests/spirit.mp4
 loop

📦 118.8.0 8/11/2024
🎉 added `music` parser for playing songs, podcasts, sounds, et cetera.
belowAsCode
music tests/sipOfCoffee.m4a
 loop

📦 118.7.0 8/11/2024
🎉 added v0.1.0 of `nickelbackIpsum` parser. Idea from gigamick.
 https://news.ycombinator.com/user?id=gigamick gigamick

📦 118.6.3 8/10/2024
🏥 `label` should show up in scatterplot autocomplete

📦 118.6.2 8/9/2024
🏥 don't trigger keyboard shortcuts if someone is trying to use keyboard back button shortcut. Thanks to Ben Atkin for the bug report!
 https://github.com/benatkin Ben Atkin

📦 118.6.1 8/9/2024
🏥 button link color fix

📦 118.6.0 8/9/2024
🎉 added `button` parser
🎉 added `dinkus` parser

📦 118.5.0 8/8/2024
🎉 make `image` parser easier to extend

📦 118.4.0 8/6/2024
🎉 add `impute` parser

📦 118.3.0 8/6/2024
🎉 `fetch` now writes to localStorage in browser environment.
🎉 `table` now can read from localStorage in browser environment.
🏥 handle empty values in `groupBy` parser

📦 118.2.2 8/6/2024
🏥 fix mac file name lower case issue

📦 118.2.1 8/6/2024
🏥 fix mac file name lower case issue

📦 118.2.0 8/6/2024
🎉 more concise `tableSearch` styling

📦 118.1.0 8/6/2024
🎉 `tableSearch` now adds copy and CSV buttons.

📦 118.0.0 8/6/2024
🎉 tables: added delimiter autodetection
🎉 tables: added columnName autocomplete
🎉 tables: added `transpose` parser
🎉 scatterplot: added x, y, and other autocompletes
⚠️ BREAKING: `sparkline [columnName]` is now `sparkline\n y [columnName]`

📦 117.1.0 8/5/2024
🎉 tables: added `groupBy` parser for "pivot tables"

📦 117.0.1 8/5/2024
🏥 fix highlight bug in where parser

📦 117.0.0 8/5/2024
🎉 tables: added `select` parser
🎉 tables: added `orderBy` parser
🎉 tables: added `rename` parser
🎉 tables: added `reverse` parser
🎉 added `fetch` parser
⚠️ BREAKING: (no one should be affected) Scroll now requires NodeJS >= 18.0.0.

📦 116.0.0 8/3/2024
⚠️ BREAKING: `scatterplot` now gets data from `table`.

📦 115.2.0 8/3/2024
🏥 fix extra space in related snippets

📦 115.1.0 8/3/2024
🏥 more regression fixes.

📦 115.0.2 8/3/2024
🏥 more regression fixes.

📦 115.0.1 8/3/2024
🏥 fix table regression.

📦 115.0.0 8/3/2024
🎉 `table [filename].[json|tsv|csv]` to load and print a table from disk
🎉 `sparkline` now can take a table as input:
code
 table posts.csv
  sparkline
   y wordCount
⚠️ BREAKING: removed support for root level TSV. Not useful enough. Convert any root TSV to a standard table.
⚠️ BREAKING: removed `printTable` at root level. Now works nested under table
⚠️ BREAKING: removed `spaceTable`. See below to migrate.
⚠️ BREAKING: removed `tabTable`. See below to migrate.
⚠️ BREAKING: removed `treeTable`. See below to migrate.
⚠️ BREAKING: removed `commaTable`. See below to migrate.
⚠️ BREAKING: removed `pipeTable`. See below to migrate.
⚠️ BREAKING: `table` now takes delimiter and data parsers. Usage:
table
 delimiter ,
 printTable
 data
  name,score
  Kape,35
Regex to find all breaks: ^(printTable|spaceTable|tabTable|treeTable|commaTable|pipeTable|table )

📦 114.0.0 8/2/2024
🎉 `inlineMarkups` now supports setting attributes and tags
🏥 upgrade scrollsdk to get exponential notation numbers fix
⚠️ BREAKING: (no one should be affected). Removed short form of link inline markup. Just use `a href="url"` instead.

📦 113.0.0 8/1/2024
🎉 added `inlineMarkups` parser. Thanks to eugenesvk for the idea.
 https://github.com/eugenesvk eugenesvk
 https://github.com/breck7/scroll/issues/122 idea
🎉 `printSourceStack` now prints [Unchanged] if the source was not changed during a compiler step.
⚠️ BREAKING: `wrapsOn` is now `inlineMarkupsOn`
⚠️ BREAKING: `wrap` is now `inlineMarkup`

📦 112.1.2 7/31/2024
🏥 counters fix

📦 112.1.1 7/31/2024
🏥 counters fix

📦 112.1.0 7/31/2024
🎉 added `counters` parser.

📦 112.0.0 7/31/2024
🎉 added `printSourceStack` parser to provide a clean way to view source code at each step in compilation.
⚠️ BREAKING: removed `readingList` parser. Aftertext is a better choice.
⚠️ BREAKING: merged `printExpandedSource` and `printOriginalSource` into `printSourceStack`

📦 111.5.0 7/29/2024
🎉 added `buildFiles` to CLI class

📦 111.4.0 7/29/2024
🎉 added `printExpandedSource` and `printOriginalSource` parsers

📦 111.3.0 7/29/2024
🎉 better error messages

📦 111.2.0 7/29/2024
🎉 added `testStrict` parser to allow disabling catch all paragraph on a per file basis.

📦 111.1.0 7/26/2024
🎉 `heatrix` now supports using custom labels even for numeric atoms.
🏥 always include a 0 value in `heatrix`
 // not sure if this is correct design.

📦 111.0.0 7/26/2024
🎉 redesigned `heatrix`.
⚠️ BREAKING: (no one should be affected). `heatrix` is now `heatrixAdvanced`. `heatrix` is the simplest fast version now.

📦 110.3.0 7/25/2024
🎉 print 0's in `heatrix`
🏥 remove stray console.log

📦 110.2.0 7/25/2024
🎉 `printCsv` now includes `year` column
🎉 added `heatrix` parser

📦 110.1.0 7/25/2024
🎉 captions now have the same width as their images

📦 110.0.0 7/24/2024
🎉 `printRelated` now has support for tags! No need to add a `related` line on each post.
⚠️ BREAKING: `groups` is now `tags`.
⚠️ BREAKING: `printRelatedList` is now just `printRelated`.
⚠️ BREAKING: removed `related` parser. Now just use tags. Apply tags liberally.

📦 109.5.0 7/21/2024
🎉 added `codeWithHeader` parser
🎉 added `center` aftertext markup parser
🎉 txt versions of aftertext links now includes the pattern
🎉 added `printFormatLinks` parser

📦 109.4.0 7/21/2024
🎉 `printAdvancedLeetSheet` now also prints atom parser docs

📦 109.3.0 7/20/2024
🎉 easily apply styling to a whole paragraph using aftertext.

Demo:

belowAsCode 4
Hello world
 bold
This is italicized
 italics
Make this code
 code
Strikethrough this whole line.
 strike

📦 109.2.0 7/19/2024
🎉 add `printAdvancedLeetSheet` after feedback in r/WorldWideScroll
 https://www.reddit.com/r/WorldWideScroll/comments/1e77m6p/writing_parsers/ r/WorldWideScroll

📦 109.1.0 7/19/2024
🎉 added support for `height` and `width` to images
🎉 added support for `float` to images

📦 109.0.2 7/19/2024
🏥 fixed incorrect error report.

📦 109.0.1 7/19/2024
🏥 fix atom syntax highlighting in `wrapsOn`. You can write `wrapsOn none` to disable all wraps.

📦 109.0.0 7/18/2024
🎉 `printCsv` now exports `authors` as well
🎉 added `authors` parser to support multiple authors
🎉 `authors` now can use all aftertext features
⚠️ BREAKING: `printAuthor` is now `printAuthors`
⚠️ BREAKING: `author` is now `authors`.

To update from `author` to `authors`, you can use this regex find/replace:

Find: ^author ([^ ]+) (.*)
Replace: authors $2\n $1 $2

📦 108.3.1 7/16/2024
🏥 include microlangs in npm package

📦 108.3.0 7/16/2024
🎉 added `contacts` microlang.
🎉 changed gazetteCss link color to be subtler
🎉 added `microlangs` folder

📦 108.2.0 7/15/2024
🎉 added `center` parser! first blink, now center!

📦 108.1.0 7/15/2024
🎉 table style improvements

📦 108.0.0 7/15/2024
⚠️ BREAKING: (no one should be affected) Renamed `printCheatSheet` to `printLeetSheet`

📦 107.3.0 7/14/2024
🎉 added `printUsageStats` parser.
🎉 docs: bolded commonly used parsers in cheat sheet.
🎉 docs: other cheat sheet improvements.
🎉 docs: `printCheatSheet` now prints good txt only docs too.

📦 107.2.0 7/14/2024
🎉 docs: clearer, more conscise descriptions of 7 atoms or less on every parser.
🎉 docs: `printCheatSheet` now prints descriptions.

📦 107.1.0 7/14/2024
🎉 add `printCheatSheet` parser v0.1.0

📦 107.0.0 7/14/2024
🎉 correct syntax highlighting for the different kinds of Parsers.
🎉 removed some parsers from appearing in autocomplete
🏥 blink works for any colors now.
⚠️ BREAKING: If you have written your own parsers `keywordAtom` has been replaced by `cueAtom`. You can do a simple find/replace or just add:
code
 keywordAtom
  extends cueAtom

📦 106.0.1 7/13/2024
🏥 fix bug where running `scroll build` through passed in SSH command was hanging

📦 106.0.0 7/11/2024
🎉 added missing documentation for better autocomplete
⚠️ BREAKING: removed deprecated parsers: `startColumns`, `gazetteHeader`, `gazetteFooter`, `byLine`

📦 105.1.0 7/11/2024
🎉 added `printViewSourceBadge` parser

📦 105.0.0 7/11/2024
⚠️ BREAKING: removed the `git` parser. No longer needed now that we use deep link to all source pages.
⚠️ BREAKING: renamed `viewSource` to `printViewSource` to clarify that it prints an HTML element.

📦 104.0.0 7/11/2024
⚠️ BREAKING: the git icons now point to the viewSource url, not to a master git repo page. This should make it easier to go to the specific source file of interest.

📦 103.0.2 7/11/2024
🏥 `pageHeader` and `pageFooter` parsers will now only emit icons for git, downloadUrl, and email if those items are set

📦 103.0.1 7/11/2024
🏥 code div fix in slideshows

📦 103.0.0 7/10/2024
⚠️ BREAKING: shortened `strikethrough` parser to `strike`

📦 102.3.0 7/08/2024
🎉 add support for TSVs to scatterplot

📦 102.2.2 7/08/2024
🏥 measureStats fix

📦 102.2.1 7/08/2024
🏥 `loadConcepts` fix

📦 102.2.0 7/08/2024
🎉 build scrollsets first and so the outputs can be used to build html files

📦 102.1.0 7/07/2024
🎉 integrate feedback from h4l to make tables expand on click
 https://www.reddit.com/r/programming/comments/1dwvezp/comment/lc0ytu6/ feedback from h4l

📦 102.0.0 7/06/2024
🎉 changed `relatedParser` to `relatedScrollFilesParser` to free up `relatedParser` for userland.
⚠️ BREAKING: renamed `relatedList` to `printRelatedList`

📦 101.6.0 7/06/2024
🎉 added `sortBy` to `printConcepts` parser

📦 101.5.0 7/05/2024
🎉 `scroll init` generates a smaller site

📦 101.4.0 7/04/2024
🎉 renamed `descriptionParser` to `openGraphParser` and `titleParser` to `pageTitleParser` to free up those names for userparserland.

📦 101.3.0 7/03/2024
🎉 added `buildJs` and `script` parsers

📦 101.2.0 7/03/2024
🎉 added `buildCss` parser
🏥 fix css text regression

📦 101.0.1 7/03/2024
🏥 fix sitemap regression

📦 101.0.0 7/03/2024
This is a major breaking release meant to simplify and standardize a lot of the core Scroll concepts.
🎉 added `buildHtml` parser
🎉 added `buildRss` parser
🎉 you no longer need to write `importOnly` on a file if the file uses no buildCommandParsers.
⚠️ BREAKING: `snippets` => `printSnippets`
⚠️ BREAKING: `fullSnippets` => `printFullSnippets`
⚠️ BREAKING: `buildText` => `buildTxt`
⚠️ BREAKING: `scroll build` will no longer write anything by default. You now need to explicitly include 1 or more buildCommands in your files, such as `buildHtml` or `buildTxt`.
⚠️ BREAKING: removed `tags` parser in css themes. Instead of this:

code
 permalink style.css
 gazetteCss
  tags false
Do this:

code
 buildCss style.css
 gazetteCss

📦 100.0.0 7/02/2024
🎉 if not present, `date` is now derived from file creation time
🎉 if not present, `title` is now computed by un-camelcasing the filename
⚠️ BREAKING: (no one should be affected) date and title are now computed automatically so if you had a file missing those previously on purpose (for some reason), they will now actually have those.

📦 99.2.0 7/01/2024
🎉 added changes.parsers
🎉 Scrollsets now supports defining concept delimiters other than `id`

📦 99.1.0 7/01/2024
🎉 added `limit` parser to snippets

📦 99.0.0 6/30/2024
⚠️ BREAKING: I moved `wws` to its own repo

📦 98.0.2 6/30/2024
🏥 another missing file in package fix

📦 98.0.1 6/29/2024
🏥 fix bug #115 in `wws`. Thank you Nick Noble!
 https://github.com/breck7/scroll/issues/115 bug #115
 https://github.com/nickisnoble Nick Noble

📦 98.0.0 6/26/2024
⚠️ BREAKING: `writeText` is now `buildText`
⚠️ BREAKING: `writeConcepts` is now `buildConcepts`
⚠️ BREAKING: `writeMeasures` is now `buildMeasures`
⚠️ BREAKING: (no one should be affected), `buildFilesInFolder` now returns an object of all built files.

📦 97.4.0 6/25/2024
🎉 added `scatterplot` can now take a url as a data source

📦 97.3.1 6/24/2024
🏥 bug fix

📦 97.3.0 6/24/2024
🎉 added `scatterplot` parser

📦 97.2.0 6/23/2024
🎉 added `stamp` mini language

📦 97.1.1 6/21/2024
🏥 test fix

📦 97.1.0 6/21/2024
🎉 added `sparkline` parser using beautiful tiny sparkline library by Marius Gundersen.
 https://github.com/mariusGundersen/sparkline sparkline library
 https://mariusgundersen.net/ Marius Gundersen

belowAsCode
sparkline 5 7 27 87 300 17 10 5

📦 97.0.0 6/19/2024
🎉 BREAKING: upgraded scrollSDK to get `grammar` to `parsers` change.

📦 96.0.0 6/18/2024
🎉 Instead of `grammar` it's just `parsers`.
⚠️ BREAKING: (no one should be affected) files previously ending in `.grammar` now end in `.parsers`.

📦 95.2.0 6/16/2024
🎉 added `formatAndSave` method.

📦 95.1.0 6/14/2024
🎉 added `wws` command line app.

📦 95.0.0 6/11/2024
🎉 added `downloadUrl` parser.
⚠️ BREAKING: `canonicalLink` is now `canonicalUrl`.
⚠️ BREAKING: `homeLink` is now `homeUrl`.

📦 94.0.1 6/1/2024
🏥 make slideshow start after the first dinkus

📦 94.0.0 5/31/2024
🎉 jtree is now the "ScrollSDK" and "Tree Notation" is now "Particles"
⚠️ BREAKING: (only advanced users affected), if you wrote custom Parsers, you may need to find/replace `jtree` with `scrollsdk`

📦 93.7.1 5/30/2024
🏥 katex should print contents in txt compilation

📦 93.7.0 5/29/2024
🎉 added `classes` parser

📦 93.6.2 5/28/2024
🏥 more Windows fixes

📦 93.6.1 5/28/2024
🏥 upgrade JTree to try and get Scroll working on Windows

📦 93.6.0 5/28/2024
🎉 clean up generated html (add a  tag).

📦 93.5.0 5/27/2024
🎉 clean up generated html (add a  tag, for instance).

📦 93.4.0 5/27/2024
🎉 improved meta tags

📦 93.3.0 5/27/2024
🎉 all Parsers can now use `requireOnce`
🎉 added `abstractCustomListItemParser` for making HTML lists with custom markers
🏥 bug fix in slideshow

📦 93.2.0 5/23/2024
🎉 `writeConcepts` and `writeMeasures` now strips blank values when generating JSON and/or JS

📦 93.1.0 5/23/2024
🎉 `tableSearch` now will save the sort order to the url
🏥 fixed bug where updates to externals would not get copied

📦 93.0.0 5/21/2024
🎉 `scroll format` command now also prettifies concepts and measurements in ScrollSets. If a measurement's `sortIndex` jumps to a new integer (for example, 1.9 to 2.1), a newline will be inserted before it.
⚠️ BREAKING: (no one should be affected) the default `sortIndex` is now 1.9, and the sort index of `id` is 1.0. Update `sortIndex` accordingly.

📦 92.0.0 5/20/2024
🎉 simplified ScrollSets by removing the filename "magic". When putting a concept into a file, make the `id` the filename (without the extension). Have the id be a simple one atom url friendly string. If you want a pretty title, add a `name` measure. Everything much simpler this way.
⚠️ BREAKING: (no one should be affected) remove any spaghetti filename code.

📦 91.0.0 5/19/2024
🎉 `printAuthor` parser prints the author defined by `author`. `byLine` has been deprecated--replace with `printAuthor`.
⚠️ BREAKING: `author` parser now takes a URL.

📦 90.5.0 5/19/2024
🎉 added `printDate` parser

📦 90.4.1 5/19/2024
🏥 `helpfulNotFound` now assumes the script can be found at the root of the domain.

📦 90.4.0 5/19/2024
🎉 helpful 404 can now take multiple sitemaps as a parameter

📦 90.3.0 5/18/2024
🎉 renamed `Scroll Datasets` to `ScrollSets`.

📦 90.2.3 5/18/2024
🏥 `Coverage` in Measurements should round down.

📦 90.2.2 5/18/2024
🏥 fixed Grammar method name conflict with measures. Now they should be `isMeasureRequired`.

📦 90.2.1 5/18/2024
🏥 fixed `metaTags` from breaking try.scroll.pub
🏥 got `slideshow` working on try.scroll.pub

📦 90.2.0 5/18/2024
🎉 added `slideshow` parser
🎉 grammar extensions can now use "copyFromExternal"

📦 90.1.1 5/17/2024
🏥 added test and fixed bug with `printTitle` in text files

📦 90.1.0 5/17/2024
🎉 2.5x faster test running thanks to adding cacheing to measure parser

📦 90.0.0 5/16/2024
⚠️ BREAKING: `idParser` and `filenameParser` no longer ship in default grammar. This will allow for useful future dataset features. Instead, add them yourself if you are using Concepts like this:

code
 idParser
  extends abstractIdParser
 filenameParser
  extends abstractFilenameParser

📦 89.2.1 5/16/2024
🏥 fixed required measurements when computeds are involved
🎉 print folder name when running scroll test

📦 89.2.0 5/16/2024
🎉 added support for required measurements

📦 89.1.2 5/16/2024
🏥 loadConcepts should only load Scroll files containing a concept (as determined by having an "id ").

📦 89.1.1 5/16/2024
🏥 minor fix in themes grammar.

📦 89.1.0 5/15/2024
🎉 added ability to override content in `printTitle`

📦 89.0.0 5/15/2024
🎉 `printTitle` parser added for easier templates
⚠️ BREAKING: `title` is now a setter. This regex handles the migration:
 - `^title ` `printTitle\ntitle `
  - Then (optionally) run "scroll format" or "scroll list | scroll format" to format which will automove your titles up top.

📦 88.0.0 5/15/2024
🎉 easier snippets! if you have a dinkus anywhere "***|****|---", that will be used as an "endSnippet"
⚠️ BREAKING: (no one should be affected). If you had a post that purposefully had no `endSnippet` and does have a dinkus, it will now generate a snippet rather than using the whole post.

📦 87.0.1 5/15/2024
🏥 fixed off by 1 bug in computed measures

📦 87.0.0 5/14/2024
⚠️ BREAKING: added stricter conventions for `measureNames`. Restrict them from containing "_", which we use to combine nested measures.

📦 86.0.2 5/12/2024
🏥 add relative paths to sitemaps if needed

📦 86.0.1 5/12/2024
🏥 improved test coverage

📦 86.0.0 5/12/2024
🎉 added a v1 version of a markdown style of doing quotes `>` (with aftertext support)!
🎨 made the View Source links have same style as other Scroll chrome, and removed those links in short snippet renders (never get needed there--only on the actual page)
⚠️ BREAKING: if you have any lines starting with `> `, those will now be parsed by the quickQuoteParser

📦 85.9.0 5/12/2024
🎉 added `minutes` to read (assuming 200 atoms/minute) to `printSearch` and `printCsv` exports
🎉 you can now pass groups to `sitemap` for making sitemaps specific to certain folders/groups
🎉 for `printFeed`, `snippets`, `fullSnippets` providing groups is now optional

📦 85.8.0 5/10/2024
🎉 measures and concepts can now also be written as Javascript for explore pages.

📦 85.7.0 5/10/2024
🎉 `replaceJs` now has access to the filepath

📦 85.6.0 5/10/2024
🎉 `sortBy` can now sort on multiple columns and handle asc/desc

📦 85.5.0 5/10/2024
🎉 `writeConcepts` and `writeMeasures` can now take multiple filenames in one line and also include a `sortBy` condition.

📦 85.4.0 5/10/2024
🎉 Scroll now auto-adds a "filename" measure as to which file the concept appears in.

📦 85.3.0 5/10/2024
🎉 Scroll now only wraps compiler output with html tags if permalink ends in "html" or "htm". Makes it easier to use Scroll to compile files to different language targets.

📦 85.2.1 5/10/2024
🏥 fixed bug where `id` measure was appearing twice

📦 85.2.0 5/10/2024
🏥 fixed bug with nested measure names.
🎉 some slight enhancements to computed measures

📦 85.1.0 5/09/2024
🎉 added support for nested measures. The underscore "_" character is used for column names for nested measures for the broadest compatibility with other data science tools

📦 85.0.0 5/08/2024
🎉 upgraded jtree to get ability for faster compilations
⚠️ BREAKING: removed `replaceDefault` parser. No one should be affected.
⚠️ BREAKING: renamed `nodejs` parser to `replaceNodejs. Few should be affected.

📦 84.10.1 5/08/2024
🏥 fix hanging test (infinite loop regression) during build when you have just 1 file.

📦 84.10.0 5/08/2024
🎉 faster html generation when `keyboardNav` was in use. First implementation was accidentally quadratic.

📦 84.9.0 5/08/2024
🎉 faster concepts and measures compilation

📦 84.8.1 5/07/2024
🏥 `printSearchTable` now generates correct links when searching across multiple folders

📦 84.8.0 5/07/2024
🎉 `tableSearch` now takes a parameter from the url `#q=[search]`. Updating the searching box also updates url.

📦 84.7.0 5/07/2024
🎉 Added `printSearchTable` parser

📦 84.6.0 5/07/2024
🎉 Added support for computed measures
🎉 better measure statistics printing

📦 84.5.1 5/07/2024
🏥 better error printing with `scroll test` and fix bug in `percentAtom`

📦 84.5.0 5/07/2024
🎉 Added `writeMeasures` and `printMeasures` parsers
🎉 Added `abstractPercentageMeasureParser`

📦 84.4.0 5/06/2024
🎉 Added `loadConcepts` parser for if you had a dataset split into many files in a folder.
🎉 Added `float sortIndex [int]` for sorting the measures(columns) in dataset generation. Lower sort indexes come first.

📦 84.3.0 5/06/2024
🎉 `scroll test` will now report if an aftertext pattern has no matches.

📦 84.2.0 5/06/2024
🎉 added `****` as an "end of post dinkus" which prints ⁂
🎉 tabular tables now support aftertext!
🏥 allow multiatom strings to be used as an `id` in concepts

📦 84.1.0 5/04/2024
🎉 snippets now export some content in plain text
🎉 improved the default site generated by `scroll init`

📦 84.0.0 5/04/2024
🎉 Datasets (aka "Concept files") version 2! Much simpler.
🎉 Added the `id` parser for using datasets.
🎉 Removed the `[measureName]: ` syntax introduced in version 77. You no longer have to worry about the annoyance that introduced when writing a paragraph such as "Sidenote: yada yada".
🎉 Added `belowAsCodeUntil` parser

⚠️ BREAKING: removed `::` parser. Now concepts are simply identified by the parser `id`.
⚠️ BREAKING: `writeDataset` is now `writeConcepts` and `printDataset` is now `printConcepts`.
⚠️ BREAKING: Removed the `[measureName]: ` syntax introduced in version 77. To use datasets (aka Concept files) now, just extend Scroll parsers like you normally would. See this blog post for an example.
 blog/datasets.html this blog post for an example

📦 83.3.0 5/04/2024
🎉 repeating the baseUrl after `openGraphImage` is no longer required. Will be auto-added if not present.

📦 83.2.0 5/04/2024
🎉 added `link` under `image`. Also added `target`.
🎉 for posts with multiple images, you can now put `openGraph` under an `image` node as an alternative to adding a separate `openGraphImage` line
🎉 added `mediumColumns` parser
🎉 added `thinColumns` parser.

* Note: `startColumns` will eventually be removed. You can now safely switch those to `thinColumns`.

📦 83.1.0 5/03/2024
🎉 added `expander` parser

expander Click me
Anything in the section will show up here. A blank line ends a section.

📦 83.0.0 5/03/2024
🎉 all tables now print in plain text outputs
🎉 added `printTable` parser
⚠️ BREAKING: root level tabular tables no longer produce output. Add a `printTable [index]` to print any existing tabular tables.

`printTable` will look for a table to print using this strategy:
- If an index is provided, print that table.
- Else, is there a table right below this line?
- Else, is there a table right before this line?
- Else, print the first table in the file.

📦 82.2.0 5/03/2024
🎉 pruned more files from `npm install`

📦 82.1.0 5/03/2024
🎉 pruned dependencies to make `npm install -g scroll-cli --production` fast

📦 82.0.1 5/01/2024
🏥 fixed regression where `endSnippet` was showing up in html

📦 82.0.0 5/01/2024
🎉 meta tags can now have nested comments
🎉 added `formatCommand` to the CLI for nicely formatting files, moving top matter to the top, cleaning up white space, etc, so you don't have to worry about that.
🎉 plain text files now will have a maximum of 2 blank lines in a row
🎉 plain text files now print date, if there's a dateline

The current formatting conventions are:

- Scroll files end in a single newline
- Trailing spaces and tabs are stripped from lines, unless the whole line is whitespace
- `importOnly`, if present, is moved to the very top
- 3 or more newlines are trimmed down to 2
- Meta tags are moved to the top of the file
- 2 newlines comes after meta tags
- Tags that print content and comments stay put
- Meta tags are sorted alphabetically with no blank lines in between [In the future, may want to allow customizing this]

Note that currently the `title` tag is a meta tag and a tag that prints content. Going to split that up into 2 tags soon.
Note that if you are doing something like a tutorial and using a `belowAsCode` where you purposely put a top matter parser not at the top, it will currently get moved to the top by format. We can probably add a feature like treating meta nodes with `// noFormat` as if they were content nodes.

📦 81.2.0 4/30/2024
🎉 added `related` and `relatedList` parsers

📦 81.1.0 4/29/2024
🎉 added `plainTextOnly` for rare case when you need to include content only for the plain text version.
🏥 `html` should not print in text versions (since it is _html_ :)).

📦 81.0.0 4/29/2024
🏥 links now appear in plain text output. relative links are made absolute.
🏥 indented lists now appear in plain text output.

⚠️ BREAKING: (no one should be affected) if you extended the `thoughtParser`, that is now called `paragraphParser`.

📦 80.2.1 4/29/2024
🏥 fixed regression in tabular tables printing
// a hint that we should refactor that and make all table printing explicit :)

📦 80.2.0 4/29/2024
🎉 added `helpfulNotFound` parser for better 404s.

📦 80.1.0 4/29/2024
🎉 `wordCount` in `printCsv` now measures wordCount in the text version of a post.

📦 80.0.0 4/29/2024
🎉 Scroll now generates text files! Added the `writeText` parser.
 blog/textFiles.html Scroll now generates text files

* Note: there are likely to be a few rapid releases to refine this.

📦 79.1.0 4/27/2024
🎉 added `printSiteMap` parser for text sitemap generation.

📦 79.0.1 4/27/2024
🏥 fix npm issue

📦 79.0.0 4/27/2024
🎉 better offline builds: if used, katex, tableSearch, and maps now copy their needed css and js into their folder and those assets are served locally rather than through CDN.
⚠️ BREAKING: you may need to make some slight updates, such as adding the copied files to .gitignore.

📦 78.0.2 4/27/2024
🏥 open graph image url fix: remove the extra "/" which caused images not to show in Twitter

📦 78.0.1 4/26/2024
🏥 style fix: ensure column splits don't separate images from their captions

📦 78.0.0 4/25/2024
🎉 made tabular data a root level parser in Scroll.
⚠️ BREAKING: if you had lines with tabs that currently match the catchall paragraph, you'll need to make those explicit paragraphs to avoid them getting parsed by the tabular data parser. You should be able to find those lines with a regex like this: `^(\t|[^ ]+\t)`

Spreadsheets are great tools for working with tabular data. I want to copy/paste between Scroll docs and spreadsheets. This makes it easier.

Tabular data is better than line orientation for experimental data because it requires half the number of tokens and it's more efficient eye movement during comparisons and proofreading.

Scroll already supported tabular data using `tabTable`, but that made copy/paste workflows between spreadsheets and text editors a pain. This should be more ergonomic and make it easier to work with this useful tool of thought.

📦 77.3.1 4/23/2024
🏥 style fix: fixed style bug where on narrow screens the post title would overlap the corner nav buttons.

📦 77.3.0 4/22/2024
🎨 updated presentation of footnotes

📦 77.2.0 4/22/2024
🎨 improved default table styles

📦 77.1.0 4/21/2024
🎉 Simplified datasets further after user tests.

📦 77.0.0 4/21/2024
🎉 Added Scroll Datasets, which consists of the `::`, `printDataset`, `writeDataset`, and `*:` and `*::` parsers.
 blog/datasets.html Scroll Datasets

⚠️ BREAKING: if you had lines starting with a atom then colon, that used the catchall paragraph, such as `Sidenote: yada yada.`, those will now be parsed incorrectly as measures. Just explicitly make them paragraphs `* Sidenote: yada yada.`. This regex can help you find any instances: `^[^ ]+: .`

📦 76.0.0 4/19/2024
🎨 try using "rem" in CSS to better support the "zooming out" effect on a blog

The code below added to a page will create the zoom out effect:

code
 css html {font-size: var(--scrollBaseFontSize, 8px);}

⚠️ BREAKING: There might be some slight style breaks related to this change.

📦 75.2.1 4/18/2024
🏥 style fix: removed top margin on headers when they are in the first section

📦 75.2.0 4/18/2024
🎨 increased the default font-size from 14px to 16px
🎨 changed the font-family and line height of captions which previously looked off
🎨 adjusted margins on question h4s
🏥 fix slight line-height issue with datelines

📦 75.1.1 4/16/2024
🏥 fix bug where quick links could not be used inside a footnote definition.

📦 75.1.0 4/10/2024
🎉 Added `***` parser to print a Dinkus
 https://en.wikipedia.org/wiki/Dinkus Dinkus

belowAsCode 6

Now I will show an example.

***

Above is a dinkus.

📦 75.0.0 4/06/2024
🏥 Revert version 74. There was a simpler way to fix that pattern.

📦 74.0.0 4/06/2024
- (Reverted)

📦 73.2.0 4/05/2024
🎉 added `thanksTo` parser

📦 73.1.0 4/05/2024
🎉 added `plainText` parser
🎉 added `printSource` parser to be able to dump the source code for a group of posts to a plain text file.

📦 73.0.0 4/03/2024
🎉 added `printCsv` parser to make it as easy to generate a CSV of a blog as it is to generate an RSS feed

📦 72.4.4 2/07/2024
🏥 do not print "undefined" in tables in rows missing columns

📦 72.4.3 11/04/2023
🏥 fix extra indentation in nested lists. Browser already adds it.

📦 72.4.2 11/04/2023
🏥 do not compile aftertext nodes having the "hidden" attribute

📦 72.4.1 11/04/2023
🏥 fixed regression where `` was present in RSS pages. Thank you to Joao for the report.

📦 72.4.0 6/27/2023
🎉 provide "dropcap" CSS class.
🎉 tweaked default styling of images and captions

This paragraph has a dropcap. It can be a useful visual aid for the reader to break up sections. You can read more about dropcaps on Wikipedia.
 class dropcap
 https://en.wikipedia.org/wiki/Initial dropcaps on Wikipedia

📦 72.3.0 6/13/2023
🎉 if you want to disable `wrapsOn` you can now provide parameters to specify only the wraps you want, if any.
🏥 by default katex wraps won't run unless there is a `katex` node in a file. So any paragraph containing multiple $ will now behave as before katex wraps were added.

📦 72.2.0 5/31/2023
🎉 added `wideColumns` parser

📦 72.1.0 5/26/2023
🏥 Bold and italics are no longer parsed inside inline code `2*4*2` or inline $\KaTeX$ $X_{2_i}$.

📦 72.0.0 5/25/2023
🎉 added support for inline $\TeX$ via $\KaTeX$.
 - Current implementation requires adding at least one `katex` node in your file and will load the KaTeX code.

katex

📦 71.5.0 5/19/2023
🎉 added support for extra newlines between items in ordered lists
🎉 added support for custom footnote labels and move footnote link to end with new style
🎉 added hover style to "Built with Scroll" footer link

📦 71.4.0 5/9/2023
🎉 style improvements to lists

📦 71.3.0 5/8/2023
🎉 added `program` parser for Program Links. See blog post for details.
 blog/programLinks.html blog post

📦 71.2.0 5/07/2023
🏥 add `&lt;!DOCTYPE html&gt;` to improve performance on Google Lighthouse.
🏥 fix regression of meta description generation and add test
🏥 upgrade JTree to get colorized test output

📦 71.1.0 5/07/2023
🏥 add `&lt;html lang&gt;&lt;/html&gt;` back as you need that to get proper hyphenation. Added test.
🎉 added `htmlLang` parser for overriding the default lang which is set to "en"
🎉 added `text-align: justify;` on paragraphs to Gazette and Tufte themes.

📦 71.0.0 5/06/2023
🎉 added `tufteCss` beta theme.
🎉 added `###`, `####` and `#####` headers.
⚠️ BREAKING: slight changes to the h1-h4 font sizes and margins in the default gazetteTheme.
 - A single # is now h1, ## is h2, et cetera. `title` can be thought of as `h0`.
⚠️ BREAKING: `gazetteHeader` is now `pageHeader` and `gazetteFooter` is now `pageFooter`. Headers and footers can be independent of themes.

📦 70.0.0 4/29/2023
🎉 Paragraphs no longer need to start with '* '. All non-blank lines that don't start with a defined parser are now treated as a paragraph. The catch-all is no longer an error. It is recommended to start all paragraphs with a capital letter, as in the future it may become the standard that parsers start with a lowercase or symbol, and you will avoid any future parser collisions.
 - Thanks to zoeartemis for the feedback.
 - No changes are needed but you can update your files with the find/replace combo: `\n\* ` `\n`.
  - You may want to use the case sensitive `\n\* [a-z]` search first to find any paragraphs that start with a lowercase letter.
  - You also want to be careful of any lines that would now start with `&lt;!`, as they will be parsed as HTML nodes.

📦 69.3.0 4/26/2023
🎉 Add `katex` parser. KaTeX: "The fastest math typesetting library for the web."
 https://katex.org/ KaTeX

📦 69.2.0 4/18/2023
🎉 added the `tag` parser to thought nodes so you can change the compiled html tag (needed in rare circumstances)
🎉 added the `thought` parser and standardized vocab to calling the thought node the main node that most nodes extend.
🎉 added the `style` parser to provide inline html styles to a thought node.

📦 69.1.4 4/13/2023
🏥 get tfs fixes in jtree

📦 69.1.3 4/13/2023
🏥 get tfs fixes in jtree

📦 69.1.1 4/13/2023
🏥 Improve syntax highlighting of counters and comments

📦 69.1.0 4/13/2023
🎉 Added counters

📦 69.0.0 4/9/2023
No one should be affected. This was an internal rewrite to upstream the imports code to `ParticleFileSystem` in Jtree. No changes for Scroll users.
⚠️ BREAKING: `scrollKeywords` is no longer exported
⚠️ BREAKING: `DefaultScrollCompiler` is now `DefaultScrollParser`
⚠️ BREAKING: `ScrollDiskFileSystem` and `ScrollInMemoryFileSystem` replaced by `ScrollFileSystem`

📦 68.0.0 4/3/2023
Simplify theme building.
⚠️ BREAKING: `gazetteTheme` is now `gazetteCss`.
⚠️ BREAKING:
code
 // Change `gazetteTheme noTags` to:
 gazetteCss
  tags false

📦 67.1.0 4/3/2023
Maintenance release. Update packages and remove unused package and specify required NodeJs versions accurately.

📦 67.0.0 4/2/2023
This is _The Theme Release_.
🎉 Introduce the idea of parsers for theming scrolls.
⚠️ BREAKING: `author` node is now `byLine`. `author` is kept for now but updating is recommended.
⚠️ BREAKING: `scrollCssTag` is gone. use `gazetteTheme` for previous behavior. `scrollCss` is gone, use `gazetteTheme noTag`.
⚠️ BREAKING: SCROLL_CSS has been removed. `gazetteTheme` now contains that CSS code.
⚠️ BREAKING: `scrollHeader` is now `gazetteHeader` and `scrollFooter` is now `gazetteFooter`
⚠️ BREAKING: css classes: `scrollHeaderComponent` => `gazetteHeader`, `scrollFooterComponent` => `gazetteFooter`
⚠️ BREAKING: `kpiTable` is now `dashboard`

📦 66.0.0 4/2/2023
⚠️ BREAKING: This upgrades to JTree 73 and Grammar 6. Any custom grammar files need to be updated (generally this just means a find/replace of `Node` to `Parser`).

📦 65.0.0 3/30/2023
🎉 Upgrade to Jtree 71 to get Grammar 5 wiith scoped parsers.

📦 64.0.0 3/28/2023
🎉 Upgrade to Jtree 70 to get Grammar 4. Now comments and blank lines are okay in grammars.

📦 63.1.0 3/27/2023
🎉 Added `abstractScrollWithRequirementsNode` and use it for `copyButtons` and `map` to only include the external JS and CSS once.
🎉 Added `compileSettings` as an input in all Scroll nodes rather than maintaining state on instances
🏥 minor code cleanup and bug fixes

📦 63.0.1 3/27/2023
🏥 cache hotfix for embedded snippets.

📦 63.0.0 3/27/2023
This was a big internal refactor to remove the outdated concept of `ScrollFolder` and rely on the file system parameter instead. This makes it easier to build webapps serving dynamic Scroll pages. It also simplifies the upcoming isomorphic release.
⚠️ BREAKING: Only users using Scroll as a module may be affected:
 - Removed `ScrollFolder`. Exports now include `ScrollDiskFileSystem` and `ScrollInMemoryFileSystem`. To get the same behavior as `new ScrollFolder("folder").buildFiles()` use `new ScrollDiskFileSystem().buildFilesInFolder("folder")`.
 - Instead of `new ScrollFolder(__dirname).defaultScrollCompiler` use `DefaultScrollCompiler`
⚠️ BREAKING: Only users using Scroll extensions may be affected:
 - In extensions `compileSnippet` should now be `compileEmbeddedVersion`
 - Instead of `file.folder.folder` use `file.folderPath`
⚠️ BREAKING: Only users using `loop` may be affected:
 - Temporarily renamed `relativeLink` to `linkRelativeToCompileTarget`

📦 62.5.1 3/27/2023
🏥 if something goes wrong in a nodejs block, be sure to clean up the temporary file

📦 62.5.0 3/23/2023
🎉 New parser `canonicalUrl` if you need to include query strings in canonical link.

code
 canonicalUrl https://scroll.pub/tests/maps.html?canonLinkTest=true

📦 62.4.0 3/23/2023
🏥 SEO fix: metaTags now sets canonical link

📦 62.3.0 3/22/2023
🎉 New parser `map` using LeafletJS
 https://leafletjs.com/ LeafletJS

📦 62.2.0 3/15/2023
🎉 Added `copyButtons` parser. Use that to give code blocks a copy-to-clipboard button on hover.

📦 62.1.0 3/13/2023
🎉 Added `nodejs` node for including small node.js scripts inside a Scroll file, similar to a PHP snippet. . The snippet is written to disk and then require is used to run it. Exports variables are then replaced throughout the script.

📦 62.0.1 3/13/2023
🏥 fixes bug when using custom grammars with in memory node types.

📦 62.0.0 3/11/2023
🎉 Support for in memory file systems. Useful for dynamic websites and future web browser versions and versions with url imports.
⚠️ BREAKING: (no one should be affected). `ScrollFolder` constructor now requires an argument. You can now pass an object as a second param to use a virtual filesystem.
⚠️ BREAKING: (no one should be affected). Removed `DefaultScrollCompiler` export. Instead use `new ScrollFolder().defaultScrollCompiler`

📦 61.0.0 3/11/2023
⚠️ BREAKING: (no one should be affected). Removed `buildNeeded` method only used programmatically by PLDB. Switching that to dynamic generation which is a better pattern.

📦 60.0.0 3/10/2023
🎉 Added `quickHtml` node. A line starting with `
 

⚠️ BREAKING: (no one should be affected). The default _catch all_ node will still report as an error but will now behave as if it's a paragraph (`*`) node.

📦 59.6.0 3/10/2023
🎉 Added Horizontal line parser: `---`

---

📦 59.5.0 3/9/2023
🎉 Additional shorter comment syntax: `//`. Previously it was only `comment`

// This comment won't appear in the HTML

📦 59.4.0 3/7/2023
🏥 fix relative links when using snippets from multiple folders
🎉 ability to override the default home link in the default theme

📦 59.3.0 3/6/2023
🏥 CSS fix in default theme so super elements in footnotes don't increase line-height.

📦 59.2.0 3/6/2023
🎉 Default theme change: links are now only underlined on hover.

📦 59.1.0 3/6/2023
🎉 `scroll init` now creates a `.gitignore` file and also runs `git init`.

📦 59.0.0 3/3/2023
🎉 `image` parser now supports `class` and `id` tags
🎉 `class` tag with just a class will now apply to the whole parent element and not insert a span
🏥 fix so image tag works in try.scroll.pub

📦 58.5.1 3/2/2023
🏥 don't compile linkify node to HTML

📦 58.5.0 3/2/2023
🎉 you can now disable linkify on a node.

📦 58.4.0 3/1/2023
🎉 you can now create new loop item providers in extensions by extending `abstractItemsProviderNode`

📦 58.3.1 2/28/2023
🏥 markup directives in indented lists should not compile to anything

📦 58.3.0 2/28/2023
🎉 checklists! use `[]` and `[x]`
🎉 lists `-` are now indentable

## Scroll now has checklists!

[x] Support checklists
 [x] Make them indentable
[] Solve world peace
- Regular Lists are also now indentable
 - This is a subparticle
  - And this is a subsubparticle

📦 58.2.3 2/22/2023
🏥 Windows fix

📦 58.2.2 2/21/2023
🏥 Bug fix

📦 58.2.1 2/21/2023
🏥 fix for empty atoms

📦 58.2.0 2/21/2023
🎉 table nodes now make atoms that are just a link links

📦 58.1.0 2/16/2023
🎉 added `loop` node type:

belowAsCode
loop
 atoms #2a2d34ff #009ddcff #f26430ff #6761a8ff #009b72ff
 javascript `&nbsp;`

📦 58.0.1 2/9/2023
🏥 made `startColumns` clear the section stack. Simpler behavior.

📦 58.0.0 2/9/2023
⚠️ BREAKING: (no one should be affected). `getFullyExpandedFile` is no longer exported. Instead use: `new ScrollFile(undefined, filePath).importResults.code`
⚠️ BREAKING: (no one should be affected). Order of params to `ScrollFile` have changed. `absoluteFilePath` is now param #2, instaed of #3.
🏥 mtime fixes for cache builds.

📦 57.0.1 2/8/2023
🏥 fix permalink regression

📦 57.0.0 2/8/2023
🎉 added support for `css` one liners
 class blueOneLiner
css .blueOneLiner { color: blue;}
aboveAsCode 2

🎉 `title` nodes are now proper aftertext nodes and can use all features of aftertext
🎉 the `hidden` parser can now be used on any aftertext node
🏥 if there is no `permalink` on a file the `title` node won't output an a tag
⚠️ BREAKING: (no one should be affected). If you had put markup directives in your title tags, such as *bolds*, those will now actually be evaluated.
⚠️ BREAKING: `title` blocks now start a section like `#` and `##`, so you may need to add an empty line to end the section, for example if you previously had a `startColumns` right after the title tag.

📦 56.1.0 2/8/2023
🎉 `snippets` nodes can now accept multiple groups and also groups can be in different folders. Syntax is `[folderPath]/[groupName]` For example:

scrollCode
 # The Long Beach Pub
 snippets 2023/index stories/index 2022/index

📦 56.0.1 2/7/2023
🏥 fix bug with images after jtree upgrade

📦 56.0.0 2/7/2023
⚠️ BREAKING: upgraded to `jtree` 66. If you are extending Scroll you may need to migrate extensions.

📦 55.6.0 2/7/2023
🏥 tweaks to improve site created by `scroll init`

📦 55.5.0 1/31/2023
🎉 `aboveAsCode` and `belowAsCode` now take an optional number for showing multiple nodes.
🎉 default list CSS style has been adjusted slightly to move bullets inline.
🎉 New list type: _ordered lists_:
belowAsCode 3
1. One
2. Two
3. Three

📦 55.4.1 1/31/2023
🏥 fix spurious `table` grammar error message

📦 55.4.0 1/30/2023
🎉 added `table` parser which supports custom delimiters:

table
 delimiter &&
 data
  name&&score
  kaia&&400
  pemma&&100
aboveAsCode

📦 55.3.0 1/29/2023
🎉 the `class` aftertext directive now inserts a span across the whole element content if no text search is provided.

css
 .classDemo {color:blue;}
aboveAsCode
belowAsCode
This whole text will be blue.
 class classDemo

📦 55.2.0 1/26/2023
🏥 upgrade jtree

📦 55.1.0 1/20/2023
🎉 added `replaceJs` parser.

📦 55.0.1 1/19/2023
🏥 fix bug where variables were replacing themselves, leading to possible errors.

📦 55.0.0 1/19/2023
🏥 improve detection of piped input.
🏥 improve `youTube` CORS fix to work whether someone includes www.youtube or not.
⚠️ BREAKING: removed `watch` command. `nodemon` can be used for hot reloading. Install with `sudo npm install -g nodemon`. Then run:

bashCode
 nodemon -e scroll -x "scroll build"

Or alias it:

bashCode
 alias watch="nodemon -e scroll -x 'scroll build'"

You can add the following code to the page(s) you are working on to have them reload without manually refreshing the browser:

scrollCode
 html 

📦 54.1.0 1/19/2023
🏥 `scroll init` no longer starts with a `viewSourceBaseUrl`. If not provided then the View Source link is to the scroll file, so new sites don't start with broken links.

📦 54.0.0 1/19/2023
🎉 `link` nodes can now have `target`. This link will open in blank tab.
 https://scroll.pub This link
  target _blank
  title Title can also be set.
aboveAsCode
🎉 `youTube` nodes can now have captions.
🏥 fix: non-embed `youTube` links are converted to proper embed links to fix CORS issues.
⚠️ BREAKING: ~no one should be affected. `scrollImageComponent` CSS class changed to `scrollCaptionedComponent`. If you were overwriting the previous class may need to update.
⚠️ BREAKING: `note` parser under `link` nodes has been renamed to `title` and instead of it being a block just the line is used. This is to better reflect what it does. See example above.

📦 53.0.2 1/18/2023
🏥 fix: `youTube` definition was missing a atom type for url.

📦 53.0.1 1/17/2023
🏥 fix: `redirectTo` definition was missing a atom type for url.

📦 53.0.0 1/17/2023
⚠️ BREAKING: there was undocumented behavior where `*` nodes previously supported multiple lines of text. This now throws an errors. If you need the old behavior you can copy/paste the old node's Grammar code into your project.

📦 52.2.1 1/16/2023
🏥 fix: a `*` node with just a link now works correctly. Previously was rendering blank.

📦 52.2.0 1/13/2023
🎉 `html` now also supports quick oneliners:

belowAsCode
html here is some html

📦 52.1.1 1/12/2023
🏥 fix: getFilesWithTag was including files marked with `importOnly`

📦 52.1.0 1/12/2023
🏥 Upgrade JTree.

📦 52.0.0 1/10/2023
🎉 API usage: new getter `buildNeeded` returns whether the folder needs to be rebuilt. You can use this to skip unnecessary builds for faster perf.
⚠️ BREAKING: This should not break anyone however behavior has changed. `scroll build` now does not overwrite unmodified files. Now `mtime` reflects when the generated HTML last changed instead of when the `scroll build` command was last run. This speeds up `rsync` deploys.

📦 51.0.0 1/9/2023
🎉 This version introduces the concept of `Sections`. Headers (`#`, `##` and `?`) now start a section, and a blank line ends it. A section will not be split across columns.
⚠️ BREAKING: This slightly changes layouts (for the better, hopefully in all cases) so do a manual inspection of output.

📦 50.2.0 1/5/2023
🏥 fix bug where it was trying to get image dimensions of remote images when building
🎉 upgrade jtree to get perf improvements

📦 50.1.0 1/5/2023
🎉 `listCommand` now much faster (~33% in pldb) because `findScrollsInDirRecursive` will now skip `node_modules` folders entirely.

📦 50.0.0 1/4/2023
🎉 made footnotes compile faster
⚠️ BREAKING: simplified footnotes by removing `notes` parser. Referencing a footnote is done the same way but now footnotes just print immediately like you'd expect.

belowAsCode
For example^exampleFootnote

^exampleFootnote This is an example footnote.
aboveAsCode

📦 49.1.0 1/4/2023
🎉 add `viewSource` parser.

📦 49.0.0 1/4/2023
⚠️ BREAKING: renamed `footnote` and `caveat` directives to `hoverNote` to avoid confusion with footnotes.
⚠️ BREAKING: removed `startRuledColumns` which doesn't appear to be used anywhere
🏥 general code cleanup and refactor by splitting big grammar files into separate files.

📦 48.3.0 1/2/2023
🎉 added `youTube` parser for embedding youTube videos with proper responsive sizing.

📦 48.2.0 1/2/2023
🎉 simplify default theme by removing ornamental borders

📦 48.1.0 1/2/2023
🏥 fix: keyboardNav now only cycles through pages with keyboardNav (feed.xml files are excluded, for example)
🏥 fix: previous/next buttons are not shown if there is no keyboardNav

📦 48.0.0 1/1/2023
This release simplifies and removes things from the default install.

⚠️ BREAKING: the `github` parser is now `git` to make it clearer what it does. The git SVG is now used in the default theme.
⚠️ BREAKING: removed `twitter` parser and removed the Twitter link from default theme.
⚠️ BREAKING: `SVGS` is no longer exported.
🎉 Minor style fix of header and switched email SVG with a nice svg from http://laurareen.com

📦 47.4.0 12/30/2022
🎉 rss 2.0 now generated with `printFeed`, meaning pubDate and lastBuildDate are included.

📦 47.3.0 12/29/2022
🎉 upstreamed `stumpNoSnippet` for advanced use case of PLDB until we have better support for custom grammars when using as a library.

📦 47.2.1 12/29/2022
🏥 endColumns nodes should not be printed in snippets

📦 47.2.0 12/29/2022
🎉 added `doNotPrint` class to header and footer elements for better printability.

📦 47.1.2 12/05/2022
🏥 character encoding regression fix.

📦 47.1.1 11/30/2022
🏥 init fixes

📦 47.1.0 11/29/2022
🎉 you can now specify number of max columns in `startColumns` parser
🏥 fixed body padding regression

📦 47.0.0 11/28/2022
This is a major breaking refactor. Scroll now generates flat html. This release is NOT recommended for the feint of heart. Wait a day or two until the bugs are ironed out.

⚠️ BREAKING: removed automatic meta tag generation. You now need to explicitly add a `metaTags` parser.
⚠️ BREAKING: removed ``, ``, ``, and `` tags. Unnecessary. Modern browsers don't need them. HTML never should have had head/body split.
⚠️ BREAKING: removed `SCROLL_CSS` export.

📦 46.2.0 11/27/2022
🏥 `stump` parser works now

📦 46.1.0 11/27/2022
🏥 `scrollCss` works now

📦 46.0.0 11/27/2022
This is a major breaking refactor. *All the implicit imports are gone*. Everything must be explicitly included now (perhaps with a few slight exceptions like meta tags). This migration guide is a work in progress. This release is NOT recommended for the feint of heart. Wait a day or two until the bugs are ironed out.

⚠️ BREAKING: removed `maxColumns` and `columnWidth` and `template`
⚠️ BREAKING: headers and footers are not provided by default. You now must explicitly include them with `scrollHeader` and `scrollFooter`. The previous behavior of `scrollHeader` and `scrollFooter` has been removed.
⚠️ BREAKING: columns are not provided by default. You now need to wrap your content in `startColumns` and `endColumns`.
⚠️ BREAKING: CSS is not included by default. You need to use the snippet parser `scrollCssTag`. The previous behavior of `scrollCss` has been removed. Also `printScrollCss` is now `scrollCss`.

📦 45.0.0 11/24/2022
🎉 a whole new way to do footnotes/end notes.

## Footnotes example

Brockton is a city in Massachusetts^state. It was incorporated in 1881^inc.
 https://en.wikipedia.org/wiki/Brockton,_Massachusetts Brockton

## Notes

^state A state in the United States.

^inc Incorporated as a city in 1881, but as a town in 1821. Wikipedia.
 https://en.wikipedia.org/wiki/Brockton,_Massachusetts Wikipedia

📦 44.0.1 11/24/2022
🏥 fix hidden title bug

📦 44.0.0 11/24/2022
This is the `title` simplification refactor release.
🎉 new: `description` parser for use in open graph description generation.
🎉 new: optional `hidden` parser on `title` nodes for setting `title` without printing it.
⚠️ BREAKING: Group pages no longer have a `title` in their HTML by default. Must set manually.
⚠️ BREAKING: Removed `siteTitle` and `siteDescription` parsers. Those concepts no longer make sense after the introduction of `groups` concept. Generally if you rename `siteTitle` to `title` and `siteDescription` to `description` it should work well.
⚠️ BREAKING: Removed `htmlTitle` parser.

📦 43.1.1 11/22/2022
🏥 fix aftertext bug where `http` quick links were not matching.

📦 43.1.0 11/14/2022
🎉 new: new `SVGS` export when using as a library.

📦 43.0.1 11/14/2022
🏥 list element (`- some item`) compiler was generating an extra `p` tag.

📦 43.0.0 11/12/2022
🎉 New: Linkify! Links like https://breckyunits.com and email addresses like feedback@scroll.pub are now compiled to HTML `a` tags automatically. Note: if an `a` tag is detected in the node Linkify will be DISABLED for that node.
⚠️ BREAKING: (no one should be affected) slim chance linkify may insert links where you previously did not want them.

📦 42.0.0 11/09/2022
⚠️ BREAKING: `scroll check` is now `scroll test`

📦 41.0.0 11/08/2022
⚠️ BREAKING: switched from date format of MM-DD-YYYY to YYYY.MM.DD

regexCode
 search ^# (\d+\.\d+\.\d+) (\d+)\-(\d+)\-(\d+)
 replace # $1 $4.$2.$3

📦 40.0.0 11/05/2022
⚠️ BREAKING: (no one should be affected) `caption` now extends the thought (`*`) node.

blog/screenshot.png
 caption You can now use all aftertext directives like *bold* in caption nodes. Note: in the future we may just remove the parser `caption` and you can just use `*` directly.

📦 39.0.0 11/03/2022
⚠️ BREAKING: `scroll init` no longer creates a `feed.xml` file by default. You can easily add an XML feed manually with the 2 steps below:

code
 comment Add the content below to feed.scroll
 settings.scroll
 permalink feed.xml
 template blank
 printFeed index

code
 comment Add the line below to your posts and/or settings import file.
 rssFeedUrl feed.xml

📦 38.2.0 11/01/2022
🎉 new dayjs aftertext directive.

📦 38.1.0 11/01/2022
🏥 fix group page not having a header.

📦 38.0.0 10/31/2022
🎉 add left and right buttons to default theme.

📦 37.1.1 10/28/2022
🏥 Fixed bad table regression where table content was not printing

📦 37.1.0 10/28/2022
🎉 Documentation improvement

📦 37.0.0 10/28/2022
⚠️ BREAKING: Removed the original `aftertext` node in favor of `*` nodes. Regex [search replace] to upgrade: `^aftertext\n ` `* `
⚠️ BREAKING: Removed basic `paragraph` node. Regex [search replace] to upgrade: `^paragraph\n ` `* `
⚠️ BREAKING: Removed basic `question` node. Regex [search replace] to upgrade: `^question ` `? `
⚠️ BREAKING: Removed basic `section` node. Regex [search replace] to upgrade: `^section ` `# `
⚠️ BREAKING: Removed basic `subsection` node. Regex [search replace] to upgrade: `^subsection ` `## `
⚠️ BREAKING: Removed basic `list` node.
⚠️ BREAKING: Removed basic `orderedList` node.
⚠️ BREAKING: Removed basic `unorderedList` node.
⚠️ BREAKING: Removed support for 🔗 links. Regex [search replace] to upgrade: ` ([^ ]+)🔗([^ ]+)` ` $1`

The goal of this release is to simplify and speed up Scroll by removing legacy features.
This is a major release that removes a bunch of the original parsers in favor of the newer more advanced aftertext nodes.
If you don't want to upgrade at this time, it's very easy to just add the removed grammar definitions from this commit into your existing scrolls using the normal extension pattern.
You can also easily alias the newer aftertext node types with the original parsers above if you'd prefer.

📦 36.1.0 10/27/2022
🎉 Now you can leave the "pattern" part blank in link node in aftertext to make the whole line a link.
🏥 Adjust estimateLines hueristics

📦 36.0.1 10/24/2022
🏥 Fix home icon

📦 36.0.0 10/22/2022
⚠️ BREAKING: simpler CSS and header

📦 35.1.2 10/12/2022
🏥 cleanup previous commit

📦 35.1.1 10/12/2022
🏥 fix duplicated text in `*` nodes bug

📦 35.1.0 10/05/2022
🎉 Added new better way to do lists.
aboveAsCode

📦 35.0.0 10/04/2022
⚠️ BREAKING: (no one should be affected) changed return value of api method `findScrollsInDirRecursive`.

📦 34.2.0 10/03/2022
🎉 add `redirectTo` tag

📦 34.1.0 10/02/2022
🎉 had an idea for a new type of text tag that blinks

📦 34.0.3 9/30/2022
🏥 Fix github workflow building.

📦 34.0.2 9/30/2022
🏥 !

📦 34.0.1 9/30/2022
🏥 test fix

📦 34.0.0 9/30/2022
🎉 add support for recursive building and checking using pipes! `scroll list | scroll build`
⚠️ BREAKING: (no one should be affected) renamed `execute` method on ScrollCli class to `executeUsersInstructionsFromShell`

📦 33.1.0 9/29/2022
🎉 remove extraneous atoms and lines printing in CLI

📦 33.0.0 9/29/2022
⚠️ BREAKING: (no one should be affected) removed "migrate" command. was more trouble than it was worth. better to have that as a separate module.
⚠️ BREAKING: (no one should be affected) `where` command is now `list`

📦 32.0.0 9/27/2022
🎉 improved 'where' command to scan pwd and skip node_modules folders. much faster and simpler.

📦 31.5.0 9/9/2022
🎉 new parsers: `?`, `#` and `##`

# A Header

## A Subheader

? Have you thought of the most important question?

📦 31.4.1 9/3/2022
🏥 and that is why you always run the tests.

📦 31.4.0 9/3/2022
🎉 New parsers: `*`, `footnote`, and `readingList`

* This is a _thought_. It's like a condensed form of aftertext with *bold* and _italics_ and `code` turned on by default.
 hoverNote default
  And it supports hover notes!
aboveAsCode

📦 31.3.0 9/3/2022
🏥 Fixed bad regression where only the first atom of a replacement line was getting replaced.

📦 31.2.0 9/2/2022
🎉 added `openGraphImage` node

📦 31.1.0 9/1/2022
🎉 `replace` now supports multiline strings
🏥 fixed broken links bug if using keyboard nav without groups

📦 31.0.0 8/31/2022
⚠️ BREAKING: upgraded to jtree 56. This is not likely to break anyone. However, if you are extending Scroll with your own nodeTypes you will need to make sure that your abstract nodes (and *only* your abstract nodes) have an id that begins with `abstract`. You can then remove all occurrences of the parser `abstract` from your grammar node definitions.

📦 30.1.1 8/30/2022
🎉 Improve header message thanks to dg's feedback

📦 30.1.0 8/29/2022
🎉 Perf: ~2x as fast as v30.1

📦 30.0.0 8/29/2022
🎉 Perf: ~2x as fast as v29
⚠️ BREAKING: If using `getFullyExpandedFile(str)` replace with `getFullyExpandedFile(str).code`
⚠️ BREAKING: If using any ScrollFile programatically, a few undocumented getters may have changed.

📦 29.0.0 8/28/2022
⚠️ BREAKING: if using programatically instead of ScrollPage use ScrollFile

📦 28.3.2 8/27/2022
🏥 fixed bug with open graph image tags

📦 28.3.1 8/27/2022
🏥 fixed minor grammar typo and added test

📦 28.3.0 8/27/2022
🎉 added `author` and `kpiTable` node types

📦 28.2.0 8/26/2022
🏥 export getFullyExpandedFile

📦 28.1.0 8/26/2022
🏥 imports can now be recursive

📦 28.0.0 8/26/2022
This is a *major* update that radically simplifies Scroll and adds significant new capabilities.

## From 3 file types to 1

`scroll.settings` and `*.grammar` files are gone. Everything is now done with `.scroll` files, and now every parser is documented and usable on try.scroll.com and type checked.

## Imports and variables

Use `[filepath]` to import one scroll file into another. Use `replace` and `replaceDefault` for variables.

## Add your own Grammar extensions directly in your Scroll files

Define new nodeTypes or create your own aliases on a per file basis. Use the import parser and build your own collection of common reusable node types for your project(s).

## Unlimited Tags and Tag Pages

Add files to one or more tags and then customize how each tag page prints. No more magic or implicit creation of collection pages.

## Multiple Compiler Passes

The new language features (imports, grammar nodes, and variables) required a change from a 1 one stage compilation process to a multi-stage compiler pass pattern. The compilers passes run in this order: imports, grammar extensions, then variables. So variables cannot be used in imports or grammar extensions.

## Change list

⚠️ BREAKING: The `git` setting is renamed to `viewSourceBaseUrl`
⚠️ BREAKING: The `sourceLink` setting is renamed to `viewSourceUrl`
⚠️ BREAKING: removed `skipIndexPage`. Instead you now opt-in to group pages like this: `groups index.html`
⚠️ BREAKING: removed `scroll.settings` concept. Use `settings.scroll` now.
⚠️ BREAKING: `footer` is now `scrollFooter` and `header` is now `scrollHeader`
⚠️ BREAKING: removed `ignoreGrammarFiles`. Custom grammar extensions must now be explicitly imported and/or be in `.scroll` files.
⚠️ BREAKING: changed link text from "Article source" to "View source"
⚠️ BREAKING: `css` setting is now `scrollCss`
⚠️ BREAKING: DefaultScrollScriptCompiler is now DefaultScrollCompiler
⚠️ BREAKING: removed buildSinglePages, buildIndexPage, buildSnippetsPage, buildRssFeed, and buildCssFile. Everything done by `buildFiles` now. See 'full.scroll', `index.scroll`, `feed.scroll`, and `style.scroll` in `tests/kitchenSink` for how to implement those in new pattern.
⚠️ BREAKING: in default theme CSS some class names have changed:

code
 scrollArticleDateComponent => scrollDateComponent
 scrollArticlePageComponent => scrollFilePageComponent
 scrollSingleArticleTitle => scrollFilePageTitle
 scrollIndexPageArticleContainerComponent => scrollGroupPageFileContainerComponent
 scrollArticleSourceLinkComponent => scrollFileViewSourceUrlComponent
 scrollIndexPageComponent => scrollGroupPageComponent
 scrollIndexPageFileContainerComponent => scrollGroupPageFileContainerComponent

⚠️ just calling ScrollScript Scroll again unless it becomes confusing
🎉 keyboardNav will now use the first group a file belongs to if prev and next are not supplied

## Updating custom CSS

code
 comment Put this in a file named style.scroll
 buildCss style.css
 gazetteCSS

📦 27.1.1 8/24/2022
🏥 only activate keyboard shortcuts if no element has focus

📦 27.1.0 8/24/2022
🎉 added new cli command: `scroll where`

📦 27.0.1 8/23/2022
🏥 mutability fix

📦 27.0.0 8/23/2022
🎉 added `keyboardNav` node
⚠️ BREAKING: all `permalink` lines in `.scroll` files need `.html`. Run `scroll migrate` to find and update automatically.

📦 26.1.0 8/23/2022
🎉 export SCROLL_CSS for tryscroll app
⚠️ now calling the language ScrollScript instead of Scrolldown

📦 26.0.0 8/23/2022
⚠️ (potentially) breaking: scrolldown.grammar is no longer built/checked in and SCROLLDOWN_GRAMMAR_FILENAME no longer exported.

📦 25.6.0 8/19/2022
🎉 simpler API for programmatic usage: `new ScrollPage('title Hello world')`

📦 25.5.1 7/22/2022
🏥 minor grammar fix

📦 25.5.0 7/22/2022
🏥 path fixes for Windows thanks to @celtic-coder

📦 25.4.0 7/14/2022
🎉 50% faster builds

📦 25.3.2 7/14/2022
🎉 added cacheing for 40% faster builds

📦 25.3.1 7/14/2022
🏥 fixed links in treeTable

📦 25.3.0 7/14/2022
🎉 added `treeTable`

belowAsCode
table
 delimiter particles
 printTable
 data
  row
   name Javascript
   example
    console.log("Hello world")
  row
   name Python
   example
    # A code block
    print "Hello world"

📦 25.2.1 7/01/2022
🏥 fixed broken links in feed.xml

📦 25.2.0 6/22/2022
🎉 added `htmlTitle` and `sourceLink` parsers so an article can override the defaults

📦 25.1.0 6/19/2022
🎉 if scroll has an rss feed add a  tag to built pages

📦 25.0.0 6/15/2022
⚠️ on single article pages, the header will now span across all columns.

📦 24.9.0 6/15/2022
🎉 added "css" setting. Set `css split` to write CSS to `scroll.css` instead of inline, or `css none` to not generate CSS.
🏥 removed extra blank lines in snippets.html generation

📦 24.8.0 6/15/2022
🎉 if "baseUrl" is set building will also generate an RSS "feed.xml"

📦 24.7.0 6/13/2022
🏥 fix when using Scroll programmatically image sizeOf check will use correct folder
🎉 add param to specify index/snippets page when using programmatically

📦 24.6.0 6/10/2022
🎉 added `wrap` parser for advanced custom wraps in aftertext.

Some !simple! and *advanced* usages. An #absolute link# and @@@a relative link@@@. Show some ++added text++ or some --deleted text--.
 inlineMarkup ! em
 inlineMarkup * b
 inlineMarkup # a href="https://example.com"
 inlineMarkup @@@ a href="potato.html"
 inlineMarkup ++ span style="color:green"
 inlineMarkup -- span style="color:red; text-decoration: line-through;"
aboveAsCode

📦 24.5.0 6/10/2022
🎉 added `wrapsOn` parser to aftertext.

Support for traditional *bold*, `code`, and _italics_ in aftertext with the parser `wrapsOn`.
aboveAsCode

📦 24.4.0 6/08/2022
🎉 if your scroll has an article(s) with "endSnippet", scroll will create "snippets.html".

📦 24.3.1 5/25/2022
🏥 fix bug where images were stuck at 35ch even when the browser sized columns wider

📦 24.3.0 2/16/2022
This tiny release adds some ways to include more caveats and context around atoms and references.
🎉 added 'caveat' directive to aftertext for adding caveats around parts of text
🎉 added 'note' directive to aftertext links for providing more context around included links

## Caveat Example

This is a great idea.
 hoverNote great
  I'm not actually sure if this is a great idea. But often I want to include a comment and link it
  back to the text, but don't quite want to footnote it.
aboveAsCode

## Link Quote Example

This report showed the treatment had a big impact.
 https://example.com/report This report
  title The average growth in the treatment group was 14.2x higher than the control group.
aboveAsCode

📦 24.2.0 1/18/2022
🎉 added 'id' directive to aftertext for adding ids to paragraphs 
🎉 added 'loremIpsum' nodeType to help in testing and exploring

Example demonstrating the above:

code
 aftertext
  Click here to go to the middle paragraph.
  link #middleParagraph Click here
 
 loremIpsum 20
 
 aftertext
  Here is the middle paragraph.
  id middleParagraph
 
 loremIpsum 20

📦 24.1.1 1/13/2022
🏥 fix bug where migrator was not replacing 🔗 links in paragraphs when upgrading to aftertext
🏥 fix typo in release notes

📦 24.1.0 1/13/2022
🎉 added migrate command to automate migrations when there are breaking changes
🎨 added background color and styling to inline code elements in default theme

📦 24.0.0 1/11/2022
🎉 if a table has a column name ending in "Link", that will be used to link the matching column. See example below.
⚠️ if you have tables with a column ending in "Link" beware the new behavior

belowAsCode
table
 delimiter |
 printTable
 data
  name|nameLink
  Wikipedia|https://wikipedia.org

⚠️ the first paragraph of an article no longer prints a dateline. Use aftertext instead. See example below.

By default the article's date will be used but you can also provide a custom date.

belowAsCode
A truck transporting llamas collided into a pajama factory late last night.
 dateline 2/21/2020

To migrate and keep your existing datelines use the command scroll migrate.
 code scroll migrate

📦 23.2.0 12/22/2021
🎉 add "matchAll" and "match" support to aftertext for more advanced matching options
🎉 add "class" markup directive to aftertext
🎉 add "css" node for easier insertion of CSS
🏥 fix bug in aftertext when 2 tags started at same index
🏥 make basic dateline work in browser

? Can you show an example of the new advanced aftertext features?

How much wood can a woodchuck chuck if a woodchuck could chuck wood?
 https://en.wikipedia.org/wiki/Groundhog woodchuck
  matchAll
 class standout wood
  match 0 3
aboveAsCode

css
 .standout {
  background-color: yellow;
  border: 1px dashed red;
  padding: 5px;
 }
aboveAsCode

📦 23.1.0 12/21/2021
🎉 add dateline node to aftertext.

📦 23.0.0 12/09/2021
🎉 add aftertext node type, with bold, italics, underline, link (& quick link), email, code and strikethrough parsers
🎉 add belowAsCode and aboveAsCode
🎉 split base grammar into files for easier extensibility

? Can you show an example of aftertext?

You write some text. After your text, you add your markup instructions with selectors to select the text to markup, one command per line. For example, this paragraph is written in Aftertext and the source code looks like:
 italics After your text
 italics selectors
aboveAsCode

📦 22.4.0 11/25/2021
🎉 add basic caption support to images

blog/screenshot.png
 caption This is a caption
aboveAsCode

📦 22.3.0 08/23/2021
🎉 columnWidth to set a custom column width per article or folder
🎉 maxColumns can be set globally in settings

📦 22.2.0 08/23/2021
🎉 integrated design feedback into default theme for better readability

📦 22.1.0 07/23/2021
🏥 you can now ignore custom grammar files in a dir with ignoreGrammarFiles

📦 22.0.0 07/09/2021
🎉 scroll.settings file is now optional and you can use scroll to build a single page.
🎉 you can now set 'header' and/or 'footer' on articles.

📦 21.4.0 07/08/2021
🎉 you can now set 'maxColumns' on articles.

📦 21.3.0 07/07/2021
🎉 if all articles have 'skipIndexPage', 'index.html' will not be built

📦 21.2.0 07/06/2021
⚠️ internal CSS changes

📦 21.0.0 06/21/2021
🎉 built in support for custom grammars!
⚠️ internal nodejs API changes: Article is no longer exported and ScrollBuilder is now ScrollFolder

📦 20.0.0 06/21/2021
🎉 new question nodetype. Simply compiles to an h4 for now but more semantic this way.
🎉 new section nodetype. Simply compiles to an h3 for now but more semantic this way.
🎉 new subsection nodetype. Simply compiles to an h4 for now but more semantic this way.
⚠️ title2-title6 have been removed. use question, section and subsection instead.

? Why the new `question` nodes?

Question and answer structures are literally older than the Socratic Method. Such a common semantic pattern deserves it's own parsers.

? How do I migrate from title# nodes?

The below regex may help.

code
 Find ^title\d (.+\?)
  ReplaceWith question $1
 Find ^title\d (.+)
  ReplaceWith section $1

📦 19.3.1 06/20/2021
🎉 show the version in footer
🏥 fix title in single pages without a title

📦 19.3.0 06/20/2021
🏥 fix bug where readme.scroll could be overwritten by init

📦 19.2.0 06/17/2021
🎉 improved styling for tables

📦 19.1.0 06/17/2021
🏥 fix bug with http links
🏥 simpler article padding and changed scroll title to h2 from h1

📦 19.0.0 06/17/2021
🎉 ability to override header and footer

📦 18.4.0 06/17/2021
🏥 improved alignment of images

📦 18.3.0 06/16/2021
🎉 og meta tags for social media sharing

📦 18.2.0 06/16/2021
🏥 title now links to "index.html". less magic and works much better locally

📦 18.1.1 06/16/2021
🏥 fix regression where 2 columns on mobile were not downsizing to 1

📦 18.1.0 06/16/2021
🎉 short articles now are put into 1 or 2 columns

📦 18.0.0 06/15/2021
🎉 build is now ~46% faster
🏥 refactored html generation in preparation for easier extending and theming

📦 17.5.0 06/05/2021
🏥 fixed numerous bugs in importing RSS feeds and added examples

📦 17.4.0 06/04/2021
🎉 typography adjustments
🏥 fixed overlapping social icons up top on mobile. just keep git link

📦 17.3.0 06/03/2021
🎉 images now link to the full size image

📦 17.2.2 06/02/2021
🏥 fixed safari-only bug not painting overflowing code blocks on single pages

📦 17.2.1 05/25/2021
🏥 fixed bug where sequential links were not getting parsed

📦 17.2.0 05/25/2021
🏥 tables can now break on single pages for higher information density

📦 17.1.0 05/25/2021
🎉 pipeTable

table
 delimiter |
 printTable
 data
  what|why
  PipeTable|Because it's awesome!

📦 17.0.0 05/25/2021
🎉 tabTable and commaTable
⚠️ table is now spaceTable
🏥 do not crash if an empty row in a table

📦 16.2.0 05/24/2021
🏥 do not crash if an image is not found

📦 16.1.0 05/24/2021
🎉 building a site is now ~2.4x faster 🏎

📦 16.0.0 05/22/2021
⚠️ rename scrollSettings.map to scroll.settings

📦 15.0.0 05/21/2021
🎉 Scroll will detect and emit image sizes during build to reduce layout shifts.

📦 14.3.0 05/21/2021
🏥 Scroll is now somewhat usable as an NPM module.

📦 14.2.0 05/20/2021
🏥 added html head meta viewport tag for better mobile experience.

📦 14.1.0 05/20/2021
🏥 added doctype tag
🏥 added html head meta description tag

📦 14.0.0 05/19/2021
⚠️ removed links nodeType
⚠️ fixed bug where sometimes permalinks were still using title and not filename

📦 13.3.0 05/18/2021
🎉 html and image node types

To use an image node:

code
 image foo.jpg

QuickParagraphs are now an error. When you want to drop in some HTML, do so with HTML node:

code
 html
  anything goes here

📦 13.2.0 05/18/2021
🎉 Added scroll check command

📦 13.1.0 05/18/2021
🎉 🔗links in lists as well as paragraphs

📦 13.0.0 05/17/2021
🎉 🔗links in paragraph nodes.
🎉 skipIndexPage nodeType

? How do I use the new single atom links?

For single atom links in paragraph nodes only (for now) you can now do:

code
 paragraph
  This is a link🔗example.com

Below is a regex for migrating existing *.scroll files.

code
 ([^ ]+)
 $2🔗$1

? How do I use the 🔗link tag with multiatom links?

The 🔗link tag only supports single atom links. Like everything with ScrollScript, you have a number of options if the conventional design doesn't work for you. Your options are:

- 1. Link just one atom. If you need more, perhaps camelCase or snake_case your atoms together into one concept.
- 2. Repeat the link twice foo 🔗link bar 🔗link
- 3. Use &lt;a> tags.
- 4. Extend the ScrollScript grammar for your site.

? Can I not include a page in the index page?
Now you can! Sometimes you just want to publish an independent page without including it in the index. To do that, just add `skipIndexPage`.

📦 12.1.0 05/14/2021
🎉 chat nodeType

chat
 You can now do dialogues
 Cool!

📦 12.0.0 05/12/2021
⚠️ scroll create is now scroll init
⚠️ Removed export command
🏥 removed example.com folder. Less code and now flat.

📦 11.0.0 05/11/2021
🎉 list, orderedList, and links node types
🎉 codeWithLanguageNode
🏥 HTML escaped in code blocks

📦 10.0.0 05/10/2021
🎉 table nodeType for SSVs with linkify
🎉 Better docs in ScrollScript grammar
⚠️ Removed list nodeType
⚠️ Removed link nodeType
🏥 Windows return character fix
🏥 multiline support in subheader nodeTypes

📦 9.0.0 05/05/2021
🎉 ScrollScript now has a quote nodeType.
🏥 Code block format bug fixes.
🏥 Styling improvements

📦 8.0.0 04/10/2021
🎉 Scroll now just builds files. No web server needed.

📦 7.0.0 04/03/2021
⚠️ Scroll the language is now called Scrolldown (thanks FB!).
🏥 Bug fixes.
🎉 Better perf.

📦 6.0.0 03/08/2021
🎉 By popular request, Scroll now also publishes each article to its own page.
🎉 Fewer links. Do less. KISS.
🎉 Better perf.
🎉 "permalink" nodeType

📦 5.0.0 02/28/2021
🎉 Changed name of everything from dumbdown to Scroll per user feedback
⚠️ File extension of articles needs to be "scroll" and not "dd" now.

📦 4.2.0 02/22/2021
🏥 Fixed paragraph parsing and rendering

📦 4.1.0 02/22/2021
🎉 "git" scrollSetting for article source links.

endColumns

footer.scroll

```
```faq.scroll
replace ParsersLinks Parsers
replace ParticlesLinked Particles
title Scroll FAQ
linkTitle FAQ

header.scroll
printTitle
nav.scroll

## A list of Frequently Asked Questions

thinColumns

Have a question not answered here? Email feedback@scroll.pub.

? Any more docs?
- Tutorial
 tutorial.html
- Roadmap
 roadmap.html

? What can I build with Scroll?

### Blogs
Scroll powers an ever increasing number of blogs like this one.
 blog/index.html this one

blog/screenshot.png
 width 200
 float right
 link https://breckyunits.com/
 caption This screenshot is from a blog powered by Scroll.
  https://breckyunits.com/ a blog powered by Scroll

### Knowledge Bases
Scroll powers PLDB, a knowledge base with over 100 contributors who have added over 100,000 atoms of structured data and thousands of pages.
 https://pldb.io PLDB

### Static Sites
This site you are reading is powered by Scroll.
 index.html This site

? What makes Scroll different?
Scroll has an unusually simple syntax called Particles, an extensive set of parsers and commands needed by researchers, bloggers, knowledge bases and sites of all sizes, is highly expandable, and is familiar to anyone who knows Markdown.

? What is the Scroll command line app?
The command line app builds static blogs, websites, CSVs, text files, and more.
 blog/textFiles.html text files
 blog/scrollsets.html CSVs
 blog/index.html static blogs
 index.html websites

? How do I install the command line app?
Scroll currently requires Node.js.
 https://nodejs.org/ Node.js
After Node.js is installed, install the npm package with:
 https://www.npmjs.com/package/scroll-cli npm package
code
 npm install -g scroll-cli

? How do I install the developer version?
code
 git clone https://github.com/breck7/scroll.git
 cd scroll
 npm install -g .
 npm test

? How do I run the CLI?
code
 scroll help

? Is Scroll open source?
Yes. Breck's Lab publishes Scroll to the public domain.
 https://breckyunits.com/lab.html Breck's Lab

The source code is hosted on GitHub.
 https://github.com/breck7/scroll source code

? Is there an official blog for the project?
Yes.
 link blog/ Yes

? Who is Scroll for?
Scroll is built for bloggers who appreciate writing, minimal, well designed tools for thoughts, open source, git backed static site generators, and fast simple code.

? What makes Scroll different?
Scroll is different than other static site generators because it is also *an extendible language*.
 https://staticsitegenerators.net other static site generators

The basics of Scroll are even simpler than Markdown. For example, you can make a whole paragraph a link like this:

This is a link
 https://scroll.pub
aboveAsCode

You can stick to the basics or define new parsers to extend Scroll to better fit your content and workflows.

Your parsers can be simple or as complex as any programming language, and a simple indent is all you need to make sure your parser won't interfere with other parsers.

Parsers in Scroll are written in a mini language called ParsersLinks and both Scroll and Parsers are built on the syntax called ParticlesLinked.

? How does Scroll improve over the latest incarnations of Markdown?
Scroll evolved based on the theory that instead of a fixed language for blogging it is better to have an ever evolving ecosystem of parsers, so that your symbolic tools can grow along with your mental tools.

Thus, Scroll is designed to be easy to extend.

You can see this in the Scroll source code.

Scroll is a collection of ParsersLinks and there are currently dozens of `.parsers` files in the base distribution.

Each Parser can define a mini language of its own. You can simply add (or remove) Parsers to generate your own custom dialects to better fit your domains.

Think of it as one file, many languages.

Altering traditional languages in this fashion would lead to chaos, but Scroll does it in a stable and scalable way by making the most of the indent trick (also known as the off-side rule). Each line gets its own scope. So you can add, remove, and update your microlanguages and their associated blocks without breaking the rest of the documents.
 https://en.wikipedia.org/wiki/Off-side_rule off-side rule

In Scroll, it's almost as if each line is its own file.

? How do I extend Scroll?
Imagine you run a cooking blog where you share recipes. It may be useful to present recipes to your readers in a specialized style. You could create a _recipe_ parser and write a post like this:
code
 # McCarthy Salad
  https://www.dorchestercollection.com/the-edit/los-angeles/our-famous-mccarthy-salad-recipe
 
 recipe
  ingredients For salad
   ¼ head iceberg lettuce
   ½ head romaine lettuce
   ½ cup diced, grilled free-range chicken
   ½ cup diced, roasted red beets
   ¼ cup free-range egg yolk
   ¼ cup free-range egg white
   ½ cup finely diced aged cheddar cheese
   ½ cup applewood-smoked bacon
   ¼ cup diced tomato
   ¼ cup diced avocado
  step Dice ingredients.
  step Artfully arrange the salad ingredients in a bowl.
  ingredients For salad dressing
   1 cup balsamic vinegar
   1 shallot
   3 cloves roasted garlic
   1 teaspoon Dijon mustard
   Salt and black pepper to season
   Canola oil
  step Place the dressing ingredients in a blender and drizzle in the canola oil to emulsify.
  step Combine and mix salad and dressing!
  step Enjoy!
Notice that your post uses the first atom `recipe`, but Scroll does not have a parser for that. No problem, just write a recipe parser yourself using ParsersLinks, extending your dialect of Scroll:
code
 recipeParser
  extends abstractScrollParser
  cue recipe
  javascript
   buildHtml() {
     const addYourSpecialMagic = ""
     return `${addYourSpecialMagic}`
   }
Your extension might generate beautiful custom HTML for that recipe section and also perhaps allow users to vote on it, or include it in a CSV export, et cetera. Scroll let's you combine microlanguages in a simple and non-conflicting way. What you do with those languages is up to you.
For an extended example of extending Scroll check out this one which adds node types for Markdown, Textile, and BBCode.
 https://scroll.pub/blog/indented-heredocs.html one

? What is the biggest downside to Scroll?
Compared to Markdown there is very little tooling and the ecosystem is currently very small.
Also, although it is simple to write your own parsers in ParsersLinks once you know what you're doing, documentation for ParsersLinks is still poor and tooling isn't great yet.

? What kind of sites can I use Scroll to build?
Scroll is a great solution for blogs and sites of one page, a few pages, tens of pages, hundreds of pages, or even thousands of pages.
 https://scroll.pub one page
 https://scroll.pub/blog/ a few pages
 https://breckyunits.com/code/ tens of pages
 https://breckyunits.com/ hundreds of pages
 https://pldb.io/ thousands of pages

? How do I get Scroll?
Scroll is a language and command line app you install on your local machine. Scroll requires basic familiarity with the command line and NodeJs >=18. If you do not have NodeJs, Mac/Linux users can install NodeJs with #n# (make sure to install with `--arch arm64` flag for M1s+) and Windows users can install NodeJs with Scoop.
 https://nodejs.org NodeJs
 inlineMarkup # https://github.com/tj/n
 https://scoop.sh/ Scoop
If you would like to use Scroll but aren't familiar with the command line, please open an issue and we may be able to help.
Once you have NodeJs installed you can install from GitHub or npm. Scroll is scroll-cli on npm.
 https://www.npmjs.com/package/scroll-cli scroll-cli
You can install from GitHub:
code
 git clone https://github.com/breck7/scroll
 cd scroll
 npm install -g .
Or you can install Scroll with npm by typing:
code
 npm install -g scroll-cli --production

One way to try the Scroll command line app without installing is with GitPod.
 https://gitpod.io/#https://github.com/breck7/scroll GitPod

? How do I use Scroll?
Scroll is a command line app. To see the commands type:
code
 scroll help

? Where do I get help?
Post an issue in this GitHub or email us.
 email feedback@scroll.pub us

? What are some example sites using Scroll?
Scroll currently powers blog and sites of one page, a few pages, tens of pages, hundreds of pages, and even thousands of pages.
 https://scroll.pub one page
 https://scroll.pub/blog/ a few pages
 https://breckyunits.com/code/ tens of pages
 https://breckyunits.com/ hundreds of pages
 https://pldb.io/ thousands of pages

? What does a typical project folder look like?
A typical Scroll project folder, excluding the files built by Scroll, looks like this:
code
 📁yourDomainName.org
  about.scroll
  helloWorld.scroll
  index.scroll
  header.scroll
  footer.scroll
  anImageInTheArticle.png
When you run `scroll build`, Scroll reads those files and generates the outputs right in that site's folder.
With Scroll your site's Scroll files and static files and generated html are all in one public folder and checked into version control. Usually you want to add `*.html` and `feed.xml` to your `.gitignore`.

? How do I save drafts?
Have a drafts folder next to your published scroll. For example:
code
 📁drafts
  someDraft.scroll
 📁yourDomainName.org
  publishedArticle.scroll

? What file formats does Scroll use?
Scroll articles are written as Scroll files with the file extension scroll. The current base parsers for Scroll are defined here.
 code scroll
 https://github.com/breck7/scroll/tree/main/parsers here

? What language is Scroll written in?
Scroll is written in Particles, ParsersLinks, and Javascript. The Scroll CLI app is written in plain Javascript and runs in Node.js. Scroll also uses a few other microlangs written in Parsers. The CSS for the default theme _Gazette_ is written in Hakon. The HTML is written in stump.
 https://sdk.scroll.pub/designer/#standard%20hakon Hakon
 https://sdk.scroll.pub/designer/#standard%20stump stump
TypeScript is not used in the Scroll repo and because the Javascript is only ~1kloc that likely will not be necessary.

? How does versioning of articles work?
Scroll is designed for git. A single article is stored as a single file tracked by git.

? When I run `scroll format` in what order are particles sorted?
The rough order is:
code
 [importOnly?]
 [topMatter*]
 [measurements*]
 [everythingElse*]

? Is Scroll public domain?
Yes! Scroll is also 100% focused on helping people build internal or *public domain sites* and everything is designed with that assumption.

? Why does the default theme have a single page layout?
The default Scroll theme is designed to make it easier for syntopic reading. Being able to scan the page like a newspaper. This allows you to read at a higher level—to "get in the author's head"—compared to reading one article at a time from beginning to end.
 https://fs.blog/how-to-read-a-book syntopic reading
And if anyone prefers to read a scroll in a different way—they can! Scroll is for public domain sites. People are free to arrange the symbols any way they wish.

? Will you make design decisions for non-public domain sites?
No.

? Can I use Scroll for internal private sites not intended for publishing?
Yes!

? In the single page layout why don't you have only the newest articles above the fold?
This was originally a bug. But then it turns out to be a feature, as it gives older articles, which are often more important, more visibility.

? How do I recursively build multiple scrolls in child folders?
code
 scroll list | scroll build

? What's an easy way to have GitHub run Scroll and build my HTML files automatically?
Go to your project folder and create the file below:
code
 mkdir -p .github/workflows
 touch .github/workflows/wws.yaml
Then open that file and paste in this code:
code
 # Adapted from https://github.com/JamesIves/github-pages-deploy-action
 name: Build and Deploy Scroll
 on:
   push:
     branches:
       - main
 jobs:
   build-and-deploy:
     runs-on: ubuntu-latest
     steps:
       - name: Checkout 🛎️
         uses: actions/checkout@v2.3.1
       - name: Install and Build
         run: |
           npm install -g scroll-cli --production
           scroll build
           # The line below is needed if you have *.html in your gitignore file
           rm .gitignore
       - name: Deploy 🚀
         uses: JamesIves/github-pages-deploy-action@4.1.4
         with:
           branch: wws # The branch the action should deploy to.
           folder: .
Commit and push. Now go to your GitHub Repo and then Settings, then Pages, and select the wws branch as the Source for the pages. Click save. Your built site should be live.
 code Settings
 code Pages
 code wws

? How do I setup a custom 404 page with GitHub pages?
Check out the `404.scroll` file in this folder.

GitHub has instructions but is really is as simple as this:
 https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site instructions

? How do I check for broken links?
Scroll does not check for broken links. For that, try linkinator.
 https://github.com/JustinBeckwith/linkinator linkinator
code
 # npm install -g linkinator
 linkinator https://scroll.pub > brokenLinks.txt

? How do I check browser performance?
Scroll does not have browser perf tools built in. For that, try lighthouse.
 https://github.com/GoogleChrome/lighthouse lighthouse
code
 # npm install -g lighthouse
 lighthouse https://scroll.pub --output-path scrollBrowserPerf.html; open scrollBrowserPerf.html

? Where should I host my site?
Any web server works. You can even host your scroll for free using GitHub Pages, just like this site.
 https://pages.github.com GitHub Pages

? How do I use Scroll with a custom domain?
Just buy a domain and point it to your web server or web host (such as GitHub Pages). Google Domains is where this domain is registered and is a great service.
 https://domains.google Google Domains

? How can I deploy my site?
If you have your own web server try rsync. Here's a bash one liner:
code
 # deploy.sh
 # swap "/var/www/html" with the path to your website's location on your web server
 rsync -vr /[path/to/your/site]/* [yourdomain.com]:/var/www/html
Add a section like the one below to your ~.ssh/config to save your username and correct key pair.
 https://unix.stackexchange.com/questions/494483/specifying-an-identityfile-with-ssh section
code
 Host example.com
   User yourUserName
   IdentityFile ~/.ssh/example_id_rsa
   IdentitiesOnly yes

? Does Scroll compile to plain text as well as HTML?
Yes! Support for plain text outputs as added in April, 2024.
 https://scroll.pub/blog/textFiles.html

? How can I output my Scroll to an EPUB file?
Pandoc is one way to do it. If you are on a Mac and have Homebrew installed:
 https://brew.sh Homebrew
code
 brew install pandoc
 pandoc index.html -o book.epub

? How can I do hot reloading?
Scroll does not come with hot reloading but you can easily set it up with `nodemon`. Install `nodemon` with `sudo npm install -g nodemon`. Then run:
bashCode
 nodemon -e scroll -x "scroll build"
Or alias it:
bashCode
 alias watch="nodemon -e scroll -x 'scroll build'"
You can also add the following code to the page(s) you are working on to have them reload without manually refreshing the browser:
scrollCode
 html 

? How can I track web traffic?
Scroll emits HTML with zero Javascript and does not have any tracking or cookies. You can easily add your own tracking tag if you want.

If you are self hosting using a web server like Nginx you might have some access logs on your server. The one liner below uses GoAccess to summarize recent Nginx access logs.
 https://goaccess.io GoAccess
code
 # apt-get install goaccess
 goaccess /var/log/nginx/access.log -o /var/www/html/YOUR_SECRET_REPORT_URL.html --log-format=COMBINED --real-time-html --ws-url=wss://YOURDOMAIN.com

? Does Scroll support RSS?
Yes! Just create a `feed.scroll` file like this.
 https://github.com/breck7/scroll/blob/main/blog/feed.scroll this

? Does Scroll support tags?
Yes! Add tags to a post using the `tags` parser. Then create a `yourTagName.scroll` file to create a category page for that tag. See a demo here.
 https://github.com/breck7/scroll/blob/main/blog/index.scroll here

? Does Scroll support Open Graph tags for better social media sharing?
Yes. By default the first image and first paragraph of an article will be used for the "og:" tags. Unfortunately Twitter doesn't support relative image links so you need to specify `baseUrl`. For more help check out the debuggers from Facebook and X or try LinkPreview.
 https://developers.facebook.com/tools/debug Facebook
 https://cards-dev.twitter.com/validator X
 https://linkpreview.xyz/ LinkPreview

? Does Scroll support themes and templates?
Yes! Scroll includes a simple API for changing the style of your site. This is an active area of development so please reach out if you'd like to customize the look of your Scroll.

? How can I build a scroll from a Twitter account?
Hopefully someone will build a package or site that does this. For now, on your Twitter settings, download an archive of your data and convert the tweets JSON into scroll files. Or to experiment faster use this tool to grab some tweets as a TSV.
 https://www.vicinitas.io/free-tools/download-user-tweets tool

? What were some alternatives considered?
There was no publishing software that reads and writes Scroll yet so building Scroll was necessary. Jekyll and Brecksblog were the two biggest inspirations.
 https://jekyllrb.com Jekyll
 https://github.com/breck7/brecksblog Brecksblog

# Contributing to Scroll development
? How do I contribute?
File issues. Share your Scroll sites.
You can submit pull requests too. The shorter the better.

? How do I debug node.js performance?
code
 # cd your_slow_scroll
 # you may need to update the path below so it points to your scroll code
 node --cpu-prof --cpu-prof-name=scrollNodePerf.cpuprofile ~/scroll/scroll.js build
 # Now ➡️ open a new Chrome tab ➡️ open devtools ➡️ click Performance ➡️ click "Load Profile..." ➡️ select your scrollNodePerf.cpuprofile
 # For profiling memory, use this line:
 node --cpu-prof --cpu-prof-name=scrollNodePerf.cpuprofile --heap-prof --heap-prof-name=scrollNodeMem.heapprofile ~/scroll/scroll.js build
 # Now ➡️ open a new Chrome tab ➡️ open devtools ➡️ click Memory ➡️ click "Load Profile..." ➡️ select your scrollNodeMem.heapprofile

? How is a parser different than a web component?
Scroll Parsers and Web Components are similar in that both empower users to define their own reusable components. But Scroll is higher level than web components. For example, in addition to easily targeting HTML and web components, Scroll also plays really nicely with version control and 2D editors. Scroll encourages encoding semantic content with as little noise as possible, which creates benefits in many places.

? How do I run cross browser tests?
For that we use BrowserStack.
 https://browserstack.com BrowserStack

? Is there a subreddit to discuss Scroll?
Yes.
 https://www.reddit.com/r/WorldWideScroll/

? How many compiler passes are there in the language?
Each Scroll file is currently passed over 4 times during compilation to HTML and/or text.
1. The full file is read.
2. All `import` statements are replaced with the contents of the imported file.
3. All variable `replace` statements are executed and applied to the current file.
4. Finally, an extended Scroll parser is constructed if needed (if any new parser definitions appear in the document), and then is used to parse the resulting file for compilation.

? Is there a chart showing all the layers of Scroll?
evolutionOfScroll.png
 caption Made with nomnoml
  https://t.co/Fggo87gUr1

# Other
? Why the name Scroll?
The scroll was invented thousands of years ago and scrolls are still useful today. Scroll has been designed with a focus on simplicity and a goal of making something that would have been useful decades ago, with the hope that this will make it useful decades into the future.

endColumns

footer.scroll

```
```tutorial.scroll
replace DOMAIN scroll.pub
title Scroll Tutorial
linkTitle Tutorial

header.scroll

container 800px

printTitle
nav.scroll
center
Video walkthrough of this tutorial | Edit this file on try.scroll.pub
 https://try.scroll.pub/index.html#url%20https%3A%2F%2Fscroll.pub%2Ftutorial.scroll Edit this file on try.scroll.pub
 https://www.youtube.com/watch?v=IE3lHAmMqC4 Video walkthrough of this tutorial

? What is Scroll?

Scroll is a new computer language that evolved from taking one question very seriously: what if you removed every unnecessary stroke from a language? What if you made a language as simple as possible?

Scroll is the result of relentlessly pursuing those questions.

This tutorial will walk you through the basics of using Scroll.

---

## A Scroll document
A Scroll document (or "program") is a _list of lines_.

Each line can contain content (or "atoms").

For example, here is a line containing 3 atoms:

code
 title Hello world

In addition to containing atoms, each line can have its own document with its own lines using indentation.

When you add a space at the beginning of a line, that line becomes a "subparticle" of the parent line.

code
 image hello.png
  caption This line is a subparticle of the line above.

You may have seen this _indent trick_ before in languages like Python.

But Scroll pushes it to the max.

Master the indent trick and master Scroll.

But we're getting ahead of ourselves, let's start with the basics.

---

# Parsers

Every line in a Scroll document matches and is parsed by a Parser.

You can see all the available parsers in the Scroll Leet Sheet.
 leetsheet.html Scroll Leet Sheet

(Advanced users who want to write their own parsers might want to checkout the Parsers Leet Sheet.)
 parserLeetsheet.html Parsers Leet Sheet

Let's walk through some of the most common parsers.

---

# Basic Lines
## 1. The Paragraph Parser

Let's start with the most common parser, the `paragraph` parser.

You can think of paragraphs as similar to a `p` or `div` tag in HTML.

To use this parser you can write out the atom `paragraph`, or use an asterisk `*`, OR just start any text that does not match another parser (the "catch all" parser of a Scroll program is the paragraph parser).

This paragraph was compiled by the catch all paragraph parser. The code is:
aboveAsCode

## 2. Headers
Scroll has headers like markdown:
belowAsCode 2
# This is a section header
## This is a subsection header

## 3. Unordered lists
Here's how you write unordered lists:
belowAsCode 2
- Scroll has lists
 - That can be nested

## 4. Checklists
Below is the code for a checklist and its rendered version:
belowAsCode 2
[] Finish full tutorial
 [x] Learn that checklists support nesting

## 5. Tables
Use the `table` parser to make tables:
belowAsCode
table
 printTable
 data
  Name,Rank
  Scroll,#1
  Markdown,#2

## 6. Images
To add an image use the `image` parser:
belowAsCode 2
https://scroll.pub/blog/screenshot.png
 caption An image with a caption

## 7. Footnotes
You can make footnotes like this:
belowAsCode 2
Pau means done^pau
^pau In Hawaiian

## 8. Dashboard
If you are building a dashboard you might want to try the `dashboard` parser:
belowAsCode
dashboard
 #1 Lang
 2k Users
 300 Stars

## 9. Including HTML and CSS
html If you need to jump into regular HTML, use the `html` parser.
aboveAsCode

For CSS, use the `css` parser:
belowAsCode 2
css .green {color: green;}
This text should be green.
 class green

---

# Marking Up Text
## Inline markups
You can use inline markups similar to Markdown or Textile.
belowAsCode
Here's how to *bold*, _italicize_, or denote `code`.

## HTML markups
You can use also markup text using HTML.
belowAsCode
Here's how to bold.

## Aftertext
Scroll invented something called aftertext, where you put markup after the text.
 https://breckyunits.com/aftertext.html

For example, instead of mixing in the link with the content, you put the link _after the text_ along with the text you want the link to match against. For example:
belowAsCode
A link to Wikipedia
 https://wikipedia.org Wikipedia
You can also make the whole paragraph a link by not including any text to match against.
belowAsCode
A link to Wikipedia
 https://wikipedia.org

## Columns
You can use the `thinColumns [maxNumberOfColumns]` parser to start a columns flow and `endColumns` to end a columns flow. If you don't want a section to break across columns, don't put line breaks in between lines. Line breaks will clear sections.

---

# Advanced
## Variables
Use the `replace` parser to define macros. Macros definitions are parsed and removed on the first compiler pass.
Our domain is: *DOMAIN*

## Import statements
Scroll files can import other Scroll files. Use the `import` parser by just specifyingcthe path to the file, such as: `header.scroll`

---

## Themes
Scroll ships with some default themes, which are just CSS files.

## Examples
## A page using no theme:
code
 # This page has no theme
## A page using a theme:
code
 theme gazette
 homeButton
 editButton
 This page uses the Gazette theme.

---

# Expert: Adding your own parsers
_Note: Custom Parsers are currently only supported using the `npm` package. The web editor does *not* currently support custom parsers_.

You can define your own parsers right in your Scroll documents using `*Parser`.

Here is a simple example that extends Scroll by making `p` work the same as `*`:

belowAsCode 2
pParser
 extends scrollParagraphParser
 cue p
p We can then make paragraphs using `p`.

Let's now make a `hiddenMessage` Parser that alerts a message when clicked:
belowAsCode 3
messageParser
 cueFromId
 catchAllAtomType stringAtom
hiddenMessageParser
 extends scrollParagraphParser
 inScope messageParser
 cueFromId
 javascript
  buildHtml() {
   return `${super.buildHtml()}`
  }
hiddenMessage Click me.
 message Hello world

As you can see, you can define new parsers with a small amount of code.

You probably also can see that the Parsers code is powerful but has lots of sharp edges.

While the documentation on Parsers evolves, feel free to get in touch for help in adding your own parsers.

footer.scroll

```
