import { WindowCoordinates, WindowDimensions, WindowSizeValue } from '../Shell/Window/domain/models/Window';
import { WalletApp } from '@/src/Apps/MiniApps/Wallet';
import { FileExplorer } from '@/src/Apps/Windows/FileExplorer';
import { Auction } from '@/src/Apps/Nouns/Auction';
import { Studio } from '@/src/Apps/Nouns/Studio';
import { Probe } from '@/src/Apps/Nouns/Probe';
import { Chat } from '@/src/Apps/MiniApps/Chat';
import Tabs from '@/src/Apps/Nouns/Tabs';
import { default as Governance } from '@/src/Apps/Nouns/Governance/Governance';

// App types
export type AppType = 'window' | 'miniapp';
export type AppId = 
  | 'auction'
  | 'chat'
  | 'fileexplorer'
  | 'governance'
  | 'probe'
  | 'programs'
  | 'settings'
  | 'shutdown'
  | 'studio'
  | 'tabs'
  | 'wallet';


// Position types
export type PreferredPosition = 'center' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | WindowCoordinates;

// Margin configuration
export interface WindowMargin {
  value: number;
  unit: 'px' | 'rem';
}

export interface WindowMargins {
  top?: WindowMargin;
  right?: WindowMargin;
  bottom?: WindowMargin;
  left?: WindowMargin;
}

// Size configuration
export interface WindowSizeConstraints {
  minSize?: WindowDimensions;
  maxSize?: WindowDimensions;
  defaultSize: WindowDimensions;
}

// Window behavior configuration
export interface WindowBehavior {
  canResize: boolean;
  canMinimize: boolean;
  canMaximize: boolean;
  stackingOffset?: WindowCoordinates;
}

// Complete window configuration
export interface AppWindowConfig {
  type: AppType;
  title: string;
  size: WindowSizeConstraints;
  position: {
    preferred: PreferredPosition;
    margins: WindowMargins;
  };
  behavior: WindowBehavior;
  metadata?: {
    icon?: string;
    description?: string;
    category?: string;
    defaultPath?: string;
  };
  component: React.ComponentType<Record<string, unknown>>;
}

// Utility functions for unit conversion
export const convertToPixels = (value: WindowMargin | WindowSizeValue): number => {
  if (!value) return 0;
  if (value.unit === 'px') return value.value;
  
  const rootFontSize = typeof document !== 'undefined' 
    ? parseFloat(getComputedStyle(document.documentElement).fontSize)
    : 16;
  return value.value * rootFontSize;
};

const getViewportDimensions = () => {
  if (typeof document === 'undefined') {
    return { width: 1024, height: 768 };
  }
  return {
    width: document.documentElement.clientWidth || document.body.clientWidth,
    height: document.documentElement.clientHeight || document.body.clientHeight
  };
};

const TASKBAR_HEIGHT = 32; // 2rem at 16px base font size

// Position calculation functions
export const calculateWindowPosition = (
  appId: AppId | string,
  index: number = 0
): WindowCoordinates => {
  const config = getAppConfig(appId);
  const viewport = getViewportDimensions();
  const margins = config.position.margins;
  const size = config.size.defaultSize;
  
  // Convert size to pixels
  const windowWidth = convertToPixels(size.width);
  const windowHeight = convertToPixels(size.height);
  
  // Convert margins to pixels with defaults
  const marginTop = convertToPixels(margins.top || DEFAULT_MARGINS.top);
  const marginRight = convertToPixels(margins.right || DEFAULT_MARGINS.right);
  const marginBottom = convertToPixels(margins.bottom || DEFAULT_MARGINS.bottom);
  const marginLeft = convertToPixels(margins.left || DEFAULT_MARGINS.left);

  // Calculate available space
  const availableWidth = viewport.width - marginLeft - marginRight;
  const availableHeight = viewport.height - marginTop - marginBottom - TASKBAR_HEIGHT;

  // Apply stacking offset for non-first windows
  const stackingOffset = config.behavior.stackingOffset || { x: 20, y: 20 };
  const offsetX = index * stackingOffset.x;
  const offsetY = index * stackingOffset.y;

  // Calculate position based on preferred position
  switch (config.position.preferred) {
    case 'center':
      return {
        x: Math.max(marginLeft, (availableWidth - windowWidth) / 2 + offsetX),
        y: Math.max(marginTop, (availableHeight - windowHeight) / 2 + offsetY)
      };

    case 'topLeft':
      return {
        x: marginLeft + offsetX,
        y: marginTop + offsetY
      };

    case 'topRight':
      return {
        x: Math.max(marginLeft, availableWidth - windowWidth + offsetX),
        y: marginTop + offsetY
      };

    case 'bottomLeft':
      return {
        x: marginLeft + offsetX,
        y: Math.max(marginTop, availableHeight - windowHeight + offsetY)
      };

    case 'bottomRight':
      return {
        x: Math.max(marginLeft, availableWidth - windowWidth + offsetX),
        y: Math.max(marginTop, availableHeight - windowHeight + offsetY)
      };

    default:
      // If preferred position is a WindowCoordinates object
      if (typeof config.position.preferred === 'object') {
        return {
          x: Math.max(marginLeft, config.position.preferred.x + offsetX),
          y: Math.max(marginTop, config.position.preferred.y + offsetY)
        };
      }
      // Fallback to center
      return {
        x: Math.max(marginLeft, (availableWidth - windowWidth) / 2 + offsetX),
        y: Math.max(marginTop, (availableHeight - windowHeight) / 2 + offsetY)
      };
  }
};

