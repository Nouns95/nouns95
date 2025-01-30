import { EventBus } from '@/src/utils/EventBus';
import { WindowService } from './WindowService';

export class FocusManager {
  private static instance: FocusManager;
  private focusHistory: string[] = [];
  private eventBus: EventBus;
  private windowService: WindowService;
  private focusedWindowId: string | null = null;

  private constructor() {
    this.eventBus = new EventBus();
    this.windowService = WindowService.getInstance();
  }

  public static getInstance(): FocusManager {
    if (!FocusManager.instance) {
      FocusManager.instance = new FocusManager();
    }
    return FocusManager.instance;
  }

  public focus(windowId: string): void {
    const window = this.windowService.getWindow(windowId);
    if (!window) return;

    // Update focus history
    this.focusHistory = this.focusHistory.filter(id => id !== windowId);
    this.focusHistory.push(windowId);

    // Update window z-index
    const windows = this.windowService.getAllWindows();
    const maxZIndex = Math.max(...windows.map(w => w.zIndex));
    window.zIndex = maxZIndex + 1;

    this.windowService.focusWindow(windowId);
    this.eventBus.emit('focusChanged', { windowId });
  }

  public blur(windowId: string): void {
    const window = this.windowService.getWindow(windowId);
    if (!window) return;

    this.focusHistory = this.focusHistory.filter(id => id !== windowId);
    this.eventBus.emit('windowBlurred', { windowId });
  }

  public getFocusedWindow(): string | null {
    return this.focusHistory[this.focusHistory.length - 1] || null;
  }

  public getFocusHistory(): string[] {
    return [...this.focusHistory];
  }

  public switchFocus(): void {
    if (this.focusHistory.length < 2) return;

    const currentFocusId = this.focusHistory.pop();
    if (currentFocusId) {
      this.focusHistory.unshift(currentFocusId);
    }

    const nextFocusId = this.focusHistory[this.focusHistory.length - 1];
    if (nextFocusId) {
      this.focus(nextFocusId);
    }
  }

  public clearFocus(): void {
    if (this.focusedWindowId) {
      this.eventBus.emit('windowBlurred', { windowId: this.focusedWindowId });
      this.focusedWindowId = null;
      this.eventBus.emit('focusCleared', { timestamp: Date.now() });
    }
  }
}
