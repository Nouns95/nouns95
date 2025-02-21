import { Window, WindowSizeValue } from './Window';

export interface MiniApp extends Omit<Window, 'size' | 'canResize'> {
  size: {
    width: WindowSizeValue;
    height: WindowSizeValue;
  };
  canResize: false;
  isPinned: boolean;
  miniAppId: string;
}

export interface MiniAppConfig {
  id: string;
  title: string;
  width: WindowSizeValue;
  height: WindowSizeValue;
  icon?: string;
  isPinned?: boolean;
} 