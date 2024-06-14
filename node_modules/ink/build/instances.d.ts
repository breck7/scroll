/// <reference types="node" resolution-mode="require"/>
import type Ink from './ink.js';
declare const instances: WeakMap<NodeJS.WriteStream, Ink>;
export default instances;
