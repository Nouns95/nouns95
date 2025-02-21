import { create } from 'zustand';
import { Window, MiniAppWindow, WindowCoordinates, WindowDimensions, WindowMetadata } from '../models/Window';

export interface BaseWindowState {
  id: string;
  title: string;
  applicationId: string;
  position: WindowCoordinates;
  size: WindowDimensions;
  isMinimized: boolean;
  isMaximized: boolean;
  isFocused: boolean;
  canResize: boolean;
  zIndex: number;
  processId: string;
  icon?: string;
  metadata?: WindowMetadata;
}

export interface RegularWindowState extends BaseWindowState {
  type: 'window';
}

export interface MiniAppWindowState extends BaseWindowState {
  type: 'miniapp';
  miniAppId: string;
  isPinned: boolean;
}

export type WindowStoreState = RegularWindowState | MiniAppWindowState;

interface WindowStore {
  windows: WindowStoreState[];
  addWindow: (window: Window | MiniAppWindow) => void;
  removeWindow: (id: string) => void;
  updateWindow: (id: string, updates: Partial<Omit<WindowStoreState, 'type'>>) => void;
  setWindows: (windows: WindowStoreState[]) => void;
  focusWindow: (id: string) => void;
}

const createInitialWindow = (window: Window): RegularWindowState => ({
  id: window.id,
  title: window.title,
  applicationId: window.applicationId,
  position: window.position,
  size: window.size,
  isMinimized: window.isMinimized,
  isMaximized: window.isMaximized,
  isFocused: window.isFocused,
  canResize: window.canResize,
  zIndex: window.zIndex,
  processId: window.processId,
  icon: window.icon,
  metadata: window.metadata,
  type: 'window'
});

const createMiniAppWindow = (window: MiniAppWindow): MiniAppWindowState => {
  const base = {
    id: window.id,
    title: window.title,
    applicationId: window.applicationId,
    position: window.position,
    size: window.size,
    isMinimized: window.isMinimized,
    isMaximized: window.isMaximized,
    isFocused: window.isFocused,
    canResize: false,
    zIndex: window.zIndex,
    processId: window.processId,
    icon: window.icon,
    metadata: window.metadata,
    type: 'miniapp' as const,
    miniAppId: window.miniAppId,
    isPinned: window.isPinned
  };
  return base;
};

export const useWindowStore = create<WindowStore>((set) => ({
  windows: [],
  
  addWindow: (window) => 
    set((state) => ({
      windows: state.windows.map(w => ({ ...w, isFocused: false })).concat(
        'miniAppId' in window ? createMiniAppWindow(window) : createInitialWindow(window)
      )
    })),
    
  removeWindow: (id) =>
    set((state) => ({
      windows: state.windows.filter(w => w.id !== id)
    })),
    
  updateWindow: (id, updates) =>
    set((state) => ({
      windows: state.windows.map(w => 
        w.id === id ? { ...w, ...updates } : w
      )
    })),
    
  setWindows: (windows) =>
    set(() => ({
      windows
    })),

  focusWindow: (id) =>
    set((state) => ({
      windows: state.windows.map(w => ({
        ...w,
        isFocused: w.id === id
      }))
    }))
}));