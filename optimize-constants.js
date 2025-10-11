#!/usr/bin/env node

/**
 * Advanced Formula Constant Optimizer
 *
 * This script uses gradient descent and grid search to find optimal constants
 * for the Target Profit calculation formula.
 *
 * Usage:
 * 1. Add your test cases from Lovely Profit below
 * 2. Run: node optimize-constants.js
 * 3. Copy the optimized constants into your code
 */

// ============================================================================
// TEST CASES - Add your actual Lovely Profit results here
// ============================================================================

const testCases = [
  // Example test cases - REPLACE WITH YOUR ACTUAL DATA
  {
    name: 'Case 1',
    capital: 10000,
    totalTrades: 10,
    accuracy: 70,
    riskRewardRatio: 3,
    expected: 107193287.17  // Replace with actual Lovely Profit result
  },
  {
    name: 'Case 2',
    capital: 10000,
    totalTrades: 10,
    accuracy: 60,
    riskRewardRatio: 5,
    expected: 0  // Replace with actual Lovely Profit result
  },
  {
    name: 'Case 3',
    capital: 10000,
    totalTrades: 10,
    accuracy: 80,
    riskRewardRatio: 6,
    expected: 0  // Replace with actual Lovely Profit result
  },
  {
    name: 'Case 4 (Previously failing)',
    capital: 10000,
    totalTrades: 10,
    accuracy: 65,
    riskRewardRatio: 4,
    expected: 0  // Replace with actual Lovely Profit result
  },
  {
    name: 'Case 5 (Previously failing)',
    capital: 10000,
    totalTrades: 10,
    accuracy: 75,
    riskRewardRatio: 3,
    expected: 0  // Replace with actual Lovely Profit result
  }
];

// ============================================================================
// FORMULA IMPLEMENTATIONS
// ============================================================================

function calculateHybridFormula(tc, params) {
  const winRate = tc.accuracy / 100;
  const kelly = (winRate * tc.riskRewardRatio - (1 - winRate)) / tc.riskRewardRatio;

  if (kelly <= 0) return 0;

  let kellyFraction, scalingFactor, accuracyExponent, rrExponent;

  if (tc.riskRewardRatio <= 2) {
    kellyFraction = params.kelly1;
    scalingFactor = params.scale1;
    accuracyExponent = params.accExp1;
    rrExponent = params.rrExp1;
  } else if (tc.riskRewardRatio <= 4) {
    kellyFraction = params.kelly2;
    scalingFactor = params.scale2;
    accuracyExponent = params.accExp2;
    rrExponent = params.rrExp2;
  } else {
    kellyFraction = params.kelly3;
    scalingFactor = params.scale3;
    accuracyExponent = params.accExp3;
    rrExponent = params.rrExp3;
  }

  const fractionalKelly = kelly * kellyFraction;
  const expectedValue = (winRate * tc.riskRewardRatio) - (1 - winRate);
  const accuracyBoost = Math.pow(winRate, accuracyExponent);
  const rrBoost = Math.pow(tc.riskRewardRatio, rrExponent);
  const perTradeReturn = fractionalKelly * expectedValue * accuracyBoost * rrBoost * scalingFactor;

  const finalBalance = tc.capital * Math.pow(1 + perTradeReturn, tc.totalTrades);
  return finalBalance - tc.capital;
}

function calculateError(params) {
  let totalError = 0;
  let validCases = 0;

  for (const tc of testCases) {
    if (tc.expected === 0) continue; // Skip cases without expected values

    const result = calculateHybridFormula(tc, params);
    const error = Math.abs(result - tc.expected) / tc.expected;
    totalError += error;
    validCases++;
  }

  return validCases > 0 ? totalError / validCases : Infinity;
}

// ============================================================================
// OPTIMIZATION ALGORITHMS
// ============================================================================

