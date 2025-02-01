import { Window, MiniAppWindow } from './Window';

export interface WindowState {
  windows: Record<string, Window>;
  miniApps: Record<string, MiniAppWindow>;
  focusedWindowId: string | null;
  zIndexCounter: number;
}

export type WindowAction = 
  | { type: 'CREATE_WINDOW'; window: Window }
  | { type: 'CLOSE_WINDOW'; windowId: string }
  | { type: 'FOCUS_WINDOW'; windowId: string }
  | { type: 'MINIMIZE_WINDOW'; windowId: string }
  | { type: 'MAXIMIZE_WINDOW'; windowId: string }
  | { type: 'RESTORE_WINDOW'; windowId: string }
  | { type: 'MOVE_WINDOW'; windowId: string; position: Window['position'] }
  | { type: 'RESIZE_WINDOW'; windowId: string; size: Window['size'] }
  | { type: 'CREATE_MINIAPP'; miniApp: MiniAppWindow }
  | { type: 'CLOSE_MINIAPP'; miniAppId: string }
  | { type: 'PIN_MINIAPP'; miniAppId: string }
  | { type: 'UNPIN_MINIAPP'; miniAppId: string };