// Default configurations
const DEFAULT_MARGINS: Required<WindowMargins> = {
  top: { value: 1.25, unit: 'rem' },
  right: { value: 1.25, unit: 'rem' },
  bottom: { value: 1.25, unit: 'rem' },
  left: { value: 5, unit: 'rem' }
};

const DEFAULT_SIZE: WindowDimensions = {
  width: { value: 50, unit: 'rem' },
  height: { value: 37.5, unit: 'rem' }
};

const DEFAULT_MIN_SIZE: WindowDimensions = {
  width: { value: 25, unit: 'rem' },
  height: { value: 18.75, unit: 'rem' }
};

// Default window configuration
export const DEFAULT_WINDOW_CONFIG: AppWindowConfig = {
  type: 'window',
  title: 'Window',
  size: {
    defaultSize: DEFAULT_SIZE,
    minSize: DEFAULT_MIN_SIZE,
  },
  position: {
    preferred: 'center',
    margins: DEFAULT_MARGINS,
  },
  behavior: {
    canResize: true,
    canMinimize: true,
    canMaximize: true,
    stackingOffset: { x: 20, y: 20 },
  },
  metadata: {
    icon: 'window',
    category: 'system'
  },
  component: () => null
};

// Window Apps
export const APP_CONFIGS: Record<AppId, AppWindowConfig> = {
  programs: {
    type: 'window',
    title: 'Programs',
    size: {
      defaultSize: {
        width: { value: 37.5, unit: 'rem' },
        height: { value: 25, unit: 'rem' },
      },
      minSize: {
        width: { value: 25, unit: 'rem' },
        height: { value: 18.75, unit: 'rem' },
      },
    },
    position: {
      preferred: 'center',
      margins: DEFAULT_MARGINS,
    },
    behavior: {
      canResize: true,
      canMinimize: true,
      canMaximize: true,
      stackingOffset: { x: 1.25, y: 1.25 },
    },
    metadata: {
      icon: 'programs',
      description: 'System Programs',
      category: 'system'
    },
    component: () => null
  },

  fileexplorer: {
    type: 'window',
    title: 'File Explorer',
    size: {
      defaultSize: {
        width: { value: 50, unit: 'rem' },
        height: { value: 37.5, unit: 'rem' },
      },
      minSize: {
        width: { value: 25, unit: 'rem' },
        height: { value: 18.75, unit: 'rem' },
      },
      maxSize: {
        width: { value: 75, unit: 'rem' },
        height: { value: 56.25, unit: 'rem' },
      }
    },
    position: {
      preferred: 'center',
      margins: DEFAULT_MARGINS,
    },
    behavior: {
      canResize: true,
      canMinimize: true,
      canMaximize: true,
      stackingOffset: { x: 20, y: 20 },
    },
    metadata: {
      icon: 'folder',
      description: 'Browse and manage files',
      category: 'system',
      defaultPath: '/files'
    },
    component: FileExplorer
  },

  governance: {
    type: 'window',
    title: 'Camp',
    size: {
      defaultSize: {
        width: { value: 80, unit: 'rem' },
        height: { value: 46.5, unit: 'rem' },
      },
      minSize: {
        width: { value: 25, unit: 'rem' },
        height: { value: 18.75, unit: 'rem' },
      },
    },
    position: {
      preferred: 'topLeft',
      margins: DEFAULT_MARGINS,
    },
    behavior: {
      canResize: true,
      canMinimize: true,
      canMaximize: true,
      stackingOffset: { x: 1.25, y: 1.25 },
    },
    metadata: {
      icon: 'governance',
      description: 'Nouns DAO Governance',
      category: 'nouns'
    },
    component: Governance
  },

  probe: {
    type: 'window',
    title: 'Probe',
    size: {
      defaultSize: {
        width: { value: 60, unit: 'rem' },
        height: { value: 40, unit: 'rem' },
      },
      minSize: {
        width: { value: 25, unit: 'rem' },
        height: { value: 18.75, unit: 'rem' },
      },
    },
    position: {
      preferred: 'center',
      margins: DEFAULT_MARGINS,
    },
    behavior: {
      canResize: true,
      canMinimize: true,
      canMaximize: true,
      stackingOffset: { x: 20, y: 20 },
    },
    metadata: {
      icon: 'probe',
      description: 'Nouns data analysis and investigation tool',
      category: 'nouns'
    },
    component: Probe
  },

  studio: {
    type: 'window',
    title: 'Noundry',
    size: {
      defaultSize: {
        width: { value: 65, unit: 'rem' },
        height: { value: 45, unit: 'rem' }
      },
      minSize: {
        width: { value: 65, unit: 'rem' },
        height: { value: 45, unit: 'rem' }
      },
    },
    position: {
      preferred: 'center',
      margins: DEFAULT_MARGINS,
    },
    behavior: {
      canResize: true,
      canMinimize: true,
      canMaximize: true,
      stackingOffset: { x: 20, y: 20 },
    },
    metadata: {
      icon: 'studio',
      description: 'Studio for creating and editing content',
      category: 'system'
    },
    component: Studio
  },

  settings: {
    type: 'window',
    title: 'Settings',
    size: {
      defaultSize: {
        width: { value: 37.5, unit: 'rem' },
        height: { value: 31.25, unit: 'rem' },
      },
      minSize: {
        width: { value: 25, unit: 'rem' },
        height: { value: 18.75, unit: 'rem' },
      },
    },
    position: {
      preferred: 'center',
      margins: DEFAULT_MARGINS,
    },
    behavior: {
      canResize: true,
      canMinimize: true,
      canMaximize: false,
    },
    metadata: {
      icon: 'settings',
      description: 'System settings and configuration',
      category: 'system'
    },
    component: () => null
  },

// MiniApps

  auction: {
    type: 'miniapp',
    title: 'Auction',
    size: {
      defaultSize: {
        width: { value: 52, unit: 'rem' },
        height: { value: 38, unit: 'rem' },
      },
      minSize: {
        width: { value: 37.5, unit: 'rem' },
        height: { value: 25, unit: 'rem' },
      },
      maxSize: {
        width: { value: 75, unit: 'rem' },
        height: { value: 50, unit: 'rem' },
      },
    },
    position: {
      preferred: 'bottomRight',
      margins: {
        top: { value: 0, unit: 'rem' },
        right: { value: 2.5, unit: 'rem' },
        bottom: { value: 3, unit: 'rem' },
        left: { value: 0, unit: 'rem' },
      },
    },
    behavior: {
      canResize: false,
      canMinimize: false,
      canMaximize: false,
    },
    metadata: {
      icon: 'auction',
      description: 'Nouns DAO Auction House',
      category: 'dao'
    },
    component: Auction
  },

  chat: {
    type: 'miniapp',
    title: 'Chat',
    size: {
      defaultSize: {
        width: { value: 50, unit: 'rem' },
        height: { value: 37.5, unit: 'rem' },
      },
      minSize: {
        width: { value: 25, unit: 'rem' },
        height: { value: 18.75, unit: 'rem' },
      },
    },
    position: {
      preferred: 'bottomRight',
      margins: DEFAULT_MARGINS,
    },
    behavior: {
      canResize: true,
      canMinimize: true,
      canMaximize: false,
      stackingOffset: { x: 1.25, y: 1.25 },
    },
    metadata: {
      icon: 'chat',
      description: 'Push Protocol Chat',
      category: 'communication'
    },
    component: Chat
  },

  shutdown: {
    type: 'window',
    title: 'Shutdown',
    size: {
      defaultSize: {
        width: { value: 50, unit: 'rem' },
        height: { value: 37.5, unit: 'rem' }
      },
      minSize: {
        width: { value: 25, unit: 'rem' },
        height: { value: 18.75, unit: 'rem' }
      },
    },
    position: {
      preferred: 'center',
      margins: DEFAULT_MARGINS,
    },
    behavior: {
      canResize: true,
      canMinimize: true,
      canMaximize: true,
      stackingOffset: { x: 1.25, y: 1.25 },
    },
    metadata: {
      icon: 'shutdown',
      description: 'System shutdown options',
      category: 'system'
    },
    component: () => null
  },

  tabs: {
    type: 'miniapp',
    title: 'Tabs',
    size: {
      defaultSize: {
        width: { value: 32, unit: 'rem' },
        height: { value: 36, unit: 'rem' },
      },
      minSize: {
        width: { value: 20, unit: 'rem' },
        height: { value: 15, unit: 'rem' },
      },
      maxSize: {
        width: { value: 32, unit: 'rem' },
        height: { value: 36, unit: 'rem' },
      },
    },
    position: {
      preferred: 'topRight',
      margins: DEFAULT_MARGINS,
    },
    behavior: {
      canResize: false,
      canMinimize: false,
      canMaximize: false,
      stackingOffset: { x: 20, y: 20 },
    },
    metadata: {
      icon: 'tabs',
      description: 'Manage open windows and applications',
      category: 'utilities'
    },
    component: Tabs
  },

  wallet: {
    type: 'miniapp',
    title: 'Wallet',
    size: {
      defaultSize: {
        width: { value: 16, unit: 'rem' },
        height: { value: 25, unit: 'rem' },
      },
      minSize: {
        width: { value: 16, unit: 'rem' },
        height: { value: 25, unit: 'rem' },
      },
      maxSize: {
        width: { value: 16, unit: 'rem' },
        height: { value: 25, unit: 'rem' },
      },
    },
    position: {
      preferred: 'bottomRight',
      margins: {
        top: { value: 0, unit: 'rem' },
        right: { value: 1.5, unit: 'rem' },
        bottom: { value: 1, unit: 'rem' },
        left: { value: 0, unit: 'rem' },
      },
    },
    behavior: {
      canResize: false,
      canMinimize: false,
      canMaximize: false,
    },
    metadata: {
      icon: 'wallet',
      description: 'Manage your crypto wallet',
      category: 'finance'
    },
    component: WalletApp
  },
};



