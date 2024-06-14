"use strict";
const _process = process;
// Not shown here: Additional logic to correctly interact with process's events, either using this direct manipulation, or via the API
let originalOnWarning;
if (Array.isArray(_process._events.warning)) {
    originalOnWarning = _process._events.warning[0];
    _process._events.warning[0] = onWarning;
}
else {
    originalOnWarning = _process._events.warning;
    _process._events.warning = onWarning;
}
const messageMatch = /(?:--(?:experimental-)?loader\b|\bCustom ESM Loaders\b)/;
function onWarning(warning, ...rest) {
    // Suppress warning about how `--loader` is experimental
    if (warning?.name === 'ExperimentalWarning' && messageMatch.test(warning?.message))
        return;
    // Will be undefined if `--no-warnings`
    return originalOnWarning?.call(this, warning, ...rest);
}
//# sourceMappingURL=child-require.js.map