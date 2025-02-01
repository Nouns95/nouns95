import { WindowCoordinates, WindowDimensions, WindowSizeValue } from '../models/Window';

// App types
export type AppType = 'window' | 'miniapp';
export type AppId = 'wallet' | 'fileexplorer' | 'settings' | 'programs';

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
}

// Utility functions for unit conversion
const convertToPixels = (value: WindowMargin | WindowSizeValue): number => {
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

const TASKBAR_HEIGHT = 28; // Updated to match actual taskbar height

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
  top: { value: 20, unit: 'px' },
  right: { value: 20, unit: 'px' },
  bottom: { value: 20, unit: 'px' },
  left: { value: 20, unit: 'px' }
};

const DEFAULT_SIZE: WindowDimensions = {
  width: { value: 800, unit: 'px' },
  height: { value: 600, unit: 'px' }
};

const DEFAULT_MIN_SIZE: WindowDimensions = {
  width: { value: 400, unit: 'px' },
  height: { value: 300, unit: 'px' }
};

// App-specific configurations
export const APP_CONFIGS: Record<AppId | 'default', AppWindowConfig> = {
  default: {
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
    }
  },
  
  programs: {
    type: 'window',
    title: 'Programs',
    size: {
      defaultSize: {
        width: { value: 600, unit: 'px' },
        height: { value: 400, unit: 'px' },
      },
      minSize: {
        width: { value: 400, unit: 'px' },
        height: { value: 300, unit: 'px' },
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
      icon: 'programs',
      description: 'System Programs',
      category: 'system'
    }
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
        top: { value: 0, unit: 'px' },
        right: { value: 1.5, unit: 'rem' },
        bottom: { value: 0.5, unit: 'rem' },
        left: { value: 0, unit: 'px' },
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
    }
  },

  fileexplorer: {
    type: 'window',
    title: 'File Explorer',
    size: {
      defaultSize: {
        width: { value: 800, unit: 'px' },
        height: { value: 600, unit: 'px' },
      },
      minSize: {
        width: { value: 400, unit: 'px' },
        height: { value: 300, unit: 'px' },
      },
      maxSize: {
        width: { value: 1200, unit: 'px' },
        height: { value: 900, unit: 'px' },
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
    }
  },

  settings: {
    type: 'window',
    title: 'Settings',
    size: {
      defaultSize: {
        width: { value: 600, unit: 'px' },
        height: { value: 500, unit: 'px' },
      },
      minSize: {
        width: { value: 400, unit: 'px' },
        height: { value: 300, unit: 'px' },
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
    }
  }
};

// Helper functions
export const getAppConfig = (appId: AppId | string): AppWindowConfig => {
  return APP_CONFIGS[appId as AppId] || APP_CONFIGS.default;
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