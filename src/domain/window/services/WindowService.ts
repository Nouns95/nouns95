import { Window, MiniAppWindow, WindowCoordinates, WindowDimensions } from '../models/Window';
import { WindowState, WindowAction } from '../models/WindowState';
import { EventBus } from '@/src/utils/EventBus';
import { WindowEventName, WindowEventCallback } from '../events/WindowEvents';
import { getAppConfig, calculateWindowPosition } from '../config/AppConfig';

export class WindowService {
  private static instance: WindowService;
  private state: WindowState = {
    windows: {},
    miniApps: {},
    focusedWindowId: null,
    zIndexCounter: 0
  };
  private focusHistory: string[] = [];
  private eventBus = new EventBus();
  private readonly BASE_ZINDEX = 100;
  private readonly MINIAPP_ZINDEX_OFFSET = 1000;

  private constructor() {}

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

  public createWindow(appId: string, processId: string, metadata?: Record<string, unknown>): string {
    const config = getAppConfig(appId);
    const windowCount = Object.keys(this.state.windows).length;
    
    const window: Window = {
      id: `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: config.title,
      position: calculateWindowPosition(appId, windowCount),
      size: config.size.defaultSize,
      zIndex: this.BASE_ZINDEX + this.state.zIndexCounter++,
      isFocused: false,
      isMinimized: false,
      isMaximized: false,
      processId,
      applicationId: appId,
      icon: config.metadata?.icon,
      canResize: config.behavior.canResize,
      metadata
    };

    this.dispatch({ type: 'CREATE_WINDOW', window });
    return window.id;
  }

  public createMiniApp(appId: string, processId: string, metadata?: Record<string, unknown>): string {
    const config = getAppConfig(appId);
    const miniAppCount = Object.keys(this.state.miniApps).length;
    
    const miniApp: MiniAppWindow = {
      id: `miniapp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: config.title,
      position: calculateWindowPosition(appId, miniAppCount),
      size: config.size.defaultSize,
      zIndex: this.MINIAPP_ZINDEX_OFFSET + this.state.zIndexCounter++,
      isFocused: false,
      isMinimized: false,
      isMaximized: false,
      processId,
      applicationId: appId,
      icon: config.metadata?.icon,
      canResize: config.behavior.canResize,
      miniAppId: appId,
      isPinned: false,
      metadata
    };

    this.dispatch({ type: 'CREATE_MINIAPP', miniApp });
    return miniApp.id;
  }

  public closeWindow(windowId: string): void {
    const window = this.state.windows[windowId];
    if (!window) return;
    
    this.dispatch({ type: 'CLOSE_WINDOW', windowId });
    this.eventBus.emit('windowClosed', { windowId });
  }

  public closeMiniApp(miniAppId: string): void {
    const miniApp = Object.values(this.state.miniApps).find(app => app.miniAppId === miniAppId);
    if (!miniApp) return;
    
    this.dispatch({ type: 'CLOSE_MINIAPP', miniAppId });
  }

  public focusWindow(windowId: string): void {
    const window = this.state.windows[windowId] || this.state.miniApps[windowId];
    if (!window) return;
    
    this.dispatch({ type: 'FOCUS_WINDOW', windowId });
    this.eventBus.emit('windowFocused', { windowId });
  }

  public minimizeWindow(windowId: string): void {
    const window = this.state.windows[windowId] || this.state.miniApps[windowId];
    if (!window) return;
    
    this.dispatch({ type: 'MINIMIZE_WINDOW', windowId });
    this.eventBus.emit('windowMinimized', { windowId });
  }

  public maximizeWindow(windowId: string): void {
    const window = this.state.windows[windowId];
    if (!window) return;
    
    this.dispatch({ type: 'MAXIMIZE_WINDOW', windowId });
    this.eventBus.emit('windowMaximized', { windowId });
  }

  public restoreWindow(windowId: string): void {
    const window = this.state.windows[windowId] || this.state.miniApps[windowId];
    if (!window) return;
    
    this.dispatch({ type: 'RESTORE_WINDOW', windowId });
    this.eventBus.emit('windowRestored', { windowId });
  }

  public moveWindow(windowId: string, position: WindowCoordinates): void {
    const window = this.state.windows[windowId] || this.state.miniApps[windowId];
    if (!window) return;

    // Enforce boundaries
    const enforcedPosition = {
      x: Math.max(0, position.x),
      y: Math.max(0, position.y)
    };

    this.dispatch({ type: 'MOVE_WINDOW', windowId, position: enforcedPosition });
  }

  public resizeWindow(windowId: string, size: WindowDimensions): void {
    const window = this.state.windows[windowId];
    if (!window || !window.canResize) return;
    
    this.dispatch({ type: 'RESIZE_WINDOW', windowId, size });
  }

  public getWindow(windowId: string): Window | MiniAppWindow | null {
    return this.state.windows[windowId] || this.state.miniApps[windowId] || null;
  }

  public getAllWindows(): Window[] {
    return Object.values(this.state.windows);
  }

  public getAllMiniApps(): MiniAppWindow[] {
    return Object.values(this.state.miniApps);
  }

