import { Window } from './Window';

export interface WindowState {
  windows: { [id: string]: Window };
  focusOrder: string[];
  activeWindowId: string | null;
  lastPosition: { x: number; y: number };
  lastSize: { width: number; height: number };
}

export type WindowAction = 
  | { type: 'CREATE_WINDOW'; window: Window }
  | { type: 'CLOSE_WINDOW'; id: string }
  | { type: 'FOCUS_WINDOW'; id: string }
  | { type: 'MINIMIZE_WINDOW'; id: string }
  | { type: 'MAXIMIZE_WINDOW'; id: string }
  | { type: 'RESTORE_WINDOW'; id: string }
  | { type: 'MOVE_WINDOW'; id: string; position: { x: number; y: number } }
  | { type: 'RESIZE_WINDOW'; id: string; size: { width: number; height: number } }
  | { type: 'UPDATE_Z_INDEX'; id: string; zIndex: number };
