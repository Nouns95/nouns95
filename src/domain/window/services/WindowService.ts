import { Window, WindowPosition, WindowSize } from '../models/Window';
import { WindowState, WindowAction } from '../models/WindowState';
import { EventBus } from '@/src/utils/EventBus';
import { WindowEventMap, WindowEventName, WindowEventCallback } from '../events/WindowEvents';

export class WindowService {
  private static instance: WindowService;
  private state: WindowState;
  private eventBus: EventBus;

  private constructor() {
    this.state = {
      windows: {},
      focusOrder: [],
      activeWindowId: null,
      lastPosition: { x: 20, y: 20 },
      lastSize: { width: 800, height: 600 },
    };
    this.eventBus = new EventBus();
  }

  public static getInstance(): WindowService {
    if (!WindowService.instance) {
      WindowService.instance = new WindowService();
    }
    return WindowService.instance;
  }

  public on<T extends WindowEventName>(event: T, callback: WindowEventCallback<T>): void {
    this.eventBus.on(event, callback);
  }

  public off<T extends WindowEventName>(event: T, callback: WindowEventCallback<T>): void {
    this.eventBus.off(event, callback);
  }

  public createWindow(params: {
    title: string;
    applicationId: string;
    processId: string;
    position?: WindowPosition;
    size?: WindowSize;
    icon?: string;
    canResize?: boolean;
  }): Window {
    const id = `window-${Date.now()}`;
    const window: Window = {
      id,
      title: params.title,
      position: params.position || this.getNextWindowPosition(),
      size: params.size || this.state.lastSize,
      zIndex: Object.keys(this.state.windows).length,
      isFocused: true,
      isMinimized: false,
      isMaximized: false,
      processId: params.processId,
      applicationId: params.applicationId,
      icon: params.icon,
      canResize: params.canResize ?? true,
    };

    this.dispatch({ type: 'CREATE_WINDOW', window });
    this.focusWindow(id);
    return window;
  }

  public closeWindow(id: string): void {
    this.dispatch({ type: 'CLOSE_WINDOW', id });
    this.eventBus.emit('windowClosed', { windowId: id });
  }

  public focusWindow(id: string): void {
    this.dispatch({ type: 'FOCUS_WINDOW', id });
    this.eventBus.emit('windowFocused', { windowId: id });
  }

  public minimizeWindow(id: string): void {
    this.dispatch({ type: 'MINIMIZE_WINDOW', id });
    this.eventBus.emit('windowMinimized', { windowId: id });
  }

  public maximizeWindow(id: string): void {
    this.dispatch({ type: 'MAXIMIZE_WINDOW', id });
    this.eventBus.emit('windowMaximized', { windowId: id });
  }

  public restoreWindow(id: string): void {
    this.dispatch({ type: 'RESTORE_WINDOW', id });
    this.eventBus.emit('windowRestored', { windowId: id });
  }

  public moveWindow(id: string, position: WindowPosition): void {
    this.dispatch({ type: 'MOVE_WINDOW', id, position });
    this.state.lastPosition = position;
  }

  public resizeWindow(id: string, size: WindowSize): void {
    this.dispatch({ type: 'RESIZE_WINDOW', id, size });
    this.state.lastSize = size;
  }

  public getWindow(id: string): Window | null {
    return this.state.windows[id] || null;
  }

  public getAllWindows(): Window[] {
    return Object.values(this.state.windows);
  }

  public getActiveWindow(): Window | null {
    return this.state.activeWindowId ? this.state.windows[this.state.activeWindowId] : null;
  }

  private getNextWindowPosition(): WindowPosition {
    const offset = 20;
    const position = {
      x: this.state.lastPosition.x + offset,
      y: this.state.lastPosition.y + offset,
    };

    // Reset position if window would be too far right or bottom
    if (position.x > window.innerWidth - 100) position.x = offset;
    if (position.y > window.innerHeight - 100) position.y = offset;

    return position;
  }

  private dispatch(action: WindowAction): void {
    switch (action.type) {
      case 'CREATE_WINDOW':
        // Set initial z-index higher than all existing windows
        const maxZIndex = Object.values(this.state.windows).reduce((max, w) => Math.max(max, w.zIndex), 0);
        action.window.zIndex = maxZIndex + 1;
        this.state.windows[action.window.id] = action.window;
        this.state.focusOrder.push(action.window.id);
        break;

      case 'CLOSE_WINDOW':
        this.state.focusOrder = this.state.focusOrder.filter(id => id !== action.id);
        
        if (this.state.activeWindowId === action.id) {
          const nextWindowId = this.state.focusOrder[this.state.focusOrder.length - 1];
          if (nextWindowId) {
            Object.values(this.state.windows).forEach(w => w.isFocused = false);
            this.state.windows[nextWindowId].isFocused = true;
            this.state.activeWindowId = nextWindowId;
            // Bring the next window to front
            const maxZ = Object.values(this.state.windows).reduce((max, w) => Math.max(max, w.zIndex), 0);
            this.state.windows[nextWindowId].zIndex = maxZ + 1;
          } else {
            this.state.activeWindowId = null;
          }
        }

        delete this.state.windows[action.id];
        break;

      case 'FOCUS_WINDOW':
        if (this.state.windows[action.id]) {
          // Unfocus all windows
          Object.values(this.state.windows).forEach(w => w.isFocused = false);
          
          // Focus the target window and bring it to front
          const targetWindow = this.state.windows[action.id];
          targetWindow.isFocused = true;
          targetWindow.isMinimized = false; // Restore if minimized
          
          // Set highest z-index
          const highestZ = Object.values(this.state.windows).reduce((max, w) => Math.max(max, w.zIndex), 0);
          targetWindow.zIndex = highestZ + 1;
          
          // Update active window and focus order
          this.state.activeWindowId = action.id;
          this.state.focusOrder = this.state.focusOrder.filter(id => id !== action.id);
          this.state.focusOrder.push(action.id);
        }
        break;

      case 'MINIMIZE_WINDOW':
        if (this.state.windows[action.id]) {
          this.state.windows[action.id].isMinimized = true;
          this.state.windows[action.id].isFocused = false;
          
          // Focus the next window if this was the active one
          if (this.state.activeWindowId === action.id) {
            const nextWindowId = this.state.focusOrder[this.state.focusOrder.length - 2]; // Get previous window
            if (nextWindowId) {
              this.dispatch({ type: 'FOCUS_WINDOW', id: nextWindowId });
            } else {
              this.state.activeWindowId = null;
            }
          }
        }
        break;

      case 'MAXIMIZE_WINDOW':
        if (this.state.windows[action.id]) {
          this.state.windows[action.id].isMaximized = true;
          this.state.windows[action.id].isMinimized = false;
        }
        break;

      case 'RESTORE_WINDOW':
        if (this.state.windows[action.id]) {
          this.state.windows[action.id].isMaximized = false;
          this.state.windows[action.id].isMinimized = false;
        }
        break;

      case 'MOVE_WINDOW':
        if (this.state.windows[action.id]) {
          this.state.windows[action.id].position = action.position;
        }
        break;

      case 'RESIZE_WINDOW':
        if (this.state.windows[action.id]) {
          this.state.windows[action.id].size = action.size;
        }
        break;

      case 'UPDATE_Z_INDEX':
        if (this.state.windows[action.id]) {
          this.state.windows[action.id].zIndex = action.zIndex;
        }
        break;
    }

    this.eventBus.emit('windowStateChanged', { state: this.state });
  }
}
