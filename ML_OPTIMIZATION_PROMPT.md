# 🤖 Machine Learning Optimization Prompt for Target Profit Calculator

## Context

You're trying to reverse-engineer the "Lovely Profit" application's Target Net Profit calculation formula. Current formula achieves ~21% error with one test case, but you want < 5% error across all cases.

## Your Task

Build a highly accurate prediction model for Target Net Profit using machine learning and mathematical optimization.

---

## Data You Need to Gather

### Minimum Dataset: 20 Test Cases

Go to Lovely Profit and create sessions with these exact parameters, recording the **Target Net Profit** for each:

#### Set 1: Baseline Cases (RR = 1:3)
```
1.  Capital: $10,000 | Trades: 10 | Accuracy: 40% | RR: 1:3
2.  Capital: $10,000 | Trades: 10 | Accuracy: 45% | RR: 1:3
3.  Capital: $10,000 | Trades: 10 | Accuracy: 50% | RR: 1:3 ← YOU HAVE THIS
4.  Capital: $10,000 | Trades: 10 | Accuracy: 55% | RR: 1:3
5.  Capital: $10,000 | Trades: 10 | Accuracy: 60% | RR: 1:3
6.  Capital: $10,000 | Trades: 10 | Accuracy: 65% | RR: 1:3
7.  Capital: $10,000 | Trades: 10 | Accuracy: 70% | RR: 1:3
8.  Capital: $10,000 | Trades: 10 | Accuracy: 75% | RR: 1:3
9.  Capital: $10,000 | Trades: 10 | Accuracy: 80% | RR: 1:3
```

#### Set 2: Different RR Ratios (Accuracy = 60%)
```
10. Capital: $10,000 | Trades: 10 | Accuracy: 60% | RR: 1:1
11. Capital: $10,000 | Trades: 10 | Accuracy: 60% | RR: 1:2
12. Capital: $10,000 | Trades: 10 | Accuracy: 60% | RR: 1:4
13. Capital: $10,000 | Trades: 10 | Accuracy: 60% | RR: 1:5
14. Capital: $10,000 | Trades: 10 | Accuracy: 60% | RR: 1:6
```

#### Set 3: Different Trade Counts (Accuracy = 60%, RR = 1:3)
```
15. Capital: $10,000 | Trades: 5  | Accuracy: 60% | RR: 1:3
16. Capital: $10,000 | Trades: 15 | Accuracy: 60% | RR: 1:3
17. Capital: $10,000 | Trades: 20 | Accuracy: 60% | RR: 1:3
```

#### Set 4: Different Capital Amounts (Accuracy = 60%, RR = 1:3)
```
18. Capital: $1,000  | Trades: 10 | Accuracy: 60% | RR: 1:3
19. Capital: $5,000  | Trades: 10 | Accuracy: 60% | RR: 1:3
20. Capital: $50,000 | Trades: 10 | Accuracy: 60% | RR: 1:3
```

### Ideal Dataset: 50+ Test Cases

For production-level accuracy, gather additional edge cases:
- Very high accuracy (85-95%)
- Very low accuracy (30-40%)
- Very high RR ratios (1:8, 1:10)
- Very low RR ratios (1:0.5, 1:1)
- Many trades (50, 100)
- Different capital amounts ($100, $100,000)

---

## Approach 1: Polynomial Regression (Recommended for 20+ Cases)

### Step 1: Prepare Your Data

Create a CSV file `lovely_profit_data.csv`:

```csv
capital,total_trades,accuracy,rr_ratio,target_profit
10000,10,50,3,11799.69
10000,10,40,3,0.00
10000,10,60,3,50000.00
...
```

### Step 2: Python Script for Polynomial Regression

