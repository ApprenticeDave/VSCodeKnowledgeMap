import { EventEmitter } from "events";
import { Logger, LogLevel } from "../Utils/Logger";

export class EventMonitor extends EventEmitter {
  constructor() {
    super();
  }

  // Method to emit a change event
  public notifyChange(eventType: string, data: any): void {
    Logger.log(`EventMonitor - Emitting Event: ${eventType}`, LogLevel.Info);
    this.emit(eventType, data);
  }
}
