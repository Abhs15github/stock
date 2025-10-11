// Test new adaptive formula with real Lovely Profit case

const testCase = {
  capital: 1000,
  totalTrades: 10,
  accuracy: 50,
  riskRewardRatio: 3,
  expected: 11799.69
};

function adaptiveKellyFormula(tc) {
  const winRate = tc.accuracy / 100;
  const kelly = (winRate * tc.riskRewardRatio - (1 - winRate)) / tc.riskRewardRatio;

  if (kelly <= 0) return 0;

  const expectedValue = (winRate * tc.riskRewardRatio) - (1 - winRate);

  let kellyFraction;

  if (expectedValue >= 1.5) {
    kellyFraction = 0.70 + (winRate - 0.5) * 0.3;
  } else if (expectedValue >= 1.0) {
    kellyFraction = 0.60 + (winRate - 0.5) * 0.25;
  } else if (expectedValue >= 0.5) {
    kellyFraction = 0.50 + (winRate - 0.4) * 0.4;
  } else if (expectedValue > 0) {
    kellyFraction = 0.40 + expectedValue * 0.3;
  } else {
    kellyFraction = 0.20;
  }

  kellyFraction = Math.max(0.3, Math.min(0.85, kellyFraction));

  const fractionalKelly = kelly * kellyFraction;
  const perTradeReturn = fractionalKelly;
  const finalBalance = tc.capital * Math.pow(1 + perTradeReturn, tc.totalTrades);

  return {
    profit: finalBalance - tc.capital,
    kelly: kelly,
    kellyFraction: kellyFraction,
    expectedValue: expectedValue,
    perTradeReturn: perTradeReturn,
    finalBalance: finalBalance
  };
}

console.log('\n' + '='.repeat(80));
console.log('ADAPTIVE KELLY FORMULA TEST');
console.log('='.repeat(80));
console.log(`\nTest Case: $${testCase.capital}, ${testCase.totalTrades} trades, ${testCase.accuracy}% accuracy, 1:${testCase.riskRewardRatio} RR`);
console.log(`Expected from Lovely Profit: $${testCase.expected.toFixed(2)}\n`);

const result = adaptiveKellyFormula(testCase);

console.log('CALCULATION DETAILS:');
console.log('-'.repeat(80));
console.log(`Kelly Criterion:      ${(result.kelly * 100).toFixed(2)}%`);
console.log(`Expected Value:       ${result.expectedValue.toFixed(2)}`);
console.log(`Kelly Fraction Used:  ${(result.kellyFraction * 100).toFixed(1)}%`);
console.log(`Fractional Kelly:     ${(result.kelly * result.kellyFraction * 100).toFixed(2)}%`);
console.log(`Per-Trade Return:     ${(result.perTradeReturn * 100).toFixed(4)}%`);
console.log('');
console.log(`Initial Capital:      $${testCase.capital.toFixed(2)}`);
console.log(`Final Balance:        $${result.finalBalance.toFixed(2)}`);
console.log(`Target Profit:        $${result.profit.toFixed(2)}`);
console.log('');

const error = Math.abs(result.profit - testCase.expected);
const errorPct = (error / testCase.expected) * 100;

const status = errorPct < 10 ? '🎯 EXCELLENT' : errorPct < 25 ? '✅ GOOD' : errorPct < 50 ? '⚠️  ACCEPTABLE' : '❌ NEEDS WORK';

console.log('RESULT:');
console.log('-'.repeat(80));
console.log(`Your Platform:        $${result.profit.toFixed(2)}`);
console.log(`Lovely Profit:        $${testCase.expected.toFixed(2)}`);
console.log(`Difference:           $${error.toFixed(2)}`);
console.log(`Error Percentage:     ${errorPct.toFixed(2)}%`);
console.log(`\n${status}\n`);

console.log('='.repeat(80));

// Test a few more hypothetical cases to see consistency
console.log('\nTESTING OTHER SCENARIOS FOR CONSISTENCY:');
console.log('='.repeat(80));

const scenarios = [
  { capital: 1000, totalTrades: 10, accuracy: 60, riskRewardRatio: 3, name: '60% / 1:3 (Strong Edge)' },
  { capital: 1000, totalTrades: 10, accuracy: 70, riskRewardRatio: 3, name: '70% / 1:3 (Very Strong)' },
  { capital: 1000, totalTrades: 10, accuracy: 65, riskRewardRatio: 4, name: '65% / 1:4 (Previously failing)' },
  { capital: 1000, totalTrades: 10, accuracy: 75, riskRewardRatio: 3, name: '75% / 1:3 (Previously failing)' },
  { capital: 1000, totalTrades: 10, accuracy: 80, riskRewardRatio: 6, name: '80% / 1:6 (Very Aggressive)' }
];

scenarios.forEach(sc => {
  const res = adaptiveKellyFormula(sc);
  console.log(`\n${sc.name}:`);
  console.log(`  Kelly: ${(res.kelly * 100).toFixed(2)}% → Using ${(res.kellyFraction * 100).toFixed(1)}%`);
  console.log(`  EV: ${res.expectedValue.toFixed(2)} | Per-Trade Return: ${(res.perTradeReturn * 100).toFixed(2)}%`);
  console.log(`  Result: $${res.profit.toFixed(2)}`);
});

console.log('\n' + '='.repeat(80) + '\n');