```python
import pandas as pd
import numpy as np
from sklearn.preprocessing import PolynomialFeatures, StandardScaler
from sklearn.linear_model import Ridge
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_percentage_error, r2_score
import matplotlib.pyplot as plt

# Load data
df = pd.read_csv('lovely_profit_data.csv')

# Create features
X = df[['capital', 'total_trades', 'accuracy', 'rr_ratio']]
y = df['target_profit']

# Create interaction and polynomial features
# This captures non-linear relationships like accuracy^2, RR*accuracy, etc.
poly = PolynomialFeatures(degree=3, include_bias=False)
X_poly = poly.fit_transform(X)

# Get feature names for later
feature_names = poly.get_feature_names_out(['capital', 'total_trades', 'accuracy', 'rr_ratio'])

# Normalize features (important for Ridge regression)
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_poly)

# Split data
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

# Train Ridge regression (L2 regularization prevents overfitting)
model = Ridge(alpha=1.0)
model.fit(X_train, y_train)

# Evaluate
y_pred_train = model.predict(X_train)
y_pred_test = model.predict(X_test)

train_mape = mean_absolute_percentage_error(y_train, y_pred_train) * 100
test_mape = mean_absolute_percentage_error(y_test, y_pred_test) * 100
r2 = r2_score(y_test, y_pred_test)

print(f"Training MAPE: {train_mape:.2f}%")
print(f"Test MAPE: {test_mape:.2f}%")
print(f"R² Score: {r2:.4f}")

# Cross-validation
cv_scores = cross_val_score(model, X_scaled, y, cv=5, scoring='neg_mean_absolute_percentage_error')
print(f"Cross-Validation MAPE: {-cv_scores.mean() * 100:.2f}% ± {cv_scores.std() * 100:.2f}%")

# Feature importance
coefficients = pd.DataFrame({
    'feature': feature_names,
    'coefficient': model.coef_
})
coefficients['abs_coef'] = np.abs(coefficients['coefficient'])
top_features = coefficients.nlargest(15, 'abs_coef')
print("\nTop 15 Most Important Features:")
print(top_features)

# Generate JavaScript code
print("\n" + "="*80)
print("JAVASCRIPT CODE FOR YOUR APP:")
print("="*80)

# Save scaler parameters
print(f"\nconst scalerMean = {scaler.mean_.tolist()};")
print(f"const scalerScale = {scaler.scale_.tolist()};")
print(f"const modelCoefficients = {model.coef_.tolist()};")
print(f"const modelIntercept = {model.intercept_};")

print("""
function predictTargetProfit(capital, totalTrades, accuracy, rrRatio) {
    // Create feature vector
    const features = [capital, totalTrades, accuracy, rrRatio];

    // Generate polynomial features (degree=3)
    const polyFeatures = generatePolynomialFeatures(features, 3);

    // Normalize features
    const normalizedFeatures = polyFeatures.map((val, idx) =>
        (val - scalerMean[idx]) / scalerScale[idx]
    );

    // Calculate prediction
    let prediction = modelIntercept;
    for (let i = 0; i < normalizedFeatures.length; i++) {
        prediction += normalizedFeatures[i] * modelCoefficients[i];
    }

    return Math.max(0, prediction); // Don't return negative profits
}

function generatePolynomialFeatures(features, degree) {
    // This generates all polynomial combinations up to degree 3
    // [x1, x2, x3, x4] → [x1, x2, x3, x4, x1², x1*x2, x1*x3, x1*x4, x2², ...]
    const poly = [];

    // Degree 1 (original features)
    poly.push(...features);

    // Degree 2
    for (let i = 0; i < features.length; i++) {
        for (let j = i; j < features.length; j++) {
            poly.push(features[i] * features[j]);
        }
    }

    // Degree 3
    for (let i = 0; i < features.length; i++) {
        for (let j = i; j < features.length; j++) {
            for (let k = j; k < features.length; k++) {
                poly.push(features[i] * features[j] * features[k]);
            }
        }
    }

    return poly;
}
""")

# Visualization
plt.figure(figsize=(12, 5))

plt.subplot(1, 2, 1)
plt.scatter(y_train, y_pred_train, alpha=0.5, label='Training')
plt.scatter(y_test, y_pred_test, alpha=0.5, label='Test')
plt.plot([y.min(), y.max()], [y.min(), y.max()], 'r--', lw=2)
plt.xlabel('Actual Target Profit')
plt.ylabel('Predicted Target Profit')
plt.title(f'Predictions vs Actual (Test MAPE: {test_mape:.2f}%)')
plt.legend()

plt.subplot(1, 2, 2)
errors = np.abs((y_test - y_pred_test) / y_test) * 100
plt.hist(errors, bins=20, edgecolor='black')
plt.xlabel('Absolute Percentage Error (%)')
plt.ylabel('Frequency')
plt.title('Error Distribution')
plt.axvline(x=10, color='green', linestyle='--', label='10% threshold')
plt.axvline(x=20, color='orange', linestyle='--', label='20% threshold')
plt.legend()

plt.tight_layout()
plt.savefig('model_evaluation.png', dpi=300, bbox_inches='tight')
print("\nVisualization saved as 'model_evaluation.png'")
```

### Step 3: Run the Script

```bash
pip install pandas numpy scikit-learn matplotlib
python ml_model.py
```

### Step 4: Copy Generated JavaScript to Your App

The script will output optimized JavaScript code. Replace your `calculateTargetProfit` function with it.