// Helper functions
export const getAppConfig = (appId: AppId | string): AppWindowConfig => {
  return APP_CONFIGS[appId as AppId] || DEFAULT_WINDOW_CONFIG;
};

export const isMiniApp = (appId: AppId | string): boolean => {
  return getAppConfig(appId).type === 'miniapp';
};

export const getDefaultSize = (appId: AppId | string): WindowDimensions => {
  return getAppConfig(appId).size.defaultSize;
};

export const getWindowConstraints = (appId: AppId | string) => {
  const config = getAppConfig(appId);
  return {
    min: config.size.minSize,
    max: config.size.maxSize
  };
};

export const getWindowBehavior = (appId: AppId | string) => {
  return getAppConfig(appId).behavior;
};

export const getAppMetadata = (appId: AppId | string) => {
  return getAppConfig(appId).metadata || {};
};

// Export utility functions for use in other components
export const getWindowDimensions = (appId: AppId | string): { width: number; height: number } => {
  const size = getDefaultSize(appId);
  return {
    width: convertToPixels(size.width),
    height: convertToPixels(size.height)
  };
};

export const getMarginValues = (appId: AppId | string) => {
  const margins = getAppConfig(appId).position.margins;
  return {
    top: convertToPixels(margins.top || DEFAULT_MARGINS.top),
    right: convertToPixels(margins.right || DEFAULT_MARGINS.right),
    bottom: convertToPixels(margins.bottom || DEFAULT_MARGINS.bottom),
    left: convertToPixels(margins.left || DEFAULT_MARGINS.left)
  };
}; 