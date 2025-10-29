import { useEffect, useRef, useCallback } from 'react';

interface ComponentStats {
  totalRenders: number;
  lastRender: number;
  renderHistory: number[];
  isLooping: boolean;
  loopDetectedAt?: number;
}

class RenderLogger {
  private static instance: RenderLogger;
  private logs: Map<string, ComponentStats> = new Map();
  private isEnabled: boolean = process.env.NODE_ENV === 'development';
  private maxRenderHistory: number = 50;
  private loopThreshold: number = 10; // renders within 1 second
  private loopTimeWindow: number = 1000; // 1 second

  static getInstance(): RenderLogger {
    if (!RenderLogger.instance) {
      RenderLogger.instance = new RenderLogger();
    }
    return RenderLogger.instance;
  }

  private constructor() {
    if (this.isEnabled) {
      // Add global error listener for infinite loop detection
      window.addEventListener('error', this.handleGlobalError.bind(this));
    }
  }

  private handleGlobalError(event: ErrorEvent) {
    if (event.message.includes('Maximum update depth exceeded')) {
      console.error('🔄 Infinite loop detected by global error handler');
      this.logInfiniteLoopError();
    }
  }

  private logInfiniteLoopError() {
    const suspiciousComponents = Array.from(this.logs.entries())
      .filter(([_, stats]) => stats.isLooping)
      .map(([name, stats]) => ({ name, ...stats }));

    console.group('🚨 Infinite Loop Analysis');
    console.error('Suspicious components:', suspiciousComponents);
    console.error('All component stats:', Object.fromEntries(this.logs));
    console.groupEnd();
  }

  logRender(componentName: string, props?: any, state?: any, reason?: string) {
    if (!this.isEnabled) return;

    const now = Date.now();
    const stats = this.logs.get(componentName) || {
      totalRenders: 0,
      lastRender: 0,
      renderHistory: [],
      isLooping: false,
    };

    stats.totalRenders++;
    stats.lastRender = now;
    stats.renderHistory.push(now);

    // Keep only recent renders
    if (stats.renderHistory.length > this.maxRenderHistory) {
      stats.renderHistory = stats.renderHistory.slice(-this.maxRenderHistory);
    }

    // Check for potential infinite loop
    const recentRenders = stats.renderHistory.filter(
      timestamp => now - timestamp < this.loopTimeWindow
    );

    if (recentRenders.length >= this.loopThreshold) {
      if (!stats.isLooping) {
        stats.isLooping = true;
        stats.loopDetectedAt = now;
        this.warnAboutPotentialLoop(componentName, stats, props, state, reason);
      }
    } else {
      stats.isLooping = false;
    }

    this.logs.set(componentName, stats);

    // Log render in development
    if (process.env.NODE_ENV === 'development' && stats.isLooping) {
      console.warn(`🔄 ${componentName} - Potential infinite loop detected (${recentRenders.length} renders in ${this.loopTimeWindow}ms)`);
    }
  }

  private warnAboutPotentialLoop(
    componentName: string,
    stats: ComponentStats,
    props?: any,
    state?: any,
    reason?: string
  ) {
    console.group(`🚨 Potential Infinite Loop: ${componentName}`);
    console.warn(`Component has rendered ${stats.totalRenders} times`);
    console.warn(`${this.loopThreshold} renders detected within ${this.loopTimeWindow}ms`);
    
    if (reason) {
      console.warn('Render reason:', reason);
    }
    
    if (props) {
      console.warn('Current props:', props);
    }
    
    if (state) {
      console.warn('Current state:', state);
    }
    
    console.warn('Render history:', stats.renderHistory);
    console.warn('Consider checking:');
    console.warn('- useEffect dependencies');
    console.warn('- State updates in render methods');
    console.warn('- Props that change on every render');
    console.warn('- Missing memoization');
    console.groupEnd();
  }