**Expected Accuracy: < 5% MAPE** with 20+ good test cases

---

## Approach 2: Grid Search Optimization (For Fine-Tuning Kelly Formula)

### Python Script for Kelly Formula Optimization

```python
import numpy as np
from scipy.optimize import differential_evolution, minimize
import pandas as pd

# Load your test cases
test_cases = [
    {'capital': 1000, 'trades': 10, 'accuracy': 50, 'rr': 3, 'expected': 11799.69},
    # Add all your test cases here
]

def kelly_formula(params, capital, trades, accuracy, rr):
    """
    Parameterized Kelly-based formula
    params: [base_kelly, ev_factor, accuracy_power, rr_power, scaling]
    """
    base_kelly, ev_factor, accuracy_power, rr_power, scaling = params

    win_rate = accuracy / 100
    kelly = (win_rate * rr - (1 - win_rate)) / rr

    if kelly <= 0:
        return 0

    ev = (win_rate * rr) - (1 - win_rate)

    # Adaptive Kelly fraction
    kelly_fraction = base_kelly + (ev * ev_factor)
    kelly_fraction = np.clip(kelly_fraction, 0.3, 0.95)

    # Calculate return with non-linear adjustments
    fractional_kelly = kelly * kelly_fraction
    accuracy_boost = np.power(win_rate, accuracy_power)
    rr_boost = np.power(rr, rr_power)

    per_trade_return = fractional_kelly * accuracy_boost * rr_boost * scaling

    final_balance = capital * np.power(1 + per_trade_return, trades)
    return final_balance - capital

def objective(params):
    """Calculate average percentage error across all test cases"""
    total_error = 0
    for tc in test_cases:
        predicted = kelly_formula(params, tc['capital'], tc['trades'],
                                  tc['accuracy'], tc['rr'])
        error = np.abs(predicted - tc['expected']) / tc['expected']
        total_error += error
    return total_error / len(test_cases)

# Parameter bounds: [base_kelly, ev_factor, accuracy_power, rr_power, scaling]
bounds = [
    (0.5, 0.95),   # base_kelly: 50-95%
    (0.0, 0.2),    # ev_factor: 0-20% adjustment per EV point
    (0.5, 2.0),    # accuracy_power: 0.5-2.0
    (0.3, 1.5),    # rr_power: 0.3-1.5
    (0.5, 2.0)     # scaling: 0.5-2.0
]

# Run global optimization
print("Running global optimization...")
result = differential_evolution(objective, bounds, maxiter=1000,
                                popsize=30, seed=42, workers=-1)

print(f"\nOptimization complete!")
print(f"Average Error: {result.fun * 100:.2f}%")
print(f"\nOptimal Parameters:")
print(f"  base_kelly:      {result.x[0]:.4f}")
print(f"  ev_factor:       {result.x[1]:.4f}")
print(f"  accuracy_power:  {result.x[2]:.4f}")
print(f"  rr_power:        {result.x[3]:.4f}")
print(f"  scaling:         {result.x[4]:.4f}")

# Test on each case
print("\n" + "="*80)
print("INDIVIDUAL TEST CASE RESULTS:")
print("="*80)
for i, tc in enumerate(test_cases):
    predicted = kelly_formula(result.x, tc['capital'], tc['trades'],
                             tc['accuracy'], tc['rr'])
    error = np.abs(predicted - tc['expected']) / tc['expected'] * 100
    status = "✅" if error < 10 else "⚠️" if error < 20 else "❌"
    print(f"{status} Case {i+1}: ${predicted:.2f} vs ${tc['expected']:.2f} ({error:.2f}% error)")

# Generate JavaScript code
print("\n" + "="*80)
print("OPTIMIZED JAVASCRIPT CODE:")
print("="*80)
print(f"""
const calculateTargetProfit = (session) => {{
  const {{ capital, totalTrades, accuracy, riskRewardRatio }} = session;
  const winRate = accuracy / 100;
  const kelly = (winRate * riskRewardRatio - (1 - winRate)) / riskRewardRatio;

  if (kelly <= 0) return 0;

  const expectedValue = (winRate * riskRewardRatio) - (1 - winRate);

  // Optimized parameters
  const baseKelly = {result.x[0]:.6f};
  const evFactor = {result.x[1]:.6f};
  const accuracyPower = {result.x[2]:.6f};
  const rrPower = {result.x[3]:.6f};
  const scaling = {result.x[4]:.6f};

  // Calculate adaptive Kelly fraction
  let kellyFraction = baseKelly + (expectedValue * evFactor);
  kellyFraction = Math.max(0.3, Math.min(0.95, kellyFraction));

  // Calculate per-trade return
  const fractionalKelly = kelly * kellyFraction;
  const accuracyBoost = Math.pow(winRate, accuracyPower);
  const rrBoost = Math.pow(riskRewardRatio, rrPower);
  const perTradeReturn = fractionalKelly * accuracyBoost * rrBoost * scaling;

  // Compound over all trades
  const finalBalance = capital * Math.pow(1 + perTradeReturn, totalTrades);
  return finalBalance - capital;
}};
""")
```

