#!/usr/bin/env node

/**
 * QUICK KELLY FRACTION FINDER
 *
 * This script helps you find the EXACT Kelly fraction that Lovely Profit uses
 * by working backwards from their result.
 *
 * Usage: node find-exact-kelly.js
 */

// Your known test case from Lovely Profit
const testCase = {
  capital: 1000,
  totalTrades: 10,
  accuracy: 50,
  riskRewardRatio: 3,
  expectedProfit: 11799.69
};

console.log('\n' + '='.repeat(80));
console.log('🔍 EXACT KELLY FRACTION FINDER');
console.log('='.repeat(80));
console.log(`\nTest Case: $${testCase.capital}, ${testCase.totalTrades} trades, ${testCase.accuracy}%, 1:${testCase.riskRewardRatio}`);
console.log(`Target from Lovely Profit: $${testCase.expectedProfit.toFixed(2)}\n`);

// Calculate Kelly Criterion
const winRate = testCase.accuracy / 100;
const kelly = (winRate * testCase.riskRewardRatio - (1 - winRate)) / testCase.riskRewardRatio;
const expectedValue = (winRate * testCase.riskRewardRatio) - (1 - winRate);

console.log('Kelly Criterion Calculation:');
console.log(`  Win Rate: ${(winRate * 100).toFixed(0)}%`);
console.log(`  RR: 1:${testCase.riskRewardRatio}`);
console.log(`  Kelly: ${(kelly * 100).toFixed(2)}%`);
console.log(`  Expected Value: ${expectedValue.toFixed(2)}`);
console.log('');

// Method 1: Work backwards from the result
console.log('METHOD 1: REVERSE ENGINEERING');
console.log('-'.repeat(80));

// If target = capital × (1 + r)^trades
// Then r = (target/capital)^(1/trades) - 1
const targetBalance = testCase.capital + testCase.expectedProfit;
const impliedPerTradeReturn = Math.pow(targetBalance / testCase.capital, 1 / testCase.totalTrades) - 1;
const impliedKellyFraction = impliedPerTradeReturn / kelly;

console.log(`Target Balance: $${targetBalance.toFixed(2)}`);
console.log(`Implied Per-Trade Return: ${(impliedPerTradeReturn * 100).toFixed(4)}%`);
console.log(`\n🎯 EXACT KELLY FRACTION NEEDED: ${(impliedKellyFraction * 100).toFixed(2)}%`);
console.log('');

// Method 2: Test a range to confirm
console.log('METHOD 2: VERIFICATION BY TESTING');
console.log('-'.repeat(80));

// Test Kelly fractions around the implied value
const testRange = [];
for (let k = impliedKellyFraction - 0.05; k <= impliedKellyFraction + 0.05; k += 0.01) {
  const perTradeReturn = kelly * k;
  const finalBalance = testCase.capital * Math.pow(1 + perTradeReturn, testCase.totalTrades);
  const profit = finalBalance - testCase.capital;
  const error = Math.abs(profit - testCase.expectedProfit);
  const errorPct = (error / testCase.expectedProfit) * 100;

  testRange.push({
    kellyFraction: k,
    profit: profit,
    error: error,
    errorPct: errorPct
  });
}

// Sort by error
testRange.sort((a, b) => a.error - b.error);

console.log('\nTop 5 Most Accurate Kelly Fractions:\n');
testRange.slice(0, 5).forEach((result, i) => {
  const status = result.errorPct < 0.1 ? '🎯' : result.errorPct < 1 ? '✅' : '⚠️';
  console.log(`${i + 1}. ${status} Kelly Fraction: ${(result.kellyFraction * 100).toFixed(2)}%`);
  console.log(`   Result: $${result.profit.toFixed(2)}`);
  console.log(`   Error: $${result.error.toFixed(2)} (${result.errorPct.toFixed(4)}%)`);
  console.log('');
});

// Method 3: If there are multiple test cases, find the pattern
console.log('METHOD 3: PATTERN DETECTION (Add more test cases!)');
console.log('-'.repeat(80));

