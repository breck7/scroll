// Valid string terminator sequences are ESC\ and 0x9c; OSC also accepts BEL.
const ST = String.raw`(?:\u001B\u005C|\u009C)`;

// OSC sequences only: ESC ] ... BEL/ST (or the C1 introducer 0x9d ... BEL/ST).
// Payloads stop at terminators, cancellations, and C1 controls. An unterminated string cannot swallow the next sequence or repeatedly scan its payload from later introducers. Terminals likewise abort a control string on an unexpected ESC.
const stringControls = String.raw`\u0018\u001A\u001B\u0080-\u009F`;
const osc = String.raw`(?:\u001B\]|\u009D)[^\u0007${stringControls}]*(?:\u0007|${ST})`;

// DCS, SOS, PM, APC, and screen window titles have opaque payloads terminated by ST. Nested ESC payloads, such as tmux passthrough, require a parser.
const controlString = String.raw`(?:\u001B[PX^_k]|[\u0090\u0098\u009E\u009F])[^${stringControls}]*${ST}`;

// Linux console palette controls have fixed lengths and no string terminator; iTerm2 terminates its palette assignments. Consume an immediately adjacent OSC terminator, but match these controls before OSC so a later BEL cannot consume visible text.
const linuxPalette = String.raw`\u001B\](?:P[\dA-Fa-f]{7}|R)(?:\u0007|${ST})?`;

// CSI: ESC [ or C1 CSI, parameter bytes (0x30–0x3f), intermediate bytes (0x20–0x2f), then a final byte (0x40–0x7e).
// `= < >` are final bytes in two-byte VT52 escapes (`ESC >`) but parameter bytes in a CSI (`ESC [ > 0 ; 276 ; 0 c`, the device attributes reply). Match CSI first to consume the whole sequence, where its introducer makes the two unambiguous.
const csi = String.raw`(?:\u001B\[|\u009B)[\u0030-\u003F]*[\u0020-\u002F]*[\u0040-\u007E]`;

// Related escapes: ESC, intermediate bytes (0x20–0x2f), then a final byte (0x30–0x7e), or a supported two-byte escape.
// The two-byte final class stays narrow so that ESC followed by an arbitrary character is not read as a sequence. CSI parameters belong only to the CSI form, preventing partial matches and avoiding a second scan with nested repetition.
// Escapes whose final byte is a digit include `ESC 7` and `ESC 8` (save and restore cursor), `ESC ( 0` (line drawing character set), and `ESC # 8` (screen alignment).
// A digit is never a CSI final byte. These escapes end immediately at their final byte, so `ESC 7 l` is read as the escape followed by text rather than a sequence with parameter 7 and final byte `l`.
const escape = String.raw`\u001B(?:[\u0020-\u002F]+[\u0030-\u007E]|[\dA-PR-TZcf-oq-uy=><~|}])`;

const pattern = `${linuxPalette}|${osc}|${controlString}|${csi}|${escape}`;

export default function ansiRegex({onlyFirst = false} = {}) {
	return new RegExp(pattern, onlyFirst ? undefined : 'g');
}
