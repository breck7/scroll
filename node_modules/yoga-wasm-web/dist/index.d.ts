import type { Yoga } from "./wrapAsm.js";

export * from "./generated/YGEnums.js";
export * from "./wrapAsm.js";

export default function (wasm: BufferSource | WebAssembly.Module): Promise<Yoga>;
export function initStreaming(response: Response | PromiseLike<Response>): Promise<Yoga>;
