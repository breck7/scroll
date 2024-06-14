# sync-content

Synchronize the contents of one folder to another location, only
copying files if contents differ.

## USAGE

```js
import { syncContent, syncContentSync } from 'sync-content'

// promise version will generally be faster, because parallel
await syncContent('/some/source/path', '/some/destination/path')

// or sync version:
syncContentSync('/some/source/path', '/some/destination/path')

// now they match!
// Any files that already had matching contents were skipped.
// Anything absent in the source was removed.
// Anything that was the wrong type of entry was clobbered.
```