  getComponentStats(componentName?: string) {
    if (componentName) {
      return this.logs.get(componentName);
    }
    return Object.fromEntries(this.logs);
  }

  clearLogs() {
    this.logs.clear();
  }

  getLoopingComponents() {
    return Array.from(this.logs.entries())
      .filter(([_, stats]) => stats.isLooping)
      .map(([name, stats]) => ({ name, ...stats }));
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  setLoopThreshold(threshold: number) {
    this.loopThreshold = threshold;
  }

  setLoopTimeWindow(window: number) {
    this.loopTimeWindow = window;
  }
}

// Hook for logging component renders
export const useRenderLogger = (
  componentName: string,
  props?: any,
  state?: any,
  dependencies?: any[]
) => {
  const logger = RenderLogger.getInstance();
  const renderCount = useRef(0);
  const previousDeps = useRef(dependencies);

  // Determine render reason
  const getRenderReason = useCallback(() => {
    if (!dependencies) return 'Unknown';
    
    if (!previousDeps.current) {
      previousDeps.current = dependencies;
      return 'Initial render';
    }

    const changedDeps = dependencies
      .map((dep, index) => ({ index, current: dep, previous: previousDeps.current![index] }))
      .filter(({ current, previous }) => current !== previous);

    previousDeps.current = dependencies;

    if (changedDeps.length === 0) {
      return 'No dependency changes detected';
    }

    return `Dependencies changed: ${changedDeps.map(d => `[${d.index}]`).join(', ')}`;
  }, [dependencies]);

  useEffect(() => {
    renderCount.current++;
    const reason = getRenderReason();
    logger.logRender(componentName, props, state, reason);
  });

  return {
    renderCount: renderCount.current,
    getStats: () => logger.getComponentStats(componentName),
    clearLogs: () => logger.clearLogs(),
  };
};

// Hook for detecting infinite loops in useEffect
/* eslint-disable react-hooks/exhaustive-deps */
export const useEffectLogger = (
  effect: React.EffectCallback,
  deps: React.DependencyList | undefined,
  componentName: string
) => {
  const effectCount = useRef(0);
  const lastDeps = useRef(deps);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    effectCount.current++;
    
    // Log effect execution
    if (process.env.NODE_ENV === 'development') {
      const depsChanged = deps && lastDeps.current && 
        deps.some((dep, index) => dep !== lastDeps.current![index]);
      
      if (effectCount.current > 5) {
        console.warn(`⚠️ useEffect in ${componentName} has run ${effectCount.current} times`);
        console.warn('Dependencies:', deps);
        console.warn('Dependencies changed:', depsChanged);
      }
    }
    
    lastDeps.current = deps;
    return effect();
  }, deps);
};
/* eslint-enable react-hooks/exhaustive-deps */

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
  const startTime = useRef<number>();

  useEffect(() => {
    startTime.current = performance.now();
    
    return () => {
      if (startTime.current) {
        const renderTime = performance.now() - startTime.current;
        
        if (renderTime > 16) { // More than one frame (60fps)
          console.warn(`⏱️ ${componentName} render took ${renderTime.toFixed(2)}ms`);
        }
      }
    };
  });

  const measureRender = useCallback((callback: () => void) => {
    const start = performance.now();
    callback();
    const end = performance.now();
    
    if (end - start > 16) {
      console.warn(`⏱️ ${componentName} operation took ${(end - start).toFixed(2)}ms`);
    }
  }, [componentName]);

  return { measureRender };
};

// Global functions for debugging
if (typeof window !== 'undefined') {
  (window as any).renderLogger = {
    getStats: () => RenderLogger.getInstance().getComponentStats(),
    getLoopingComponents: () => RenderLogger.getInstance().getLoopingComponents(),
    clearLogs: () => RenderLogger.getInstance().clearLogs(),
    setEnabled: (enabled: boolean) => RenderLogger.getInstance().setEnabled(enabled),
  };
}

export default RenderLogger;