function gridSearch() {
  console.log('\n🔍 Running Grid Search Optimization...\n');

  // Default parameters
  const defaultParams = {
    kelly1: 0.20, kelly2: 0.25, kelly3: 0.30,
    scale1: 0.12, scale2: 0.18, scale3: 0.25,
    accExp1: 1.1, accExp2: 1.2, accExp3: 1.25,
    rrExp1: 0.5, rrExp2: 0.6, rrExp3: 0.65
  };

  let bestParams = { ...defaultParams };
  let bestError = calculateError(defaultParams);

  // Grid search ranges
  const kellyRange = [0.15, 0.20, 0.25, 0.30, 0.35];
  const scaleRange = [0.08, 0.12, 0.15, 0.18, 0.22, 0.25, 0.30];
  const accExpRange = [1.0, 1.1, 1.2, 1.3, 1.4, 1.5];
  const rrExpRange = [0.4, 0.5, 0.6, 0.7, 0.8];

  let iterations = 0;
  const maxIterations = 1000;

  // Random search (more efficient than full grid)
  for (let i = 0; i < maxIterations; i++) {
    const testParams = {
      kelly1: kellyRange[Math.floor(Math.random() * kellyRange.length)],
      kelly2: kellyRange[Math.floor(Math.random() * kellyRange.length)],
      kelly3: kellyRange[Math.floor(Math.random() * kellyRange.length)],
      scale1: scaleRange[Math.floor(Math.random() * scaleRange.length)],
      scale2: scaleRange[Math.floor(Math.random() * scaleRange.length)],
      scale3: scaleRange[Math.floor(Math.random() * scaleRange.length)],
      accExp1: accExpRange[Math.floor(Math.random() * accExpRange.length)],
      accExp2: accExpRange[Math.floor(Math.random() * accExpRange.length)],
      accExp3: accExpRange[Math.floor(Math.random() * accExpRange.length)],
      rrExp1: rrExpRange[Math.floor(Math.random() * rrExpRange.length)],
      rrExp2: rrExpRange[Math.floor(Math.random() * rrExpRange.length)],
      rrExp3: rrExpRange[Math.floor(Math.random() * rrExpRange.length)]
    };

    const error = calculateError(testParams);

    if (error < bestError) {
      bestError = error;
      bestParams = { ...testParams };
      console.log(`✅ Improvement found! Error: ${(bestError * 100).toFixed(2)}%`);
    }

    iterations++;
    if (iterations % 100 === 0) {
      console.log(`Progress: ${iterations}/${maxIterations} iterations...`);
    }
  }

  return { params: bestParams, error: bestError };
}

function gradientDescent(initialParams, learningRate = 0.01, iterations = 500) {
  console.log('\n📈 Running Gradient Descent Optimization...\n');

  let params = { ...initialParams };
  let bestError = calculateError(params);

  for (let i = 0; i < iterations; i++) {
    const epsilon = 0.0001;
    const gradients = {};

    // Calculate gradients for each parameter
    for (const key of Object.keys(params)) {
      const originalValue = params[key];

      params[key] = originalValue + epsilon;
      const errorPlus = calculateError(params);

      params[key] = originalValue - epsilon;
      const errorMinus = calculateError(params);

      gradients[key] = (errorPlus - errorMinus) / (2 * epsilon);
      params[key] = originalValue;
    }

    // Update parameters
    for (const key of Object.keys(params)) {
      params[key] -= learningRate * gradients[key];

      // Constrain values to reasonable ranges
      if (key.startsWith('kelly')) params[key] = Math.max(0.1, Math.min(0.5, params[key]));
      if (key.startsWith('scale')) params[key] = Math.max(0.05, Math.min(0.4, params[key]));
      if (key.startsWith('accExp')) params[key] = Math.max(0.8, Math.min(2.0, params[key]));
      if (key.startsWith('rrExp')) params[key] = Math.max(0.3, Math.min(1.0, params[key]));
    }

    const currentError = calculateError(params);

    if (currentError < bestError) {
      bestError = currentError;
      if (i % 50 === 0) {
        console.log(`Iteration ${i}: Error = ${(bestError * 100).toFixed(2)}%`);
      }
    }
  }

  return { params, error: bestError };
}

// ============================================================================
// TESTING AND REPORTING
// ============================================================================

function testFormula(params) {
  console.log('\n' + '='.repeat(80));
  console.log('FORMULA TESTING RESULTS');
  console.log('='.repeat(80) + '\n');

  let totalError = 0;
  let validCases = 0;

  testCases.forEach((tc) => {
    if (tc.expected === 0) {
      console.log(`⚠️  ${tc.name}: SKIPPED (no expected value provided)`);
      return;
    }

    const result = calculateHybridFormula(tc, params);
    const error = Math.abs(result - tc.expected);
    const errorPct = (error / tc.expected) * 100;

    totalError += errorPct;
    validCases++;

    const status = errorPct < 10 ? '✅' : errorPct < 30 ? '⚠️' : '❌';

    console.log(`${status} ${tc.name}:`);
    console.log(`   Capital: $${tc.capital}, Trades: ${tc.totalTrades}, Accuracy: ${tc.accuracy}%, RR: 1:${tc.riskRewardRatio}`);
    console.log(`   Expected:  $${tc.expected.toFixed(2)}`);
    console.log(`   Result:    $${result.toFixed(2)}`);
    console.log(`   Error:     $${error.toFixed(2)} (${errorPct.toFixed(2)}%)`);
    console.log('');
  });

  const avgError = validCases > 0 ? totalError / validCases : 0;
  console.log('='.repeat(80));
  console.log(`AVERAGE ERROR: ${avgError.toFixed(2)}%`);
  console.log('='.repeat(80) + '\n');

  return avgError;
}