  public switchFocus(): void {
    if (this.focusHistory.length < 2) return;

    const currentFocusId = this.focusHistory.pop();
    if (currentFocusId) {
      this.focusHistory.unshift(currentFocusId);
    }

    const nextFocusId = this.focusHistory[this.focusHistory.length - 1];
    if (nextFocusId) {
      this.focusWindow(nextFocusId);
    }
  }

  public getFocusHistory(): string[] {
    return [...this.focusHistory];
  }

  public clearFocus(): void {
    // Unfocus all windows
    Object.values(this.state.windows).forEach(window => {
      window.isFocused = false;
    });
    Object.values(this.state.miniApps).forEach(miniApp => {
      miniApp.isFocused = false;
    });

    // Clear focused window ID
    if (this.state.focusedWindowId) {
      this.eventBus.emit('windowBlurred', { windowId: this.state.focusedWindowId });
      this.state.focusedWindowId = null;
      this.eventBus.emit('focusCleared', { timestamp: Date.now() });
    }

    // Notify state change
    this.eventBus.emit('windowStateChanged', { state: this.state });
  }

  private dispatch(action: WindowAction): void {
    switch (action.type) {
      case 'CREATE_WINDOW':
        this.state.windows[action.window.id] = action.window;
        this.state.zIndexCounter++;
        action.window.zIndex = this.state.zIndexCounter;
        this.updateWindowFocus(action.window.id);
        break;

      case 'CREATE_MINIAPP':
        this.state.miniApps[action.miniApp.id] = action.miniApp;
        this.state.zIndexCounter++;
        action.miniApp.zIndex = this.state.zIndexCounter;
        this.updateWindowFocus(action.miniApp.id);
        break;

      case 'CLOSE_WINDOW':
        delete this.state.windows[action.windowId];
        if (this.state.focusedWindowId === action.windowId) {
          this.state.focusedWindowId = null;
        }
        break;

      case 'CLOSE_MINIAPP':
        const miniAppToClose = Object.values(this.state.miniApps).find(
          app => app.miniAppId === action.miniAppId
        );
        if (miniAppToClose) {
          delete this.state.miniApps[miniAppToClose.id];
          if (this.state.focusedWindowId === miniAppToClose.id) {
            this.state.focusedWindowId = null;
          }
        }
        break;

      case 'FOCUS_WINDOW':
        this.updateWindowFocus(action.windowId);
        break;

      case 'MINIMIZE_WINDOW':
        const windowToMinimize = this.state.windows[action.windowId] || this.state.miniApps[action.windowId];
        if (windowToMinimize) {
          windowToMinimize.isMinimized = true;
          windowToMinimize.isFocused = false;
          if (this.state.focusedWindowId === action.windowId) {
            this.state.focusedWindowId = null;
          }
        }
        break;

      case 'MAXIMIZE_WINDOW':
        const windowToMaximize = this.state.windows[action.windowId];
        if (windowToMaximize) {
          windowToMaximize.isMaximized = true;
          windowToMaximize.isMinimized = false;
        }
        break;

      case 'RESTORE_WINDOW':
        const windowToRestore = this.state.windows[action.windowId] || this.state.miniApps[action.windowId];
        if (windowToRestore) {
          windowToRestore.isMaximized = false;
          windowToRestore.isMinimized = false;
        }
        break;

      case 'MOVE_WINDOW':
        const windowToMove = this.state.windows[action.windowId] || this.state.miniApps[action.windowId];
        if (windowToMove) {
          windowToMove.position = action.position;
        }
        break;

      case 'RESIZE_WINDOW':
        const windowToResize = this.state.windows[action.windowId];
        if (windowToResize && windowToResize.canResize) {
          windowToResize.size = action.size;
        }
        break;

      case 'PIN_MINIAPP':
        const miniAppToPin = Object.values(this.state.miniApps).find(
          app => app.miniAppId === action.miniAppId
        );
        if (miniAppToPin) {
          miniAppToPin.isPinned = true;
        }
        break;

      case 'UNPIN_MINIAPP':
        const miniAppToUnpin = Object.values(this.state.miniApps).find(
          app => app.miniAppId === action.miniAppId
        );
        if (miniAppToUnpin) {
          miniAppToUnpin.isPinned = false;
        }
        break;
    }

    this.eventBus.emit('windowStateChanged', { state: this.state });
  }

  private updateWindowFocus(focusedId: string): void {
    // Get the target window
    const targetWindow = this.state.windows[focusedId] || this.state.miniApps[focusedId];
    if (!targetWindow) return;

    // Increment counter for new top z-index
    this.state.zIndexCounter++;
    const topZIndex = this.state.zIndexCounter;

    // Update focus state for all windows
    Object.values(this.state.windows).forEach(window => {
      window.isFocused = window.id === focusedId;
      // Keep non-focused windows at their current z-index
    });

    Object.values(this.state.miniApps).forEach(miniApp => {
      miniApp.isFocused = miniApp.id === focusedId;
      // Keep non-focused mini-apps at their current z-index
    });

    // Update the focused window
    targetWindow.isFocused = true;
    this.state.focusedWindowId = focusedId;
    
    // Set the focused window to the highest z-index
    targetWindow.zIndex = topZIndex;

    // Update focus history
    this.focusHistory = this.focusHistory.filter(id => id !== focusedId);
    this.focusHistory.push(focusedId);

    this.eventBus.emit('focusChanged', { windowId: focusedId });
  }
}
