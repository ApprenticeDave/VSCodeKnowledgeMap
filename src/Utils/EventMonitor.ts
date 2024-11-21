import { EventEmitter } from "events";
import { LogLevel, Utils } from "./Utils";

export class EventMonitor extends EventEmitter {
  constructor() {
    super();
  }

  // Method to emit a change event
  public notifyChange(eventType: string, data: any): void {
    Utils.log(`EventMonitor - Emitting Event: ${eventType}`, LogLevel.Info);
    this.emit(eventType, data);
  }
}
