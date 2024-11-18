import { EventEmitter } from "events";

export class EventMonitor extends EventEmitter {
  constructor() {
    super();
  }

  // Method to emit a change event
  public notifyChange(eventType: string, data: any): void {
    this.emit(eventType, data);
  }
}
