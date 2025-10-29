import React, { useEffect, useRef, useCallback } from 'react';

interface UseEffectGuardOptions {
  maxExecutions?: number;
  timeWindow?: number;
  componentName?: string;
  onLoopDetected?: (componentName: string, executions: number) => void;
}

/**
 * A guarded version of useEffect that detects potential infinite loops
 * and prevents them from crashing the application
 */
export const useEffectGuard = (
  effect: React.EffectCallback,
  deps: React.DependencyList | undefined,
  options: UseEffectGuardOptions = {}
) => {
  const {
    maxExecutions = 10,
    timeWindow = 1000,
    componentName = 'Unknown Component',
    onLoopDetected,
  } = options;

  const executionHistory = useRef<number[]>([]);
  const isBlocked = useRef(false);
  const blockTimeout = useRef<NodeJS.Timeout>();

  const guardedEffect = useCallback(() => {
    const now = Date.now();
    
    // Clean old executions outside the time window
    executionHistory.current = executionHistory.current.filter(
      timestamp => now - timestamp < timeWindow
    );
    
    // Add current execution
    executionHistory.current.push(now);
    
    // Check if we're exceeding the limit
    if (executionHistory.current.length > maxExecutions) {
      if (!isBlocked.current) {
        isBlocked.current = true;
        
        console.error(
          `🚨 Infinite loop detected in ${componentName}! ` +
          `Effect executed ${executionHistory.current.length} times in ${timeWindow}ms. ` +
          `Blocking further executions for ${timeWindow * 2}ms.`
        );
        
        if (onLoopDetected) {
          onLoopDetected(componentName, executionHistory.current.length);
        }
        
        // Block executions for double the time window
        blockTimeout.current = setTimeout(() => {
          isBlocked.current = false;
          executionHistory.current = [];
          console.warn(`🔓 Unblocking ${componentName} effect executions`);
        }, timeWindow * 2);
      }
      
      return () => {}; // Return empty cleanup function
    }
    
    // If not blocked, execute the original effect
    if (!isBlocked.current) {
      return effect();
    }
    
    return () => {};
  }, [effect, maxExecutions, timeWindow, componentName, onLoopDetected]);

  useEffect(() => {
    return guardedEffect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (blockTimeout.current) {
        clearTimeout(blockTimeout.current);
      }
    };
  }, []);
};

/**
 * Hook to detect when dependencies change too frequently
 */
export const useDependencyTracker = (
  deps: React.DependencyList | undefined,
  componentName: string = 'Unknown Component'
) => {
  const previousDeps = useRef(deps);
  const changeHistory = useRef<{ timestamp: number; changes: string[] }[]>([]);
  
  useEffect(() => {
    const now = Date.now();
    const changes: string[] = [];
    
    if (previousDeps.current && deps) {
      deps.forEach((dep, index) => {
        if (dep !== previousDeps.current![index]) {
          changes.push(`[${index}]: ${JSON.stringify(previousDeps.current![index])} → ${JSON.stringify(dep)}`);
        }
      });
    }
    
    if (changes.length > 0) {
      changeHistory.current.push({ timestamp: now, changes });
      
      // Keep only recent changes (last 5 seconds)
      changeHistory.current = changeHistory.current.filter(
        entry => now - entry.timestamp < 5000
      );
      
      // Warn if too many changes
      if (changeHistory.current.length > 10) {
        console.warn(
          `⚠️ ${componentName} dependencies changing frequently:`,
          changeHistory.current
        );
      }
    }
    
    previousDeps.current = deps;
  });
  
  return {
    getChangeHistory: () => changeHistory.current,
    getRecentChanges: () => changeHistory.current.slice(-5),
  };
};

/**
 * Hook to prevent state updates during render
 */
export const useRenderSafeState = <T>(
  initialState: T | (() => T),
  componentName: string = 'Unknown Component'
) => {
  const [state, setState] = React.useState(initialState);
  const isRendering = useRef(false);
  const pendingUpdates = useRef<((prev: T) => T)[]>([]);
  
  // Mark rendering phase
  isRendering.current = true;
  
  const safeSetState = useCallback((update: T | ((prev: T) => T)) => {
    if (isRendering.current) {
      console.warn(
        `⚠️ ${componentName} attempted to update state during render. ` +
        `This will be deferred to avoid infinite loops.`
      );
      
      const updateFn = typeof update === 'function' ? update as (prev: T) => T : () => update;
      pendingUpdates.current.push(updateFn);
      return;
    }
    
    setState(update);
  }, [componentName]);
  
  // Process pending updates after render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    isRendering.current = false;
    
    if (pendingUpdates.current.length > 0) {
      const updates = pendingUpdates.current;
      pendingUpdates.current = [];
      
      setState(prevState => {
        return updates.reduce((acc, updateFn) => updateFn(acc), prevState);
      });
    }
  });
  
  return [state, safeSetState] as const;
};

/**
 * Hook to detect and prevent cascading updates
 */
export const useCascadeGuard = (
  componentName: string = 'Unknown Component',
  maxCascadeDepth: number = 5
) => {
  const cascadeDepth = useRef(0);
  const cascadeTimeout = useRef<NodeJS.Timeout>();
  
  const incrementCascade = useCallback(() => {
    cascadeDepth.current++;
    
    if (cascadeDepth.current > maxCascadeDepth) {
      console.error(
        `🚨 Cascade limit exceeded in ${componentName}! ` +
        `Depth: ${cascadeDepth.current}. This may indicate a cascading update loop.`
      );
      return false; // Prevent further updates
    }
    
    // Reset cascade depth after a delay
    if (cascadeTimeout.current) {
      clearTimeout(cascadeTimeout.current);
    }
    
    cascadeTimeout.current = setTimeout(() => {
      cascadeDepth.current = 0;
    }, 100);
    
    return true; // Allow update
  }, [componentName, maxCascadeDepth]);
  
  const resetCascade = useCallback(() => {
    cascadeDepth.current = 0;
    if (cascadeTimeout.current) {
      clearTimeout(cascadeTimeout.current);
    }
  }, []);
  
  useEffect(() => {
    return () => {
      if (cascadeTimeout.current) {
        clearTimeout(cascadeTimeout.current);
      }
    };
  }, []);
  
  return {
    incrementCascade,
    resetCascade,
    getCurrentDepth: () => cascadeDepth.current,
  };
};

// Re-export React's useState for consistency
export { useState } from 'react';