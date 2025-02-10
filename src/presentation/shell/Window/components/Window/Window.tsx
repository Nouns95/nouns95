"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { WindowService } from '@/src/domain/shell/window/services/WindowService';
import { TitleBar } from '@/src/presentation/shell/Window';
import styles from './Window.module.css';
import { WindowCoordinates, WindowDimensions, WindowMetadata } from '@/src/domain/shell/window/models/Window';
import { getAppConfig } from '@/src/domain/shell/window/config/AppConfig';

interface WindowState {
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
  miniAppId?: string;
  isPinned?: boolean;
}

interface WindowProps {
  id: string;
  title: string;
  window: WindowState;
  children?: React.ReactNode;
  className?: string;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const Window: React.FC<WindowProps> = ({
  id,
  title,
  window: windowState,
  children,
  className,
  onDragStart,
  onDragEnd
}) => {
  const windowRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeEdge, setResizeEdge] = useState<string | null>(null);
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
  const [initialMousePosition, setInitialMousePosition] = useState({ x: 0, y: 0 });
  const windowService = WindowService.getInstance();
  const appConfig = getAppConfig(windowState.applicationId);

  // Convert size values to pixels based on unit
  const convertToPixels = (value: { value: number; unit: 'px' | 'rem' }): number => {
    if (value.unit === 'px') return value.value;
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return value.value * rootFontSize;
  };

  // Create size value with appropriate unit
  const createSizeValue = (value: number): { value: number; unit: 'px' | 'rem' } => ({
    value,
    unit: 'px'
  });

  // Get the configured size constraints
  const getSizeConstraints = useCallback(() => {
    const minWidth = convertToPixels(appConfig.size.minSize?.width || { value: 200, unit: 'px' });
    const minHeight = convertToPixels(appConfig.size.minSize?.height || { value: 150, unit: 'px' });
    const maxWidth = appConfig.size.maxSize ? convertToPixels(appConfig.size.maxSize.width) : Infinity;
    const maxHeight = appConfig.size.maxSize ? convertToPixels(appConfig.size.maxSize.height) : Infinity;
    return { minWidth, minHeight, maxWidth, maxHeight };
  }, [appConfig.size]);

  // Handle mouse movement for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && windowRef.current && !windowState.isMaximized) {
        e.preventDefault();
        const newX = Math.max(0, e.clientX - dragOffset.x);
        const newY = Math.max(0, e.clientY - dragOffset.y);
        