function generateCode(params) {
  console.log('\n' + '='.repeat(80));
  console.log('OPTIMIZED CODE - Copy this into your application:');
  console.log('='.repeat(80) + '\n');

  console.log(`
const calculateTargetProfit = (session) => {
  const { capital, totalTrades, accuracy, riskRewardRatio } = session;
  const winRate = accuracy / 100;
  const kelly = (winRate * riskRewardRatio - (1 - winRate)) / riskRewardRatio;

  if (kelly <= 0) return 0;

  let kellyFraction, scalingFactor, accuracyExponent, rrExponent;

  if (riskRewardRatio <= 2) {
    kellyFraction = ${params.kelly1.toFixed(4)};
    scalingFactor = ${params.scale1.toFixed(4)};
    accuracyExponent = ${params.accExp1.toFixed(4)};
    rrExponent = ${params.rrExp1.toFixed(4)};
  } else if (riskRewardRatio <= 4) {
    kellyFraction = ${params.kelly2.toFixed(4)};
    scalingFactor = ${params.scale2.toFixed(4)};
    accuracyExponent = ${params.accExp2.toFixed(4)};
    rrExponent = ${params.rrExp2.toFixed(4)};
  } else {
    kellyFraction = ${params.kelly3.toFixed(4)};
    scalingFactor = ${params.scale3.toFixed(4)};
    accuracyExponent = ${params.accExp3.toFixed(4)};
    rrExponent = ${params.rrExp3.toFixed(4)};
  }

  const fractionalKelly = kelly * kellyFraction;
  const expectedValue = (winRate * riskRewardRatio) - (1 - winRate);
  const accuracyBoost = Math.pow(winRate, accuracyExponent);
  const rrBoost = Math.pow(riskRewardRatio, rrExponent);
  const perTradeReturn = fractionalKelly * expectedValue * accuracyBoost * rrBoost * scalingFactor;

  const finalBalance = capital * Math.pow(1 + perTradeReturn, totalTrades);
  return finalBalance - capital;
};
  `);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  console.log('\n🚀 TARGET PROFIT FORMULA OPTIMIZER');
  console.log('='.repeat(80));

  // Check if we have valid test cases
  const validCases = testCases.filter(tc => tc.expected !== 0);

  if (validCases.length === 0) {
    console.log('\n⚠️  ERROR: No valid test cases found!');
    console.log('\nPlease add your actual Lovely Profit results to the testCases array.');
    console.log('Replace the "expected: 0" values with real data from Lovely Profit.\n');
    return;
  }

  console.log(`\n✅ Found ${validCases.length} valid test case(s)\n`);

  // Current parameters
  const currentParams = {
    kelly1: 0.20, kelly2: 0.25, kelly3: 0.30,
    scale1: 0.12, scale2: 0.18, scale3: 0.25,
    accExp1: 1.1, accExp2: 1.2, accExp3: 1.25,
    rrExp1: 0.5, rrExp2: 0.6, rrExp3: 0.65
  };

  console.log('Testing current formula...');
  const currentError = testFormula(currentParams);

  // Run optimizations
  const gridResult = gridSearch();
  const gdResult = gradientDescent(gridResult.params, 0.001, 300);

  // Determine best result
  const bestResult = gdResult.error < gridResult.error ? gdResult : gridResult;

  console.log('\n' + '='.repeat(80));
  console.log('OPTIMIZATION COMPLETE');
  console.log('='.repeat(80));
  console.log(`\nCurrent Error:   ${(currentError).toFixed(2)}%`);
  console.log(`Grid Search:     ${(gridResult.error * 100).toFixed(2)}%`);
  console.log(`Gradient Descent: ${(gdResult.error * 100).toFixed(2)}%`);
  console.log(`Best Result:     ${(bestResult.error * 100).toFixed(2)}%`);

  if (bestResult.error < currentError / 100) {
    console.log('\n✅ IMPROVEMENT FOUND!');
    testFormula(bestResult.params);
    generateCode(bestResult.params);
  } else {
    console.log('\n⚠️  No significant improvement found. Current formula is already optimal.');
  }
}

// Run the optimizer
main();
