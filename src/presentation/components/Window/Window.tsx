"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Window as WindowType } from '@/src/domain/window/models/Window';
import { WindowService } from '@/src/domain/window/services/WindowService';
import TitleBar from './TitleBar';
import Icon from '../shared/Icon';
import styles from './Window.module.css';

interface WindowProps {
  window: WindowType;
  children: React.ReactNode;
}

const Window: React.FC<WindowProps> = ({ window, children }) => {
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
      if (isDragging && windowRef.current) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        windowService.moveWindow(window.id, { x: newX, y: newY });
      } else if (isResizing && windowRef.current && resizeEdge) {
        e.preventDefault();
        const deltaX = e.clientX - initialMousePosition.x;
        const deltaY = e.clientY - initialMousePosition.y;
        let newWidth = initialSize.width;
        let newHeight = initialSize.height;
        let newX = initialPosition.x;
        let newY = initialPosition.y;

        // Minimum window size
        const minWidth = 200;
        const minHeight = 150;

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

        windowService.resizeWindow(window.id, { width: newWidth, height: newHeight });
        if (newX !== initialPosition.x || newY !== initialPosition.y) {
          windowService.moveWindow(window.id, { x: newX, y: newY });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeEdge(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, window.id, windowService, resizeEdge, initialSize, initialPosition, initialMousePosition]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
      windowService.focusWindow(window.id);
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
    windowService.focusWindow(window.id);
  };

  const handleClose = () => {
    windowService.closeWindow(window.id);
  };

  const handleMinimize = () => {
    windowService.minimizeWindow(window.id);
  };

  const handleMaximize = () => {
    if (window.isMaximized) {
      windowService.restoreWindow(window.id);
    } else {
      windowService.maximizeWindow(window.id);
    }
  };

  const windowStyle = {
    left: window.position.x,
    top: window.position.y,
    width: window.size.width,
    height: window.size.height,
    zIndex: window.zIndex,
    display: window.isMinimized ? 'none' : 'flex',
    cursor: isResizing ? 
      resizeEdge === 'se' || resizeEdge === 'nw' ? 'nw-resize' :
      resizeEdge === 'sw' || resizeEdge === 'ne' ? 'ne-resize' :
      resizeEdge === 'n' || resizeEdge === 's' ? 'ns-resize' :
      'ew-resize' : undefined
  };

  return (
    <div
      ref={windowRef}
      className={`${styles.window} ${window.isFocused ? styles.focused : ''} ${window.isMaximized ? styles.maximized : ''}`}
      style={windowStyle}
      onClick={() => windowService.focusWindow(window.id)}
    >
      <TitleBar
        title={window.title}
        applicationId={window.applicationId}
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