        windowRef.current.style.left = `${newX}px`;
        windowRef.current.style.top = `${newY}px`;
      } else if (isResizing && windowRef.current && resizeEdge) {
        e.preventDefault();
        const deltaX = e.clientX - initialMousePosition.x;
        const deltaY = e.clientY - initialMousePosition.y;
        let newWidth = initialSize.width;
        let newHeight = initialSize.height;
        let newX = initialPosition.x;
        let newY = initialPosition.y;

        // Get viewport dimensions
        const viewportHeight = globalThis.window.innerHeight;
        const taskbarHeight = 28;
        const maxY = viewportHeight - taskbarHeight;

        // Get configured size constraints
        const { minWidth, minHeight, maxWidth, maxHeight } = getSizeConstraints();

        if (resizeEdge.includes('e')) {
          newWidth = Math.min(maxWidth, Math.max(minWidth, initialSize.width + deltaX));
        }
        if (resizeEdge.includes('w')) {
          const width = Math.min(maxWidth, Math.max(minWidth, initialSize.width - deltaX));
          if (width !== initialSize.width) {
            newWidth = width;
            newX = initialPosition.x + deltaX;
          }
        }
        if (resizeEdge.includes('s')) {
          // Prevent resizing below taskbar
          const proposedHeight = initialSize.height + deltaY;
          const proposedBottom = initialPosition.y + proposedHeight;
          if (proposedBottom <= maxY) {
            newHeight = Math.min(maxHeight, Math.max(minHeight, proposedHeight));
          } else {
            newHeight = maxY - initialPosition.y;
          }
        }
        if (resizeEdge.includes('n')) {
          const height = Math.min(maxHeight, Math.max(minHeight, initialSize.height - deltaY));
          if (height !== initialSize.height) {
            newHeight = height;
            const proposedY = initialPosition.y + deltaY;
            // Ensure the bottom of the window doesn't go below taskbar
            const proposedBottom = proposedY + height;
            if (proposedBottom <= maxY) {
              newY = Math.max(0, proposedY);
            }
          }
        }

        windowService.resizeWindow(id, { 
          width: createSizeValue(newWidth), 
          height: createSizeValue(newHeight) 
        });
        if (newX !== initialPosition.x || newY !== initialPosition.y) {
          windowService.moveWindow(id, { x: newX, y: newY });
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging && windowRef.current && !windowState.isMaximized) {
        e.preventDefault();
        const newX = Math.max(0, e.clientX - dragOffset.x);
        const newY = Math.max(0, e.clientY - dragOffset.y);
        windowService.moveWindow(id, { x: newX, y: newY });
        onDragEnd?.();
      }
      setIsDragging(false);
      setIsResizing(false);
      setResizeEdge(null);
      document.body.style.cursor = '';
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove, true);
      document.addEventListener('mouseup', handleMouseUp, true);
      if (isDragging) {
        document.body.style.cursor = 'move';
      }
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('mouseup', handleMouseUp, true);
      document.body.style.cursor = '';
    };
  }, [
    isDragging,
    isResizing,
    dragOffset,
    resizeEdge,
    initialSize,
    initialPosition,
    initialMousePosition,
    id,
    windowState.isMaximized,
    windowService,
    onDragEnd,
    getSizeConstraints
  ]);

  const startDragging = (e: React.MouseEvent) => {
    if (e.button !== 0 || windowState.isMaximized) return; // Only handle left click and non-maximized windows
    e.preventDefault();
    e.stopPropagation();
    
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
      onDragStart?.();
      windowService.focusWindow(id);
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent, edge: string) => {
    if (!windowState.canResize || windowState.isMaximized) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = windowRef.current?.getBoundingClientRect();
    if (!rect) return;

    setIsResizing(true);
    setResizeEdge(edge);
    setInitialSize({ width: rect.width, height: rect.height });
    setInitialPosition({ x: rect.left, y: rect.top });
    setInitialMousePosition({ x: e.clientX, y: e.clientY });
    windowService.focusWindow(id);
  };

  if (windowState.isMinimized) {
    return null;
  }

  const style: React.CSSProperties = {
    position: 'absolute',
    left: windowState.position.x,
    top: windowState.position.y,
    width: windowState.isMaximized ? '100%' : convertToPixels(windowState.size.width),
    height: windowState.isMaximized ? '100%' : convertToPixels(windowState.size.height),
    zIndex: windowState.zIndex,
  };

  return (
    <div
      ref={windowRef}
      className={`${styles.window} ${windowState.isFocused ? styles.focused : ''} ${className || ''}`}
      style={style}
      onMouseDown={() => windowService.focusWindow(id)}
    >
      <TitleBar
        title={title}
        applicationId={windowState.applicationId}
        isMaximized={windowState.isMaximized}
        isFocused={windowState.isFocused}
        onMouseDown={startDragging}
        onClose={() => {
          if ('miniAppId' in windowState && windowState.miniAppId) {
            windowService.closeMiniApp(windowState.miniAppId);
          }
          windowService.closeWindow(id);
        }}
        onMinimize={appConfig.behavior.canMinimize ? () => windowService.minimizeWindow(id) : undefined}
        onMaximize={appConfig.behavior.canMaximize ? () => windowService.maximizeWindow(id) : undefined}
        onRestore={() => windowService.restoreWindow(id)}
      />
      <div className={styles.content}>
        {children}
      </div>
      {windowState.canResize && !windowState.isMaximized && (
        <>
          <div className={`${styles.resizeHandle} ${styles.n}`} onMouseDown={(e) => handleResizeMouseDown(e, 'n')} />
          <div className={`${styles.resizeHandle} ${styles.e}`} onMouseDown={(e) => handleResizeMouseDown(e, 'e')} />
          <div className={`${styles.resizeHandle} ${styles.s}`} onMouseDown={(e) => handleResizeMouseDown(e, 's')} />
          <div className={`${styles.resizeHandle} ${styles.w}`} onMouseDown={(e) => handleResizeMouseDown(e, 'w')} />
          <div className={`${styles.resizeHandle} ${styles.ne}`} onMouseDown={(e) => handleResizeMouseDown(e, 'ne')} />
          <div className={`${styles.resizeHandle} ${styles.se}`} onMouseDown={(e) => handleResizeMouseDown(e, 'se')} />
          <div className={`${styles.resizeHandle} ${styles.sw}`} onMouseDown={(e) => handleResizeMouseDown(e, 'sw')} />
          <div className={`${styles.resizeHandle} ${styles.nw}`} onMouseDown={(e) => handleResizeMouseDown(e, 'nw')} />
        </>
      )}
    </div>
  );
};

export default Window;