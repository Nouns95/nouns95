export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
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

export interface Window {
  id: string;
  title: string;
  position: WindowPosition;
  size: WindowSize;
  zIndex: number;
  isFocused: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  processId: string;
  applicationId: string;
  icon?: string;
  canResize: boolean;
  metadata?: WindowMetadata;
}
