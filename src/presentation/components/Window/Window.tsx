"use client";

import React, { useRef, useEffect, useState } from 'react';
import { WindowService } from '@/src/domain/window/services/WindowService';
import TitleBar from './TitleBar';
import styles from './Window.module.css';

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
  metadata?: {
    network?: 'ethereum' | 'solana';
    path?: string;
  };
}

interface WindowProps {
  id: string;
  title: string;
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
  window: WindowState;
  children?: React.ReactNode;
}

const Window: React.FC<WindowProps> = ({
  id,
  title,
  minWidth = 400,
  minHeight = 300,
  window,
  children
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && windowRef.current && !window.isMaximized) {
        e.preventDefault();
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
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
          newWidth = Math.max(minWidth, initialSize.width + deltaX);
        }
        if (resizeEdge.includes('w')) {
          const width = Math.max(minWidth, initialSize.width - deltaX);
          if (width !== initialSize.width) {
            newWidth = width;
            newX = initialPosition.x + deltaX;
          }
        }
        if (resizeEdge.includes('s')) {
          newHeight = Math.max(minHeight, initialSize.height + deltaY);
        }
        if (resizeEdge.includes('n')) {
          const height = Math.max(minHeight, initialSize.height - deltaY);
          if (height !== initialSize.height) {
            newHeight = height;
            newY = initialPosition.y + deltaY;
          }
        }

        windowService.resizeWindow(id, { width: newWidth, height: newHeight });
        if (newX !== initialPosition.x || newY !== initialPosition.y) {
          windowService.moveWindow(id, { x: newX, y: newY });
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging && windowRef.current && !window.isMaximized) {
        e.preventDefault();
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        windowService.moveWindow(id, { x: newX, y: newY });
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
    minWidth,
    minHeight,
    windowService
  ]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only handle left click
    e.preventDefault();
    e.stopPropagation();
    
    if (windowRef.current && !window.isMaximized) {
      const rect = windowRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
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

  const handleClose = () => {
    windowService.closeWindow(id);
  };

  const handleMinimize = () => {
    windowService.minimizeWindow(id);
  };

  const handleMaximize = () => {
    if (window && window.isMaximized) {
      windowService.restoreWindow(id);
    } else if (window) {
      windowService.maximizeWindow(id);
    }
  };

  const handleWindowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    windowService.focusWindow(id);
  };

  const windowStyle: React.CSSProperties = {
    position: 'absolute',
    left: window.position.x,
    top: window.position.y,
    width: window.isMaximized ? '100%' : window.size.width,
    height: window.isMaximized ? '100%' : window.size.height,
    minWidth,
    minHeight,
    zIndex: window.zIndex,
    display: window.isMinimized ? 'none' : 'flex',
    cursor: isResizing ? 
      resizeEdge === 'se' || resizeEdge === 'nw' ? 'nw-resize' :
      resizeEdge === 'sw' || resizeEdge === 'ne' ? 'ne-resize' :
      resizeEdge === 'n' || resizeEdge === 's' ? 'ns-resize' :
      'ew-resize' : undefined
  };

  if (window.isMinimized) {
    return null;
  }

  return (
    <div
      ref={windowRef}
      className={`${styles.window} ${window.isFocused ? styles.focused : ''} ${window.isMaximized ? styles.maximized : ''}`}
      style={windowStyle}
      onClick={handleWindowClick}
    >
      <TitleBar
        title={title}
        applicationId={window.appId}
        isMaximized={window.isMaximized}
        isFocused={window.isFocused}
        onMouseDown={handleMouseDown}
        onClose={handleClose}
        onMinimize={handleMinimize}
        onMaximize={window.canResize ? handleMaximize : undefined}
        onRestore={handleMaximize}
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
          <div className={`${styles.resizeHandle} ${styles.nw}`} onMouseDown={(e) => handleResizeMouseDown(e, 'nw')} />
          <div className={`${styles.resizeHandle} ${styles.ne}`} onMouseDown={(e) => handleResizeMouseDown(e, 'ne')} />
          <div className={`${styles.resizeHandle} ${styles.se}`} onMouseDown={(e) => handleResizeMouseDown(e, 'se')} />
          <div className={`${styles.resizeHandle} ${styles.sw}`} onMouseDown={(e) => handleResizeMouseDown(e, 'sw')} />
        </>
      )}
    </div>
  );
};

export default Window;