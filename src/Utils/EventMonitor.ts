import { EventEmitter } from "events";
import { Logger, LogLevel } from "../Utils/Logger";
import { GraphEventName } from "../Utils/GraphEvents";

export class EventMonitor extends EventEmitter {
  constructor() {
    super();
  }

  // Typed wrapper for EventEmitter.on — restricts event names to known GraphEventName values.
  public on(event: GraphEventName, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }

  // Typed wrapper for EventEmitter.emit — restricts event names to known GraphEventName values.
  public emit(event: GraphEventName, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }

  // Typed wrapper for EventEmitter.removeAllListeners.
  public removeAllListeners(event?: GraphEventName): this {
    return super.removeAllListeners(event);
  }

  // Convenience method to emit a change event with a single data payload.
  public notifyChange(eventType: GraphEventName, data: any): void {
    Logger.log(`EventMonitor - Emitting Event: ${eventType}`, LogLevel.Info);
    this.emit(eventType, data);
  }
}