const hypotheticalCases = [
  // Add your real test cases here as you gather them
  { accuracy: 50, rr: 3, expectedProfit: 11799.69, name: 'Case 1 (REAL)' },
  // { accuracy: 60, rr: 3, expectedProfit: 0, name: 'Case 2 (TODO: Get from Lovely Profit)' },
  // { accuracy: 70, rr: 3, expectedProfit: 0, name: 'Case 3 (TODO: Get from Lovely Profit)' },
];

console.log('\nAnalyzing Kelly Fraction Pattern:\n');

hypotheticalCases.forEach(tc => {
  if (tc.expectedProfit === 0) {
    console.log(`⏳ ${tc.name}: Waiting for data from Lovely Profit...`);
    return;
  }

  const wr = tc.accuracy / 100;
  const k = (wr * tc.rr - (1 - wr)) / tc.rr;
  const ev = (wr * tc.rr) - (1 - wr);
  const target = testCase.capital + tc.expectedProfit;
  const r = Math.pow(target / testCase.capital, 1 / testCase.totalTrades) - 1;
  const kf = r / k;

  console.log(`✅ ${tc.name}:`);
  console.log(`   Accuracy: ${tc.accuracy}% | RR: 1:${tc.rr} | EV: ${ev.toFixed(2)}`);
  console.log(`   Kelly Fraction Used: ${(kf * 100).toFixed(2)}%`);
  console.log('');
});

console.log('To find the pattern, add at least 5 more test cases above.');
console.log('Then look for the relationship between EV and Kelly Fraction used.');
console.log('');

// Generate code with the exact Kelly fraction
console.log('='.repeat(80));
console.log('RECOMMENDED CODE FOR YOUR APP:');
console.log('='.repeat(80));

const optimalKelly = testRange[0].kellyFraction;

console.log(`
const calculateTargetProfit = (session) => {
  const { capital, totalTrades, accuracy, riskRewardRatio } = session;
  const winRate = accuracy / 100;
  const kelly = (winRate * riskRewardRatio - (1 - winRate)) / riskRewardRatio;

  if (kelly <= 0) return 0;

  const expectedValue = (winRate * riskRewardRatio) - (1 - winRate);

  // Based on reverse engineering of Lovely Profit
  // For EV = ${expectedValue.toFixed(2)}, they use ${(optimalKelly * 100).toFixed(2)}% Kelly

  let kellyFraction;

  // TODO: Adjust this formula as you gather more test cases
  if (expectedValue >= 2.5) {
    kellyFraction = 0.90; // Very strong edge
  } else if (expectedValue >= 2.0) {
    kellyFraction = 0.85; // Strong edge
  } else if (expectedValue >= 1.5) {
    kellyFraction = 0.80; // Moderate-strong edge
  } else if (expectedValue >= 1.0) {
    kellyFraction = ${optimalKelly.toFixed(4)}; // ← CALIBRATED FOR YOUR TEST CASE
  } else if (expectedValue >= 0.5) {
    kellyFraction = 0.70; // Moderate edge
  } else {
    kellyFraction = 0.60; // Small edge
  }

  // Calculate per-trade return
  const perTradeReturn = kelly * kellyFraction;

  // Compound over all trades
  const finalBalance = capital * Math.pow(1 + perTradeReturn, totalTrades);
  return finalBalance - capital;
};

// TEST THE FUNCTION:
const result = calculateTargetProfit({
  capital: ${testCase.capital},
  totalTrades: ${testCase.totalTrades},
  accuracy: ${testCase.accuracy},
  riskRewardRatio: ${testCase.riskRewardRatio}
});

console.log('Test Result: $' + result.toFixed(2));
console.log('Expected: $${testCase.expectedProfit.toFixed(2)}');
console.log('Error: ' + (Math.abs(result - ${testCase.expectedProfit}) / ${testCase.expectedProfit} * 100).toFixed(2) + '%');
`);

console.log('='.repeat(80));
console.log('\n💡 NEXT STEPS:');
console.log('');
console.log('1. Copy the generated code above into your app');
console.log('2. Test it in your browser - should show ~$11,800');
console.log('3. Gather 5+ more test cases from Lovely Profit');
console.log('4. Run this script again to find patterns in Kelly fractions');
console.log('5. Adjust the kellyFraction logic based on patterns');
console.log('');
console.log('With 10+ test cases, you can achieve < 5% error across all scenarios!');
console.log('');
console.log('='.repeat(80) + '\n');
