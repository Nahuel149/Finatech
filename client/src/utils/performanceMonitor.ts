import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  componentName: string;
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  totalRenderTime: number;
  slowRenders: number;
  fastRenders: number;
  renderHistory: Array<{
    timestamp: number;
    duration: number;
    props?: any;
    state?: any;
  }>;
}

interface PerformanceThresholds {
  slowRenderThreshold: number; // ms
  maxRenderHistory: number;
  warningRenderCount: number;
  criticalRenderCount: number;
}

class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetrics>();
  private thresholds: PerformanceThresholds = {
    slowRenderThreshold: 16, // 60fps = 16.67ms per frame
    maxRenderHistory: 100,
    warningRenderCount: 50,
    criticalRenderCount: 100,
  };

  setThresholds(thresholds: Partial<PerformanceThresholds>) {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  startRender(componentName: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.recordRender(componentName, duration);
    };
  }

  private recordRender(componentName: string, duration: number, props?: any, state?: any) {
    let metrics = this.metrics.get(componentName);
    
    if (!metrics) {
      metrics = {
        componentName,
        renderCount: 0,
        averageRenderTime: 0,
        lastRenderTime: 0,
        totalRenderTime: 0,
        slowRenders: 0,
        fastRenders: 0,
        renderHistory: [],
      };
      this.metrics.set(componentName, metrics);
    }

    metrics.renderCount++;
    metrics.lastRenderTime = duration;
    metrics.totalRenderTime += duration;
    metrics.averageRenderTime = metrics.totalRenderTime / metrics.renderCount;

    if (duration > this.thresholds.slowRenderThreshold) {
      metrics.slowRenders++;
    } else {
      metrics.fastRenders++;
    }

    // Add to history
    metrics.renderHistory.push({
      timestamp: Date.now(),
      duration,
      props: props ? JSON.stringify(props) : undefined,
      state: state ? JSON.stringify(state) : undefined,
    });

    // Trim history if too long
    if (metrics.renderHistory.length > this.thresholds.maxRenderHistory) {
      metrics.renderHistory = metrics.renderHistory.slice(-this.thresholds.maxRenderHistory);
    }

    // Check for performance issues
    this.checkPerformanceIssues(metrics);
  }

  private checkPerformanceIssues(metrics: PerformanceMetrics) {
    const { componentName, renderCount, averageRenderTime, slowRenders } = metrics;

    // Check for excessive renders
    if (renderCount === this.thresholds.warningRenderCount) {
      console.warn(
        `⚠️ Performance Warning: ${componentName} has rendered ${renderCount} times. ` +
        `Average render time: ${averageRenderTime.toFixed(2)}ms`
      );
    }

    if (renderCount === this.thresholds.criticalRenderCount) {
      console.error(
        `🚨 Performance Critical: ${componentName} has rendered ${renderCount} times! ` +
        `This may indicate an infinite render loop. ` +
        `Average render time: ${averageRenderTime.toFixed(2)}ms, ` +
        `Slow renders: ${slowRenders}`
      );
    }

    // Check for consistently slow renders
    const recentRenders = metrics.renderHistory.slice(-10);
    const recentSlowRenders = recentRenders.filter(
      render => render.duration > this.thresholds.slowRenderThreshold
    ).length;

    if (recentSlowRenders >= 8) {
      console.warn(
        `⚠️ Performance Warning: ${componentName} has ${recentSlowRenders}/10 recent slow renders. ` +
        `Consider optimizing this component.`
      );
    }
  }

  getMetrics(componentName?: string): PerformanceMetrics | Map<string, PerformanceMetrics> {
    if (componentName) {
      return this.metrics.get(componentName) || this.createEmptyMetrics(componentName);
    }
    return new Map(this.metrics);
  }

  private createEmptyMetrics(componentName: string): PerformanceMetrics {
    return {
      componentName,
      renderCount: 0,
      averageRenderTime: 0,
      lastRenderTime: 0,
      totalRenderTime: 0,
      slowRenders: 0,
      fastRenders: 0,
      renderHistory: [],
    };
  }

  generateReport(): string {
    const allMetrics = Array.from(this.metrics.values());
    
    if (allMetrics.length === 0) {
      return 'No performance data collected yet.';
    }

    const sortedByRenderCount = allMetrics.sort((a, b) => b.renderCount - a.renderCount);
    const sortedByAvgTime = allMetrics.sort((a, b) => b.averageRenderTime - a.averageRenderTime);

    let report = '\n📊 React Performance Report\n';
    report += '================================\n\n';

    report += '🔄 Most Frequently Rendered Components:\n';
    sortedByRenderCount.slice(0, 5).forEach((metrics, index) => {
      report += `${index + 1}. ${metrics.componentName}: ${metrics.renderCount} renders `;
      report += `(avg: ${metrics.averageRenderTime.toFixed(2)}ms)\n`;
    });

    report += '\n⏱️ Slowest Average Render Times:\n';
    sortedByAvgTime.slice(0, 5).forEach((metrics, index) => {
      report += `${index + 1}. ${metrics.componentName}: ${metrics.averageRenderTime.toFixed(2)}ms `;
      report += `(${metrics.renderCount} renders)\n`;
    });

    report += '\n🚨 Performance Issues:\n';
    const problematicComponents = allMetrics.filter(
      metrics => 
        metrics.renderCount > this.thresholds.warningRenderCount ||
        metrics.averageRenderTime > this.thresholds.slowRenderThreshold
    );

    if (problematicComponents.length === 0) {
      report += 'No performance issues detected.\n';
    } else {
      problematicComponents.forEach(metrics => {
        report += `- ${metrics.componentName}: `;
        if (metrics.renderCount > this.thresholds.criticalRenderCount) {
          report += `CRITICAL - ${metrics.renderCount} renders! `;
        } else if (metrics.renderCount > this.thresholds.warningRenderCount) {
          report += `WARNING - ${metrics.renderCount} renders `;
        }
        if (metrics.averageRenderTime > this.thresholds.slowRenderThreshold) {
          report += `Slow avg render: ${metrics.averageRenderTime.toFixed(2)}ms `;
        }
        report += '\n';
      });
    }

    return report;
  }

  reset(componentName?: string) {
    if (componentName) {
      this.metrics.delete(componentName);
    } else {
      this.metrics.clear();
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook to monitor component render performance
 */
export const usePerformanceMonitor = (
  componentName: string,
  props?: any,
  state?: any
) => {
  const renderStartTime = useRef<number>();
  const isFirstRender = useRef(true);

  // Start timing before render
  if (isFirstRender.current || renderStartTime.current === undefined) {
    renderStartTime.current = performance.now();
  }

  useEffect(() => {
    if (renderStartTime.current !== undefined) {
      const renderTime = performance.now() - renderStartTime.current;
      performanceMonitor['recordRender'](componentName, renderTime, props, state);
    }
    isFirstRender.current = false;
    renderStartTime.current = performance.now();
  });

  const getComponentMetrics = useCallback(() => {
    return performanceMonitor.getMetrics(componentName) as PerformanceMetrics;
  }, [componentName]);

  const resetComponentMetrics = useCallback(() => {
    performanceMonitor.reset(componentName);
  }, [componentName]);

  return {
    getMetrics: getComponentMetrics,
    reset: resetComponentMetrics,
  };
};

/**
 * Hook to detect render loops
 */
export const useRenderLoopDetector = (
  componentName: string,
  maxRendersPerSecond: number = 60
) => {
  const renderTimes = useRef<number[]>([]);
  const warningShown = useRef(false);

  useEffect(() => {
    const now = Date.now();
    renderTimes.current.push(now);

    // Keep only renders from the last second
    renderTimes.current = renderTimes.current.filter(time => now - time < 1000);

    if (renderTimes.current.length > maxRendersPerSecond && !warningShown.current) {
      console.error(
        `🚨 Render Loop Detected: ${componentName} rendered ${renderTimes.current.length} times in 1 second! ` +
        `This indicates a potential infinite render loop.`
      );
      warningShown.current = true;

      // Reset warning after 5 seconds
      setTimeout(() => {
        warningShown.current = false;
      }, 5000);
    }
  });

  return {
    getCurrentRenderRate: () => renderTimes.current.length,
    isRenderingTooFast: () => renderTimes.current.length > maxRendersPerSecond,
  };
};

/**
 * Development-only performance debugging utilities
 */
export const devPerformanceUtils = {
  logReport: () => {
    if (process.env.NODE_ENV === 'development') {
      console.log(performanceMonitor.generateReport());
    }
  },
  
  logComponentMetrics: (componentName: string) => {
    if (process.env.NODE_ENV === 'development') {
      const metrics = performanceMonitor.getMetrics(componentName) as PerformanceMetrics;
      console.table({
        'Component': metrics.componentName,
        'Render Count': metrics.renderCount,
        'Avg Render Time (ms)': metrics.averageRenderTime.toFixed(2),
        'Last Render Time (ms)': metrics.lastRenderTime.toFixed(2),
        'Slow Renders': metrics.slowRenders,
        'Fast Renders': metrics.fastRenders,
      });
    }
  },
  
  startGlobalMonitoring: () => {
    if (process.env.NODE_ENV === 'development') {
      // Log performance report every 30 seconds
      setInterval(() => {
        console.log(performanceMonitor.generateReport());
      }, 30000);
    }
  },
  
  exportMetrics: () => {
    if (process.env.NODE_ENV === 'development') {
      const allMetrics = performanceMonitor.getMetrics() as Map<string, PerformanceMetrics>;
      const exportData = Array.from(allMetrics.values());
      
      // Create downloadable JSON
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `react-performance-metrics-${new Date().toISOString()}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
    }
  },
};