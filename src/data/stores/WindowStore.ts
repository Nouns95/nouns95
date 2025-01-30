import { create } from 'zustand';
import { WalletType } from '../../presentation/apps/Wallet/WalletApp';

interface WindowMetadata {
  network?: WalletType;
  path?: string;
}

interface WindowState {
  id: string;
  title: string;
  appId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  isMaximized: boolean;
  isFocused: boolean;
  canResize: boolean;
  zIndex: number;
  metadata?: WindowMetadata;
}

interface WindowStore {
  windows: WindowState[];
  addWindow: (window: WindowState) => void;
  removeWindow: (id: string) => void;
  updateWindow: (id: string, updates: Partial<WindowState>) => void;
  setWindows: (windows: WindowState[]) => void;
  focusWindow: (id: string) => void;
}

const createInitialWindow = (
  id: string,
  title: string,
  appId: string,
  metadata?: WindowMetadata
): WindowState => ({
  id,
  title,
  appId,
  position: { x: 100, y: 100 },
  size: { width: 800, height: 600 },
  isMinimized: false,
  isMaximized: false,
  isFocused: true,
  canResize: true,
  zIndex: 1,
  metadata
});

export const useWindowStore = create<WindowStore>((set) => ({
  windows: [],
  
  addWindow: (window) => 
    set((state) => ({
      windows: state.windows.map(w => ({ ...w, isFocused: false })).concat({
        ...createInitialWindow(
          window.id,
          window.title,
          window.appId,
          window.metadata
        ),
        ...window
      })
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
        isFocused: w.id === id,
        zIndex: w.id === id ? Math.max(...state.windows.map(w => w.zIndex)) + 1 : w.zIndex
      }))
    }))
}));
