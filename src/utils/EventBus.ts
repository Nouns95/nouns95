type EventCallback<T = unknown> = (data: T) => void;
type EventMap = Record<string, EventCallback[]>;

export class EventBus {
  private events: EventMap = {};

  public on<T>(event: string, callback: EventCallback<T>): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback as EventCallback);
  }

  public off<T>(event: string, callback: EventCallback<T>): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  public emit<T>(event: string, data: T): void {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(data));
  }

  public clear(): void {
    this.events = {};
  }

  public removeAllListeners(): void {
    this.events = {};
  }
}
