/**
 * Comprehensive Test Suite for Model Accuracy and Trade List Functionality
 * 
 * Provides automated testing for neural network model, trade analytics,
 * and data validation to ensure system reliability.
 */

import { hybridCalculator, TrainingData } from './neuralNetworkModel';
import { DataValidator } from './dataValidation';
import { Trade } from '../types';

export interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  details?: any;
  executionTime: number;
}

export interface TestSuite {
  modelAccuracyTests: TestResult[];
  tradeListTests: TestResult[];
  dataValidationTests: TestResult[];
  performanceTests: TestResult[];
  overallScore: number;
}

export class TestRunner {
  private static readonly TEST_TIMEOUT = 5000; // 5 seconds per test

  /**
   * Run all test suites
   */
  public static async runAllTests(): Promise<TestSuite> {
    console.log('🧪 Starting comprehensive test suite...');
    
    const startTime = Date.now();
    
    const modelAccuracyTests = await this.runModelAccuracyTests();
    const tradeListTests = await this.runTradeListTests();
    const dataValidationTests = await this.runDataValidationTests();
    const performanceTests = await this.runPerformanceTests();
    
    const totalTests = modelAccuracyTests.length + tradeListTests.length + 
                      dataValidationTests.length + performanceTests.length;
    const passedTests = [...modelAccuracyTests, ...tradeListTests, 
                        ...dataValidationTests, ...performanceTests]
                        .filter(test => test.passed).length;
    
    const overallScore = (passedTests / totalTests) * 100;
    
    console.log(`✅ Test suite completed in ${Date.now() - startTime}ms`);
    console.log(`📊 Overall Score: ${overallScore.toFixed(1)}% (${passedTests}/${totalTests} tests passed)`);
    
    return {
      modelAccuracyTests,
      tradeListTests,
      dataValidationTests,
      performanceTests,
      overallScore
    };
  }

  /**
   * Test neural network model accuracy
   */
  private static async runModelAccuracyTests(): Promise<TestResult[]> {
    const tests: TestResult[] = [];
    
    // Test 1: Basic model functionality
    tests.push(await this.runTest('Model Basic Functionality', async () => {
      const result = hybridCalculator.calculateTargetProfit(10000, 10, 70, 3, true);
      if (typeof result !== 'number' || isNaN(result)) {
        throw new Error('Model should return a valid number');
      }
      if (result < 0) {
        throw new Error('Model should return non-negative profit');
      }
      return { result };
    }));

    // Test 2: Edge case handling
    tests.push(await this.runTest('Model Edge Cases', async () => {
      const edgeCases = [
        { capital: 1000, trades: 1, accuracy: 50, rr: 1 },
        { capital: 1000000, trades: 100, accuracy: 90, rr: 10 },
        { capital: 100, trades: 5, accuracy: 30, rr: 0.5 }
      ];

      for (const testCase of edgeCases) {
        const result = hybridCalculator.calculateTargetProfit(
          testCase.capital, testCase.trades, testCase.accuracy, testCase.rr, true
        );
        if (typeof result !== 'number' || isNaN(result)) {
          throw new Error(`Edge case failed: ${JSON.stringify(testCase)}`);
        }
      }
      return { edgeCasesHandled: edgeCases.length };
    }));

    // Test 3: Model consistency
    tests.push(await this.runTest('Model Consistency', async () => {
      const testInputs = { capital: 10000, trades: 10, accuracy: 70, rr: 3 };
      const results = [];
      
      for (let i = 0; i < 5; i++) {
        results.push(hybridCalculator.calculateTargetProfit(
          testInputs.capital, testInputs.trades, testInputs.accuracy, testInputs.rr, true
        ));
      }
      
      const variance = Math.max(...results) - Math.min(...results);
      const maxVariance = testInputs.capital * 0.1; // 10% variance allowed
      
      if (variance > maxVariance) {
        throw new Error(`Model results too inconsistent: variance ${variance} > ${maxVariance}`);
      }
      
      return { variance, maxVariance, results };
    }));

    // Test 4: Training data validation
    tests.push(await this.runTest('Training Data Validation', async () => {
      const trainingData: TrainingData[] = [
        { capital: 10000, totalTrades: 10, accuracy: 70, riskRewardRatio: 3, expectedProfit: 100000 },
        { capital: 5000, totalTrades: 5, accuracy: 60, riskRewardRatio: 2, expectedProfit: 5000 },
        { capital: 20000, totalTrades: 20, accuracy: 80, riskRewardRatio: 4, expectedProfit: 500000 }
      ];

      const validation = DataValidator.validateTrainingData(trainingData);
      if (!validation.isValid) {
        throw new Error(`Training data validation failed: ${validation.errors.join(', ')}`);
      }
      
      return { validation };
    }));

    return tests;
  }

