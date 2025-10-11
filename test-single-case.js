// Test single case: $1000, 10 trades, 50% accuracy, 1:3 RR
// Expected from Lovely Profit: $11,799.69

const testCase = {
  capital: 1000,
  totalTrades: 10,
  accuracy: 50,
  riskRewardRatio: 3,
  expected: 11799.69
};

// Current Hybrid Formula
function currentFormula(tc) {
  const winRate = tc.accuracy / 100;
  const kelly = (winRate * tc.riskRewardRatio - (1 - winRate)) / tc.riskRewardRatio;

  if (kelly <= 0) return 0;

  let kellyFraction, scalingFactor, accuracyExponent, rrExponent;

  if (tc.riskRewardRatio <= 2) {
    kellyFraction = 0.20;
    scalingFactor = 0.12;
    accuracyExponent = 1.1;
    rrExponent = 0.5;
  } else if (tc.riskRewardRatio <= 4) {
    kellyFraction = 0.25;
    scalingFactor = 0.18;
    accuracyExponent = 1.2;
    rrExponent = 0.6;
  } else {
    kellyFraction = 0.30;
    scalingFactor = 0.25;
    accuracyExponent = 1.25;
    rrExponent = 0.65;
  }

  const fractionalKelly = kelly * kellyFraction;
  const expectedValue = (winRate * tc.riskRewardRatio) - (1 - winRate);
  const accuracyBoost = Math.pow(winRate, accuracyExponent);
  const rrBoost = Math.pow(tc.riskRewardRatio, rrExponent);
  const perTradeReturn = fractionalKelly * expectedValue * accuracyBoost * rrBoost * scalingFactor;

  const finalBalance = tc.capital * Math.pow(1 + perTradeReturn, tc.totalTrades);
  return finalBalance - tc.capital;
}

// Let's try different scaling approaches
function testApproach1(tc) {
  // More aggressive scaling
  const winRate = tc.accuracy / 100;
  const kelly = (winRate * tc.riskRewardRatio - (1 - winRate)) / tc.riskRewardRatio;
  if (kelly <= 0) return 0;

  const kellyFraction = 0.35;  // More aggressive
  const scalingFactor = 0.30;   // Higher scaling
  const expectedValue = (winRate * tc.riskRewardRatio) - (1 - winRate);
  const accuracyBoost = Math.pow(winRate, 1.0);  // Linear
  const rrBoost = Math.pow(tc.riskRewardRatio, 0.8);  // Higher RR boost
  const perTradeReturn = kellyFraction * expectedValue * accuracyBoost * rrBoost * scalingFactor;

  const finalBalance = tc.capital * Math.pow(1 + perTradeReturn, tc.totalTrades);
  return finalBalance - tc.capital;
}

function testApproach2(tc) {
  // Simple compound with higher base rate
  const winRate = tc.accuracy / 100;
  const kelly = (winRate * tc.riskRewardRatio - (1 - winRate)) / tc.riskRewardRatio;
  if (kelly <= 0) return 0;

  const perTradeReturn = kelly * 0.5; // Use 50% of Kelly
  const finalBalance = tc.capital * Math.pow(1 + perTradeReturn, tc.totalTrades);
  return finalBalance - tc.capital;
}

function testApproach3(tc) {
  // Lovely Profit might be using full Kelly or near-full
  const winRate = tc.accuracy / 100;
  const kelly = (winRate * tc.riskRewardRatio - (1 - winRate)) / tc.riskRewardRatio;
  if (kelly <= 0) return 0;

  // Try 80% of Kelly (aggressive but not full)
  const kellyFraction = 0.80;
  const perTradeReturn = kelly * kellyFraction;
  const finalBalance = tc.capital * Math.pow(1 + perTradeReturn, tc.totalTrades);
  return finalBalance - tc.capital;
}

function testApproach4(tc) {
  // Grid search found optimal
  const winRate = tc.accuracy / 100;
  const kelly = (winRate * tc.riskRewardRatio - (1 - winRate)) / tc.riskRewardRatio;
  if (kelly <= 0) return 0;

  // Optimize for this specific case
  const kellyFraction = 0.45;
  const scalingFactor = 0.40;
  const expectedValue = (winRate * tc.riskRewardRatio) - (1 - winRate);
  const accuracyBoost = Math.pow(winRate, 0.9);
  const rrBoost = Math.pow(tc.riskRewardRatio, 0.75);
  const perTradeReturn = kellyFraction * expectedValue * accuracyBoost * rrBoost * scalingFactor;

  const finalBalance = tc.capital * Math.pow(1 + perTradeReturn, tc.totalTrades);
  return finalBalance - tc.capital;
}

console.log('\n' + '='.repeat(80));
console.log('TESTING SINGLE CASE: $1000, 10 trades, 50% accuracy, 1:3 RR');
console.log('='.repeat(80));
console.log(`\nExpected from Lovely Profit: $${testCase.expected.toFixed(2)}\n`);

const approaches = [
  { name: 'Current Hybrid Formula', func: currentFormula },
  { name: 'Approach 1: More Aggressive', func: testApproach1 },
  { name: 'Approach 2: Simple 50% Kelly', func: testApproach2 },
  { name: 'Approach 3: 80% Kelly', func: testApproach3 },
  { name: 'Approach 4: Optimized', func: testApproach4 }
];

let bestError = Infinity;
let bestApproach = null;

approaches.forEach(approach => {
  const result = approach.func(testCase);
  const error = Math.abs(result - testCase.expected);
  const errorPct = (error / testCase.expected) * 100;

  if (errorPct < bestError) {
    bestError = errorPct;
    bestApproach = approach.name;
  }

  const status = errorPct < 10 ? '🎯' : errorPct < 30 ? '✅' : errorPct < 50 ? '⚠️' : '❌';

  console.log(`${status} ${approach.name}:`);
  console.log(`   Result:  $${result.toFixed(2)}`);
  console.log(`   Error:   $${error.toFixed(2)} (${errorPct.toFixed(2)}%)`);
  console.log('');
});

console.log('='.repeat(80));
console.log(`BEST APPROACH: ${bestApproach} (${bestError.toFixed(2)}% error)`);
console.log('='.repeat(80) + '\n');

// Kelly calculation details
console.log('KELLY CALCULATION DETAILS:');
const winRate = testCase.accuracy / 100;
const kelly = (winRate * testCase.riskRewardRatio - (1 - winRate)) / testCase.riskRewardRatio;
console.log(`Win Rate: ${winRate * 100}%`);
console.log(`RR: 1:${testCase.riskRewardRatio}`);
console.log(`Kelly Criterion: ${(kelly * 100).toFixed(2)}%`);
console.log(`Expected Value: ${((winRate * testCase.riskRewardRatio - (1 - winRate)) * 100).toFixed(2)}%\n`);
