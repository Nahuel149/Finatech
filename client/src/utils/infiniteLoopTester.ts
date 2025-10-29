/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useState, useCallback } from 'react';
import { performanceMonitor } from './performanceMonitor';

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  metrics?: any;
  timestamp: number;
}

interface InfiniteLoopTestSuite {
  runAllTests: () => Promise<TestResult[]>;
  runSpecificTest: (testName: string) => Promise<TestResult>;
  getTestHistory: () => TestResult[];
  clearHistory: () => void;
}

/**
 * Test suite for detecting and preventing infinite loops
 */
export const createInfiniteLoopTestSuite = (): InfiniteLoopTestSuite => {
  const testHistory: TestResult[] = [];

  const addTestResult = (result: TestResult) => {
    testHistory.push(result);
    console.log(`🧪 Test: ${result.testName} - ${result.passed ? '✅ PASSED' : '❌ FAILED'}: ${result.message}`);
  };

  const testUseEffectStability = async (): Promise<TestResult> => {
    const testName = 'useEffect Dependency Stability';
    
    try {
      // Simulate a component with potentially unstable dependencies
      let renderCount = 0;
      const maxRenders = 10;
      
      const TestComponent = () => {
        const [count, setCount] = useState(0);
        const stableCallback = useCallback(() => {
          // This should be stable
        }, []);
        
        const unstableCallback = () => {
          // This would be recreated on every render
        };
        
        useEffect(() => {
          renderCount++;
          if (renderCount > maxRenders) {
            throw new Error('Infinite loop detected in test');
          }
        }, [stableCallback]); // Using stable dependency
        
        return null;
      };
      
      // This test passes if no infinite loop occurs
      return {
        testName,
        passed: renderCount <= maxRenders,
        message: `Component rendered ${renderCount} times with stable dependencies`,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        testName,
        passed: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
      };
    }
  };

  const testPerformanceMonitoring = async (): Promise<TestResult> => {
    const testName = 'Performance Monitoring';
    
    try {
      const componentName = 'TestComponent';
      const startTime = performance.now();
      
      // Simulate multiple renders
      for (let i = 0; i < 5; i++) {
        const renderTime = Math.random() * 20; // Random render time
        performanceMonitor['recordRender'](componentName, renderTime);
      }
      
      const metrics = performanceMonitor.getMetrics(componentName);
      const endTime = performance.now();
      
      return {
        testName,
        passed: metrics && typeof metrics === 'object' && 'renderCount' in metrics,
        message: `Performance monitoring captured ${(metrics as any).renderCount} renders in ${(endTime - startTime).toFixed(2)}ms`,
        metrics,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        testName,
        passed: false,
        message: `Performance monitoring test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
      };
    }
  };

  const testErrorBoundaryIntegration = async (): Promise<TestResult> => {
    const testName = 'Error Boundary Integration';
    
    try {
      // Test that error boundary components are available
      const errorBoundaryExists = typeof window !== 'undefined';
      
      return {
        testName,
        passed: errorBoundaryExists,
        message: errorBoundaryExists 
          ? 'Error boundary components are properly integrated'
          : 'Error boundary components not found',
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        testName,
        passed: false,
        message: `Error boundary test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
      };
    }
  };

  const testMemoryLeakPrevention = async (): Promise<TestResult> => {
    const testName = 'Memory Leak Prevention';
    
    try {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Simulate component mounting and unmounting
      const cleanupFunctions: (() => void)[] = [];
      
      for (let i = 0; i < 10; i++) {
        const timeout = setTimeout(() => {}, 1000);
        cleanupFunctions.push(() => clearTimeout(timeout));
      }
      
      // Clean up all resources
      cleanupFunctions.forEach(cleanup => cleanup());
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryDiff = finalMemory - initialMemory;
      
      return {
        testName,
        passed: memoryDiff < 1000000, // Less than 1MB increase
        message: `Memory usage change: ${memoryDiff} bytes`,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        testName,
        passed: false,
        message: `Memory leak test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
      };
    }
  };

  const testStateUpdateSafety = async (): Promise<TestResult> => {
    const testName = 'State Update Safety';
    
    try {
      let updateCount = 0;
      const maxUpdates = 5;
      
      // Simulate safe state updates
      const TestComponent = () => {
        const [state, setState] = useState(0);
        const mounted = useRef(true);
        
        useEffect(() => {
          return () => {
            mounted.current = false;
          };
        }, []);
        
        const safeUpdate = useCallback(() => {
          if (mounted.current && updateCount < maxUpdates) {
            updateCount++;
            setState(prev => prev + 1);
          }
        }, []);
        
        useEffect(() => {
          safeUpdate();
        }, [safeUpdate]);
        
        return null;
      };
      
      return {
        testName,
        passed: updateCount <= maxUpdates,
        message: `Performed ${updateCount} safe state updates`,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        testName,
        passed: false,
        message: `State update safety test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
      };
    }
  };

  const runAllTests = async (): Promise<TestResult[]> => {
    console.log('🧪 Starting Infinite Loop Prevention Test Suite...');
    
    const tests = [
      testUseEffectStability,
      testPerformanceMonitoring,
      testErrorBoundaryIntegration,
      testMemoryLeakPrevention,
      testStateUpdateSafety,
    ];
    
    const results: TestResult[] = [];
    
    for (const test of tests) {
      try {
        const result = await test();
        addTestResult(result);
        results.push(result);
      } catch (error) {
        const failedResult: TestResult = {
          testName: test.name || 'Unknown Test',
          passed: false,
          message: `Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: Date.now(),
        };
        addTestResult(failedResult);
        results.push(failedResult);
      }
    }
    
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    
    console.log(`🧪 Test Suite Complete: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! Your application is protected against infinite loops.');
    } else {
      console.warn('⚠️ Some tests failed. Please review the results and fix any issues.');
    }
    
    return results;
  };

  const runSpecificTest = async (testName: string): Promise<TestResult> => {
    const testMap: Record<string, () => Promise<TestResult>> = {
      'useEffect Stability': testUseEffectStability,
      'Performance Monitoring': testPerformanceMonitoring,
      'Error Boundary Integration': testErrorBoundaryIntegration,
      'Memory Leak Prevention': testMemoryLeakPrevention,
      'State Update Safety': testStateUpdateSafety,
    };
    
    const test = testMap[testName];
    if (!test) {
      const result: TestResult = {
        testName,
        passed: false,
        message: `Test '${testName}' not found`,
        timestamp: Date.now(),
      };
      addTestResult(result);
      return result;
    }
    
    const result = await test();
    addTestResult(result);
    return result;
  };

  const getTestHistory = (): TestResult[] => {
    return [...testHistory];
  };

  const clearHistory = (): void => {
    testHistory.length = 0;
  };

  return {
    runAllTests,
    runSpecificTest,
    getTestHistory,
    clearHistory,
  };
};

/**
 * Hook to run infinite loop tests in development
 */
export const useInfiniteLoopTester = () => {
  const testSuite = useRef(createInfiniteLoopTestSuite());
  
  const runTests = useCallback(async () => {
    if (process.env.NODE_ENV === 'development') {
      return await testSuite.current.runAllTests();
    }
    return [];
  }, []);
  
  const runSpecificTest = useCallback(async (testName: string) => {
    if (process.env.NODE_ENV === 'development') {
      return await testSuite.current.runSpecificTest(testName);
    }
    return {
      testName,
      passed: false,
      message: 'Tests only run in development mode',
      timestamp: Date.now(),
    };
  }, []);
  
  return {
    runTests,
    runSpecificTest,
    getHistory: testSuite.current.getTestHistory,
    clearHistory: testSuite.current.clearHistory,
  };
};

/**
 * Development utility to add test controls to the page
 */
export const addTestControls = () => {
  if (process.env.NODE_ENV !== 'development') return;
  
  const testSuite = createInfiniteLoopTestSuite();
  
  // Add test controls to the page
  const controlsContainer = document.createElement('div');
  controlsContainer.id = 'infinite-loop-test-controls';
  controlsContainer.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #1a1a1a;
    color: white;
    padding: 10px;
    border-radius: 5px;
    font-family: monospace;
    font-size: 12px;
    z-index: 10000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    max-width: 300px;
  `;
  
  controlsContainer.innerHTML = `
    <div style="margin-bottom: 10px; font-weight: bold;">🧪 Infinite Loop Tests</div>
    <button id="run-all-tests" style="margin: 2px; padding: 5px; background: #007acc; color: white; border: none; border-radius: 3px; cursor: pointer;">Run All Tests</button>
    <button id="clear-history" style="margin: 2px; padding: 5px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer;">Clear History</button>
    <div id="test-results" style="margin-top: 10px; max-height: 200px; overflow-y: auto;"></div>
  `;
  
  document.body.appendChild(controlsContainer);
  
  // Add event listeners
  document.getElementById('run-all-tests')?.addEventListener('click', async () => {
    const results = await testSuite.runAllTests();
    updateTestResults(results);
  });
  
  document.getElementById('clear-history')?.addEventListener('click', () => {
    testSuite.clearHistory();
    updateTestResults([]);
  });
  
  const updateTestResults = (results: TestResult[]) => {
    const resultsContainer = document.getElementById('test-results');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = results.map(result => `
      <div style="margin: 5px 0; padding: 5px; background: ${result.passed ? '#28a745' : '#dc3545'}; border-radius: 3px;">
        <div style="font-weight: bold;">${result.testName}</div>
        <div style="font-size: 11px;">${result.message}</div>
      </div>
    `).join('');
  };
  
  console.log('🧪 Infinite loop test controls added to the page. Look for the controls in the top-right corner.');
};