  /**
   * Test trade list functionality
   */
  private static async runTradeListTests(): Promise<TestResult[]> {
    const tests: TestResult[] = [];
    
    // Test 1: Trade data structure
    tests.push(await this.runTest('Trade Data Structure', async () => {
      const mockTrade: Trade = {
        id: 'test-1',
        userId: 'user-1',
        pairName: 'BTC/USD',
        entryPrice: 50000,
        exitPrice: 55000,
        investment: 1000,
        type: 'buy',
        date: '2024-01-01',
        status: 'won',
        profitOrLoss: 100,
        profitOrLossPercentage: 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Validate required fields
      const requiredFields = ['id', 'userId', 'pairName', 'entryPrice', 'investment', 'type', 'date', 'status'];
      for (const field of requiredFields) {
        if (!(field in mockTrade)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
      
      return { tradeStructure: 'valid' };
    }));

    // Test 2: Trade calculations
    tests.push(await this.runTest('Trade Calculations', async () => {
      const testCases = [
        { entry: 100, exit: 110, investment: 1000, type: 'buy' as const, expectedProfit: 100 },
        { entry: 100, exit: 90, investment: 1000, type: 'buy' as const, expectedProfit: -100 },
        { entry: 100, exit: 90, investment: 1000, type: 'sell' as const, expectedProfit: 100 },
        { entry: 100, exit: 110, investment: 1000, type: 'sell' as const, expectedProfit: -100 }
      ];

      for (const testCase of testCases) {
        const profitOrLoss = testCase.type === 'buy' 
          ? ((testCase.exit - testCase.entry) / testCase.entry) * testCase.investment
          : ((testCase.entry - testCase.exit) / testCase.entry) * testCase.investment;
        
        if (Math.abs(profitOrLoss - testCase.expectedProfit) > 0.01) {
          throw new Error(`Calculation error: expected ${testCase.expectedProfit}, got ${profitOrLoss}`);
        }
      }
      
      return { calculationsPassed: testCases.length };
    }));

    // Test 3: Trade filtering
    tests.push(await this.runTest('Trade Filtering', async () => {
      const mockTrades: Trade[] = [
        { id: '1', userId: 'user1', pairName: 'BTC/USD', entryPrice: 50000, investment: 1000, type: 'buy', date: '2024-01-01', status: 'won', profitOrLoss: 100, profitOrLossPercentage: 10, createdAt: '', updatedAt: '' },
        { id: '2', userId: 'user1', pairName: 'ETH/USD', entryPrice: 3000, investment: 500, type: 'sell', date: '2024-01-02', status: 'lost', profitOrLoss: -50, profitOrLossPercentage: -10, createdAt: '', updatedAt: '' },
        { id: '3', userId: 'user1', pairName: 'BTC/USD', entryPrice: 51000, investment: 2000, type: 'buy', date: '2024-01-03', status: 'pending', profitOrLoss: 0, profitOrLossPercentage: 0, createdAt: '', updatedAt: '' }
      ];

      // Test profit filtering
      const profitableTrades = mockTrades.filter(trade => trade.profitOrLoss > 0);
      if (profitableTrades.length !== 1) {
        throw new Error(`Expected 1 profitable trade, got ${profitableTrades.length}`);
      }

      // Test loss filtering
      const losingTrades = mockTrades.filter(trade => trade.profitOrLoss < 0);
      if (losingTrades.length !== 1) {
        throw new Error(`Expected 1 losing trade, got ${losingTrades.length}`);
      }

      // Test search filtering
      const btcTrades = mockTrades.filter(trade => trade.pairName.includes('BTC'));
      if (btcTrades.length !== 2) {
        throw new Error(`Expected 2 BTC trades, got ${btcTrades.length}`);
      }
      
      return { filteringTestsPassed: 3 };
    }));

    // Test 4: Trade statistics
    tests.push(await this.runTest('Trade Statistics', async () => {
      const mockTrades: Trade[] = [
        { id: '1', userId: 'user1', pairName: 'BTC/USD', entryPrice: 50000, investment: 1000, type: 'buy', date: '2024-01-01', status: 'won', profitOrLoss: 100, profitOrLossPercentage: 10, createdAt: '', updatedAt: '' },
        { id: '2', userId: 'user1', pairName: 'ETH/USD', entryPrice: 3000, investment: 500, type: 'sell', date: '2024-01-02', status: 'lost', profitOrLoss: -50, profitOrLossPercentage: -10, createdAt: '', updatedAt: '' },
        { id: '3', userId: 'user1', pairName: 'ADA/USD', entryPrice: 0.5, investment: 200, type: 'buy', date: '2024-01-03', status: 'won', profitOrLoss: 20, profitOrLossPercentage: 10, createdAt: '', updatedAt: '' }
      ];

      const totalTrades = mockTrades.length;
      const winningTrades = mockTrades.filter(trade => trade.profitOrLoss > 0).length;
      const totalProfit = mockTrades.reduce((sum, trade) => sum + trade.profitOrLoss, 0);
      const winRate = (winningTrades / totalTrades) * 100;

      if (totalTrades !== 3) {
        throw new Error(`Expected 3 total trades, got ${totalTrades}`);
      }
      if (winningTrades !== 2) {
        throw new Error(`Expected 2 winning trades, got ${winningTrades}`);
      }
      if (totalProfit !== 70) {
        throw new Error(`Expected total profit of 70, got ${totalProfit}`);
      }
      if (winRate !== (2/3) * 100) {
        throw new Error(`Expected win rate of ${(2/3) * 100}%, got ${winRate}%`);
      }
      
      return { totalTrades, winningTrades, totalProfit, winRate };
    }));

    return tests;
  }

  /**
   * Test data validation
   */
  private static async runDataValidationTests(): Promise<TestResult[]> {
    const tests: TestResult[] = [];
    
    // Test 1: Session validation
    tests.push(await this.runTest('Session Validation', async () => {
      const validSession = { capital: 10000, totalTrades: 10, accuracy: 70, riskRewardRatio: 3 };
      const invalidSession = { capital: -1000, totalTrades: 0, accuracy: 150, riskRewardRatio: -1 };

      const validResult = DataValidator.validateSession(validSession);
      const invalidResult = DataValidator.validateSession(invalidSession);

      if (!validResult.isValid) {
        throw new Error('Valid session should pass validation');
      }
      if (invalidResult.isValid) {
        throw new Error('Invalid session should fail validation');
      }
      
      return { validResult, invalidResult };
    }));

    // Test 2: Trade validation
    tests.push(await this.runTest('Trade Validation', async () => {
      const validTrade = {
        pairName: 'BTC/USD',
        entryPrice: 50000,
        exitPrice: 55000,
        investment: 1000,
        type: 'buy' as const,
        date: '2024-01-01',
        status: 'won' as const
      };

      const invalidTrade = {
        pairName: '',
        entryPrice: -1000,
        exitPrice: 0,
        investment: -500,
        type: 'invalid' as any,
        date: 'invalid-date',
        status: 'invalid' as any
      };

      const validResult = DataValidator.validateTrade(validTrade);
      const invalidResult = DataValidator.validateTrade(invalidTrade);

      if (!validResult.isValid) {
        throw new Error('Valid trade should pass validation');
      }
      if (invalidResult.isValid) {
        throw new Error('Invalid trade should fail validation');
      }
      
      return { validResult, invalidResult };
    }));

    // Test 3: Input sanitization
    tests.push(await this.runTest('Input Sanitization', async () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'Normal input',
        'Input with "quotes" and <tags>',
        'Very long input '.repeat(100)
      ];

      const sanitized = maliciousInputs.map(input => DataValidator.sanitizeInput(input));
      
      for (const sanitizedInput of sanitized) {
        if (sanitizedInput.includes('<') || sanitizedInput.includes('>')) {
          throw new Error('Sanitized input should not contain HTML tags');
        }
        if (sanitizedInput.length > 1000) {
          throw new Error('Sanitized input should be limited to 1000 characters');
        }
      }
      
      return { sanitizedInputs: sanitized.length };
    }));

    // Test 4: Numeric validation
    tests.push(await this.runTest('Numeric Validation', async () => {
      const testCases = [
        { value: '100', min: 0, max: 1000, allowDecimals: true, shouldPass: true },
        { value: '100.5', min: 0, max: 1000, allowDecimals: true, shouldPass: true },
        { value: '100.5', min: 0, max: 1000, allowDecimals: false, shouldPass: false },
        { value: 'abc', min: 0, max: 1000, allowDecimals: true, shouldPass: false },
        { value: '-10', min: 0, max: 1000, allowDecimals: true, shouldPass: false }
      ];

      for (const testCase of testCases) {
        const result = DataValidator.validateNumericInput(
          testCase.value, testCase.min, testCase.max, testCase.allowDecimals
        );
        
        if (result.isValid !== testCase.shouldPass) {
          throw new Error(`Numeric validation failed for ${testCase.value}: expected ${testCase.shouldPass}, got ${result.isValid}`);
        }
      }
      
      return { testCasesPassed: testCases.length };
    }));

    return tests;
  }

  /**
   * Test performance benchmarks
   */
  private static async runPerformanceTests(): Promise<TestResult[]> {
    const tests: TestResult[] = [];
    
    // Test 1: Model calculation speed
    tests.push(await this.runTest('Model Calculation Speed', async () => {
      const iterations = 100;
      const startTime = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        hybridCalculator.calculateTargetProfit(10000, 10, 70, 3, true);
      }
      
      const endTime = Date.now();
      const avgTime = (endTime - startTime) / iterations;
      const maxAllowedTime = 10; // 10ms per calculation
      
      if (avgTime > maxAllowedTime) {
        throw new Error(`Model calculation too slow: ${avgTime.toFixed(2)}ms > ${maxAllowedTime}ms`);
      }
      
      return { avgTime, iterations, maxAllowedTime };
    }));

    // Test 2: Large dataset handling
    tests.push(await this.runTest('Large Dataset Handling', async () => {
      const largeTradeList: Trade[] = [];
      const tradeCount = 1000;
      
      for (let i = 0; i < tradeCount; i++) {
        largeTradeList.push({
          id: `trade-${i}`,
          userId: 'user1',
          pairName: `PAIR${i % 10}/USD`,
          entryPrice: 100 + Math.random() * 1000,
          exitPrice: 100 + Math.random() * 1000,
          investment: 100 + Math.random() * 1000,
          type: Math.random() > 0.5 ? 'buy' : 'sell',
          date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'won',
          profitOrLoss: (Math.random() - 0.5) * 1000,
          profitOrLossPercentage: (Math.random() - 0.5) * 100,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      const startTime = Date.now();
      
      // Test filtering performance
      const profitableTrades = largeTradeList.filter(trade => trade.profitOrLoss > 0);
      const losingTrades = largeTradeList.filter(trade => trade.profitOrLoss < 0);
      
      // Test sorting performance
      const sortedTrades = [...largeTradeList].sort((a, b) => b.profitOrLoss - a.profitOrLoss);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      const maxAllowedTime = 100; // 100ms for 1000 trades
      
      if (processingTime > maxAllowedTime) {
        throw new Error(`Large dataset processing too slow: ${processingTime}ms > ${maxAllowedTime}ms`);
      }
      
      return { tradeCount, processingTime, maxAllowedTime, profitableTrades: profitableTrades.length };
    }));

    // Test 3: Memory usage
    tests.push(await this.runTest('Memory Usage', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Create large objects
      const largeArrays = [];
      for (let i = 0; i < 10; i++) {
        largeArrays.push(new Array(10000).fill(Math.random()));
      }
      
      const peakMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = peakMemory - initialMemory;
      const maxAllowedIncrease = 50 * 1024 * 1024; // 50MB
      
      if (memoryIncrease > maxAllowedIncrease) {
        throw new Error(`Memory usage too high: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB > ${maxAllowedIncrease / 1024 / 1024}MB`);
      }
      
      // Cleanup
      largeArrays.length = 0;
      
      return { memoryIncrease, maxAllowedIncrease };
    }));

    return tests;
  }

  /**
   * Run a single test with timeout
   */
  private static async runTest(testName: string, testFunction: () => Promise<any>): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const result = await Promise.race([
        testFunction(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), this.TEST_TIMEOUT)
        )
      ]);
      
