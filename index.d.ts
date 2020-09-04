import { EventEmitter } from "events";

type ShutdownFn = () => any;
type ShutdownFunctionOptions = {
  name?: string,
  order?: number,
}

declare interface ShutdownHook extends EventEmitter {
  register: () => void,
  exit: (code?: number) => void,
  shutdown: () => Promise<void>,
  add: (shutfownFn: ShutdownFn, options: ShutdownFunctionOptions) => void,
}

type ShutdownHookOptions = {
  lifo: any,
  timeout?: number,
}

declare const shutdownHook: new (options?: ShutdownHookOptions) => ShutdownHook;

export = shutdownHook;
