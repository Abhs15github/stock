// Test script for Target Profit calculation formulas

// Your 5 failing test cases from the problem description
const testCases = [
  {
    name: 'Test Case 1',
    capital: 10000,
    totalTrades: 10,
    accuracy: 70,
    riskRewardRatio: 3,
    expected: 107193287.17,
    description: 'RR=3, Accuracy=70% → Previous 4.55% error'
  },
  {
    name: 'Test Case 2',
    capital: 10000,
    totalTrades: 10,
    accuracy: 60,
    riskRewardRatio: 5,
    expected: 1000000, // Placeholder - you didn't provide the exact expected value
    description: 'RR=5, Accuracy=60% → Previous 12.50% error'
  },
  {
    name: 'Test Case 3',
    capital: 10000,
    totalTrades: 10,
    accuracy: 80,
    riskRewardRatio: 6,
    expected: 500000, // Placeholder
    description: 'RR=6, Accuracy=80% → Previous 7.75% error'
  },
  {
    name: 'Test Case 4 (FAILING)',
    capital: 10000,
    totalTrades: 10,
    accuracy: 65,
    riskRewardRatio: 4,
    expected: 50000, // Placeholder
    description: 'RR=4, Accuracy=65% → Previous 311.98% error ❌'
  },
  {
    name: 'Test Case 5 (FAILING)',
    capital: 10000,
    totalTrades: 10,
    accuracy: 75,
    riskRewardRatio: 3,
    expected: 100000, // Placeholder
    description: 'RR=3, Accuracy=75% → Previous 82.16% error ❌'
  }
];

// OLD FORMULA
function calculateTargetProfitOld(session) {
  const { capital, totalTrades, accuracy, riskRewardRatio } = session;
  const winRate = accuracy / 100;
  const kelly = (winRate * riskRewardRatio - (1 - winRate)) / riskRewardRatio;

  if (kelly <= 0) return 0;

  const multiplier = accuracy * 0.06;
  const perTradeReturn = riskRewardRatio * accuracy * 0.001 * multiplier;
  const finalBalance = capital * Math.pow(1 + perTradeReturn, totalTrades);
  return finalBalance - capital;
}

// NEW IMPROVED FORMULA
function calculateTargetProfitNew(session) {
  const { capital, totalTrades, accuracy, riskRewardRatio } = session;
  const winRate = accuracy / 100;
  const kelly = (winRate * riskRewardRatio - (1 - winRate)) / riskRewardRatio;

  if (kelly <= 0) return 0;

  // Multi-factor approach
  const fractionalKelly = kelly * 0.25;
  const expectedValue = (winRate * riskRewardRatio) - (1 - winRate);
  const rrFactor = Math.pow(riskRewardRatio, 0.6);
  const accuracyFactor = Math.pow(winRate, 1.2);
  const perTradeReturn = fractionalKelly * expectedValue * rrFactor * accuracyFactor * 0.15;

  const finalBalance = capital * Math.pow(1 + perTradeReturn, totalTrades);
  return finalBalance - capital;
}

// ALTERNATIVE: Pattern-based formula
function calculateTargetProfitPattern(session) {
  const { capital, totalTrades, accuracy, riskRewardRatio } = session;
  const winRate = accuracy / 100;
  const kelly = (winRate * riskRewardRatio - (1 - winRate)) / riskRewardRatio;

  if (kelly <= 0) return 0;

  // Pattern observation: Lovely Profit seems to use different scaling for different RR ranges
  let scalingFactor;

  if (riskRewardRatio <= 2) {
    // Conservative scaling for lower RR
    scalingFactor = 0.08;
  } else if (riskRewardRatio <= 4) {
    // Moderate scaling for medium RR
    scalingFactor = 0.12;
  } else {
    // Aggressive scaling for higher RR
    scalingFactor = 0.18;
  }

  // Combine Kelly, expected value, and scaling
  const expectedValue = (winRate * riskRewardRatio) - (1 - winRate);
  const perTradeReturn = kelly * expectedValue * scalingFactor;

  const finalBalance = capital * Math.pow(1 + perTradeReturn, totalTrades);
  return finalBalance - capital;
}

console.log('\n' + '='.repeat(100));
console.log('TARGET PROFIT FORMULA COMPARISON');
console.log('='.repeat(100) + '\n');

testCases.forEach((tc, index) => {
  console.log(`\n${tc.name}: ${tc.description}`);
  console.log('-'.repeat(100));

  const oldResult = calculateTargetProfitOld(tc);
  const newResult = calculateTargetProfitNew(tc);
  const patternResult = calculateTargetProfitPattern(tc);

  const oldError = Math.abs(oldResult - tc.expected);
  const oldErrorPct = tc.expected > 0 ? (oldError / tc.expected * 100) : 0;

  const newError = Math.abs(newResult - tc.expected);
  const newErrorPct = tc.expected > 0 ? (newError / tc.expected * 100) : 0;

  const patternError = Math.abs(patternResult - tc.expected);
  const patternErrorPct = tc.expected > 0 ? (patternError / tc.expected * 100) : 0;

  console.log(`Expected:          $${tc.expected.toFixed(2)}`);
  console.log(`Old Formula:       $${oldResult.toFixed(2)} (${oldErrorPct.toFixed(2)}% error)`);
  console.log(`New Formula:       $${newResult.toFixed(2)} (${newErrorPct.toFixed(2)}% error)`);
  console.log(`Pattern Formula:   $${patternResult.toFixed(2)} (${patternErrorPct.toFixed(2)}% error)`);

  // Determine best formula for this case
  const minError = Math.min(oldErrorPct, newErrorPct, patternErrorPct);
  if (newErrorPct === minError) {
    console.log('✅ NEW FORMULA WINS!');
  } else if (patternErrorPct === minError) {
    console.log('✅ PATTERN FORMULA WINS!');
  } else {
    console.log('⚠️  Old formula still better');
  }
});

console.log('\n' + '='.repeat(100));
console.log('SUMMARY');
console.log('='.repeat(100));
console.log('\nThe formulas have been tested. Review the results above to see which performs best.');
console.log('\nKey Insights:');
console.log('1. If NEW or PATTERN formula consistently wins, use that one');
console.log('2. If different formulas win for different cases, you may need a hybrid approach');
console.log('3. Consider the RR ratio as a key factor in formula selection\n');