      const executionTime = Date.now() - startTime;
      
      return {
        testName,
        passed: true,
        details: result,
        executionTime
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      return {
        testName,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime
      };
    }
  }

  /**
   * Generate test report
   */
  public static generateReport(testSuite: TestSuite): string {
    const report = [];
    
    report.push('# 🧪 Test Suite Report');
    report.push('');
    report.push(`**Overall Score: ${testSuite.overallScore.toFixed(1)}%**`);
    report.push('');
    
    // Model Accuracy Tests
    report.push('## 🧠 Model Accuracy Tests');
    testSuite.modelAccuracyTests.forEach(test => {
      const status = test.passed ? '✅' : '❌';
      report.push(`- ${status} ${test.testName} (${test.executionTime}ms)`);
      if (!test.passed && test.error) {
        report.push(`  - Error: ${test.error}`);
      }
    });
    report.push('');
    
    // Trade List Tests
    report.push('## 📊 Trade List Tests');
    testSuite.tradeListTests.forEach(test => {
      const status = test.passed ? '✅' : '❌';
      report.push(`- ${status} ${test.testName} (${test.executionTime}ms)`);
      if (!test.passed && test.error) {
        report.push(`  - Error: ${test.error}`);
      }
    });
    report.push('');
    
    // Data Validation Tests
    report.push('## 🔒 Data Validation Tests');
    testSuite.dataValidationTests.forEach(test => {
      const status = test.passed ? '✅' : '❌';
      report.push(`- ${status} ${test.testName} (${test.executionTime}ms)`);
      if (!test.passed && test.error) {
        report.push(`  - Error: ${test.error}`);
      }
    });
    report.push('');
    
    // Performance Tests
    report.push('## ⚡ Performance Tests');
    testSuite.performanceTests.forEach(test => {
      const status = test.passed ? '✅' : '❌';
      report.push(`- ${status} ${test.testName} (${test.executionTime}ms)`);
      if (!test.passed && test.error) {
        report.push(`  - Error: ${test.error}`);
      }
    });
    report.push('');
    
    // Summary
    const totalTests = testSuite.modelAccuracyTests.length + testSuite.tradeListTests.length + 
                      testSuite.dataValidationTests.length + testSuite.performanceTests.length;
    const passedTests = [...testSuite.modelAccuracyTests, ...testSuite.tradeListTests, 
                        ...testSuite.dataValidationTests, ...testSuite.performanceTests]
                        .filter(test => test.passed).length;
    
    report.push('## 📈 Summary');
    report.push(`- **Total Tests:** ${totalTests}`);
    report.push(`- **Passed:** ${passedTests}`);
    report.push(`- **Failed:** ${totalTests - passedTests}`);
    report.push(`- **Success Rate:** ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    return report.join('\n');
  }
}

// Export for easy access
export const runAllTests = TestRunner.runAllTests;
export const generateTestReport = TestRunner.generateReport;













