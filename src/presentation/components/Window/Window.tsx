"use client";

import React, { useRef, useEffect, useState } from 'react';
import { WindowService } from '@/src/domain/window/services/WindowService';
import TitleBar from './TitleBar';
import styles from './Window.module.css';
import { WindowCoordinates, WindowDimensions, WindowMetadata } from '@/src/domain/window/models/Window';
import { getAppConfig } from '@/src/domain/window/config/AppConfig';

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
  window,
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
  const appConfig = getAppConfig(window.applicationId);

  const convertToPixels = (value: { value: number; unit: 'px' | 'rem' }): number => {
    if (value.unit === 'px') return value.value;
    
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return value.value * rootFontSize;
  };

  const createSizeValue = (value: number): { value: number; unit: 'px' | 'rem' } => ({
    value,
    unit: 'px'
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && windowRef.current && !window.isMaximized) {
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

        if (resizeEdge.includes('e')) {
          newWidth = Math.max(400, initialSize.width + deltaX);
        }
        if (resizeEdge.includes('w')) {
          const width = Math.max(400, initialSize.width - deltaX);
          if (width !== initialSize.width) {
            newWidth = width;
            newX = initialPosition.x + deltaX;
          }
        }
        if (resizeEdge.includes('s')) {
          newHeight = Math.max(300, initialSize.height + deltaY);
        }
        if (resizeEdge.includes('n')) {
          const height = Math.max(300, initialSize.height - deltaY);
          if (height !== initialSize.height) {
            newHeight = height;
            newY = Math.max(0, initialPosition.y + deltaY);
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
      if (isDragging && windowRef.current && !window.isMaximized) {
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
    window.isMaximized,
    windowService,
    onDragEnd
  ]);

  const startDragging = (e: React.MouseEvent) => {
    if (e.button !== 0 || window.isMaximized) return; // Only handle left click and non-maximized windows
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
    if (!window.canResize || window.isMaximized) return;
    
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

  if (window.isMinimized) {
    return null;
  }

  const style: React.CSSProperties = {
    position: 'absolute',
    left: window.position.x,
    top: window.position.y,
    width: window.isMaximized ? '100%' : convertToPixels(window.size.width),
    height: window.isMaximized ? '100%' : convertToPixels(window.size.height),
    zIndex: window.zIndex,
  };

  return (
    <div
      ref={windowRef}
      className={`${styles.window} ${window.isFocused ? styles.focused : ''} ${className || ''}`}
      style={style}
      onMouseDown={() => windowService.focusWindow(id)}
    >
      <TitleBar
        title={title}
        applicationId={window.applicationId}
        isMaximized={window.isMaximized}
        isFocused={window.isFocused}
        onMouseDown={startDragging}
        onClose={() => {
          if ('miniAppId' in window && window.miniAppId) {
            windowService.closeMiniApp(window.miniAppId);
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
      {window.canResize && !window.isMaximized && (
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