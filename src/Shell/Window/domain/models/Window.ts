import { AppWindowConfig } from '../../../../Apps/AppConfig';

// Basic position interface for window placement
export interface WindowCoordinates {
  x: number;
  y: number;
}

// Basic size value interface
export interface WindowSizeValue {
  value: number;
  unit: 'px' | 'rem';
}

// Window size interface
export interface WindowDimensions {
  width: WindowSizeValue;
  height: WindowSizeValue;
}

export interface WindowMetadata {
  network?: 'ethereum' | 'solana';
  path?: string;
  fileType?: string;
  size?: number;
  created?: Date;
  modified?: Date;
  owner?: string;
  permissions?: string;
  customData?: Record<string, string | number | boolean>;
}

// Base window configuration from AppConfig
export interface WindowConfigProps {
  config: AppWindowConfig;
  processId: string;
  metadata?: WindowMetadata;
}

// Base window interface
export interface Window {
  id: string;
  title: string;
  position: WindowCoordinates;
  size: WindowDimensions;
  zIndex: number;
  isFocused: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  processId: string;
  applicationId: string;
  icon?: string;
  canResize: boolean;
  metadata?: WindowMetadata;
  prevState?: {
    position: WindowCoordinates;
    size: WindowDimensions;
  };
}

// MiniApp specific window interface
export interface MiniAppWindow extends Window {
  miniAppId: string;
  isPinned: boolean;
}

// Helper function to create a window from config
export function createWindowFromConfig({ config, processId, metadata }: WindowConfigProps): Omit<Window, 'id' | 'position' | 'zIndex' | 'isFocused' | 'isMinimized' | 'isMaximized'> {
  return {
    title: config.title,
    size: config.size.defaultSize,
    processId,
    applicationId: config.metadata?.icon || 'default',
    icon: config.metadata?.icon,
    canResize: config.behavior.canResize,
    metadata
  };
}
