/// <reference types="node" />

import EventEmitter from "events";
type EventLog = [event: string, ...data:any[]][]
declare function eventsToArray(
  ee: EventEmitter,
  ignore?: string[],
  map?: (x: any) => any
): EventLog

export = eventsToArray