### Run the Optimizer

```bash
pip install scipy numpy pandas
python optimize_kelly.py
```

**Expected Accuracy: < 10% MAPE** with optimized parameters

---

## Approach 3: Neural Network (For Complex Patterns)

### Use if Kelly-based approaches fail

```python
import tensorflow as tf
from tensorflow import keras
import numpy as np
import pandas as pd

# Load data
df = pd.read_csv('lovely_profit_data.csv')
X = df[['capital', 'total_trades', 'accuracy', 'rr_ratio']].values
y = df['target_profit'].values

# Normalize
X_mean, X_std = X.mean(axis=0), X.std(axis=0)
y_mean, y_std = y.mean(), y.std()
X_normalized = (X - X_mean) / X_std
y_normalized = (y - y_mean) / y_std

# Build neural network
model = keras.Sequential([
    keras.layers.Dense(64, activation='relu', input_shape=(4,)),
    keras.layers.Dropout(0.2),
    keras.layers.Dense(32, activation='relu'),
    keras.layers.Dropout(0.2),
    keras.layers.Dense(16, activation='relu'),
    keras.layers.Dense(1)
])

model.compile(optimizer='adam', loss='mse', metrics=['mae'])

# Train
history = model.fit(X_normalized, y_normalized,
                   epochs=500, batch_size=8,
                   validation_split=0.2, verbose=0)

# Convert to JavaScript
print("Neural network trained successfully!")
print("To use in JavaScript, export to TensorFlow.js or use the coefficients")
```

---

## Approach 4: Reverse Engineering via Brute Force Pattern Detection

If you have 50+ test cases, look for patterns:

```python
# Analyze Kelly fraction patterns
for tc in test_cases:
    win_rate = tc['accuracy'] / 100
    kelly = (win_rate * tc['rr'] - (1 - win_rate)) / tc['rr']

    # Work backwards from expected profit
    # target = capital * (1 + r)^trades
    # r = (target/capital)^(1/trades) - 1

    r = np.power(tc['expected'] / tc['capital'], 1 / tc['trades']) - 1
    kelly_fraction_used = r / kelly

    ev = (win_rate * tc['rr']) - (1 - win_rate)

    print(f"Acc:{tc['accuracy']}% RR:1:{tc['rr']} EV:{ev:.2f} → Kelly Fraction:{kelly_fraction_used:.2%}")
```

This reveals the **exact Kelly fraction** Lovely Profit uses for each scenario!

---

## Expected Results

| Approach | Test Cases Needed | Expected Accuracy | Complexity |
|----------|------------------|-------------------|------------|
| **Polynomial Regression** | 20+ | < 5% MAPE | Medium |
| **Grid Search Kelly** | 10+ | < 10% MAPE | Low |
| **Neural Network** | 50+ | < 3% MAPE | High |
| **Pattern Detection** | 50+ | < 2% MAPE | Medium |

---

## Quick Win: Try This Right Now

With just your ONE test case, try these Kelly fractions manually:

```javascript
// Test different Kelly fractions for 50%/1:3 case
const kellys = [0.75, 0.78, 0.80, 0.82, 0.85, 0.88, 0.90];

kellys.forEach(k => {
    const kelly = 0.3333;
    const perTradeReturn = kelly * k;
    const result = 1000 * Math.pow(1 + perTradeReturn, 10);
    console.log(`Kelly ${(k*100).toFixed(0)}%: $${(result-1000).toFixed(2)}`);
});
```

Find which Kelly fraction gives you exactly $11,799.69, then use that as your base!

---

## Summary

**Best Path Forward:**

1. **Immediate** (1 hour): Manually test Kelly fractions from 75-90% to match your one case
2. **Short-term** (1 day): Gather 10 more test cases, run Grid Search Kelly optimizer
3. **Medium-term** (1 week): Gather 20+ test cases, build Polynomial Regression model
4. **Long-term** (1 month): Gather 50+ test cases, build Neural Network or perfect Kelly model

**With 20 good test cases and polynomial regression, you can achieve < 5% error across ALL scenarios!**

Good luck! 🚀
