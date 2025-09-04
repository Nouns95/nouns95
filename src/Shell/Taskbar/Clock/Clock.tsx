"use client";

import React, { useState, useEffect, useRef } from 'react';
import styles from './Clock.module.css';

// Global timer to prevent multiple clock instances
let globalClockTimer: NodeJS.Timeout | null = null;
const clockInstances = new Set<(time: Date) => void>();

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const updateTimeRef = useRef<(time: Date) => void | undefined>(undefined);
  const isRegisteredRef = useRef(false);

  useEffect(() => {
    // Create a stable reference to setTime for this component instance
    const stableSetTime = (newTime: Date) => setTime(newTime);
    updateTimeRef.current = stableSetTime;
    
    // Only register if not already registered
    if (!isRegisteredRef.current) {
      clockInstances.add(updateTimeRef.current);
      isRegisteredRef.current = true;
      
      // If this is the first clock instance, start the global timer
      if (clockInstances.size === 1 && !globalClockTimer) {
        globalClockTimer = setInterval(() => {
          const newTime = new Date();
          // Update all clock instances
          clockInstances.forEach(updateFn => {
            try {
              updateFn(newTime);
            } catch {
              // Remove broken references
              clockInstances.delete(updateFn);
            }
          });
        }, 1000);
      }
    }

    return () => {
      // Only unregister if actually registered
      if (isRegisteredRef.current && updateTimeRef.current) {
        clockInstances.delete(updateTimeRef.current);
        isRegisteredRef.current = false;
        
        // If no more instances, clear the global timer
        if (clockInstances.size === 0 && globalClockTimer) {
          clearInterval(globalClockTimer);
          globalClockTimer = null;
        }
      }
    };
  }, []); // Empty dependency array to prevent re-running

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className={styles.clock}>
      {formatTime(time)}
    </div>
  );
};

export default Clock; 