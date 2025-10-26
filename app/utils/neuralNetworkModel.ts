/**
 * Advanced Neural Network Model for Target Profit Calculation
 * 
 * This implementation uses a multi-layer perceptron to learn complex patterns
 * in trading parameters and predict more accurate target profits.
 */

export interface TrainingData {
  capital: number;
  totalTrades: number;
  accuracy: number;
  riskRewardRatio: number;
  expectedProfit: number;
}

export interface ModelWeights {
  inputLayer: number[][];
  hiddenLayer: number[][];
  outputLayer: number[];
  biases: {
    hidden: number[];
    output: number;
  };
}

export class NeuralNetworkModel {
  private weights: ModelWeights;
  private learningRate: number = 0.01;
  private momentum: number = 0.9;
  private regularization: number = 0.001;

  constructor() {
    this.weights = this.initializeWeights();
  }

  private initializeWeights(): ModelWeights {
    // Initialize with Xavier/He initialization for better gradient flow
    const inputSize = 4; // capital, trades, accuracy, rr
    const hiddenSize = 8;
    const outputSize = 1;

    return {
      inputLayer: Array(inputSize).fill(null).map(() => 
        Array(hiddenSize).fill(null).map(() => (Math.random() - 0.5) * 2 / Math.sqrt(inputSize))
      ),
      hiddenLayer: Array(hiddenSize).fill(null).map(() => 
        Array(outputSize).fill(null).map(() => (Math.random() - 0.5) * 2 / Math.sqrt(hiddenSize))
      ),
      outputLayer: Array(outputSize).fill(0),
      biases: {
        hidden: Array(hiddenSize).fill(0),
        output: 0
      }
    };
  }

  private normalizeInputs(inputs: number[]): number[] {
    // Normalize inputs to [0, 1] range for better training
    const normalized = [...inputs];
    
    // Capital: normalize to [0, 1] (assuming max capital of 1M)
    normalized[0] = Math.min(inputs[0] / 1000000, 1);
    
    // Total trades: normalize to [0, 1] (assuming max 100 trades)
    normalized[1] = Math.min(inputs[1] / 100, 1);
    
    // Accuracy: already in [0, 1] range
    normalized[2] = inputs[2] / 100;
    
    // Risk reward ratio: normalize to [0, 1] (assuming max RR of 10)
    normalized[3] = Math.min(inputs[3] / 10, 1);
    
    return normalized;
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  private sigmoidDerivative(x: number): number {
    const s = this.sigmoid(x);
    return s * (1 - s);
  }

  private relu(x: number): number {
    return Math.max(0, x);
  }

  private reluDerivative(x: number): number {
    return x > 0 ? 1 : 0;
  }

  private forwardPass(inputs: number[]): { hidden: number[]; output: number } {
    const normalizedInputs = this.normalizeInputs(inputs);
    
    // Calculate hidden layer
    const hidden = this.weights.inputLayer.map((weights, i) => {
      const sum = normalizedInputs.reduce((acc, input, j) => acc + input * weights[j], 0);
      return this.relu(sum + this.weights.biases.hidden[i]);
    });

    // Calculate output layer
    const outputSum = hidden.reduce((acc, h, i) => acc + h * this.weights.hiddenLayer[i][0], 0);
    const output = this.sigmoid(outputSum + this.weights.biases.output);

    return { hidden, output };
  }

  public predict(capital: number, totalTrades: number, accuracy: number, riskRewardRatio: number): number {
    const inputs = [capital, totalTrades, accuracy, riskRewardRatio];
    const { output } = this.forwardPass(inputs);
    
    // Denormalize output to actual profit range
    // Assuming max profit of 10x capital
    return output * capital * 10;
  }

  public train(trainingData: TrainingData[], epochs: number = 1000): void {
    console.log(`Training neural network with ${trainingData.length} samples for ${epochs} epochs...`);
    
    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalError = 0;
      
      // Shuffle training data for better learning
      const shuffledData = [...trainingData].sort(() => Math.random() - 0.5);
      
      for (const data of shuffledData) {
        const inputs = [data.capital, data.totalTrades, data.accuracy, data.riskRewardRatio];
        const normalizedInputs = this.normalizeInputs(inputs);
        const target = data.expectedProfit / (data.capital * 10); // Normalize target
        
        // Forward pass
        const { hidden, output } = this.forwardPass(inputs);
        
        // Calculate error
        const error = target - output;
        totalError += Math.abs(error);
        
        // Backpropagation
        this.backwardPass(normalizedInputs, hidden, output, error);
      }
      
      // Learning rate decay
      if (epoch % 100 === 0) {
        this.learningRate *= 0.95;
      }
      
      if (epoch % 100 === 0) {
        console.log(`Epoch ${epoch}: Average Error = ${(totalError / trainingData.length).toFixed(6)}`);
      }
    }
    
    console.log('Neural network training completed!');
  }

  private backwardPass(inputs: number[], hidden: number[], output: number, error: number): void {
    // Calculate gradients
    const outputGradient = error * this.sigmoidDerivative(output);
    
    // Update output layer weights and bias
    for (let i = 0; i < hidden.length; i++) {
      const weightGradient = outputGradient * hidden[i];
      this.weights.hiddenLayer[i][0] += this.learningRate * weightGradient;
    }
    this.weights.biases.output += this.learningRate * outputGradient;
    
    // Calculate hidden layer gradients
    const hiddenGradients = hidden.map((h, i) => {
      const weightGradient = outputGradient * this.weights.hiddenLayer[i][0];
      return weightGradient * this.reluDerivative(h);
    });
    
    // Update input layer weights
    for (let i = 0; i < inputs.length; i++) {
      for (let j = 0; j < hidden.length; j++) {
        const weightGradient = hiddenGradients[j] * inputs[i];
        this.weights.inputLayer[i][j] += this.learningRate * weightGradient;
      }
    }
    
    // Update hidden layer biases
    for (let i = 0; i < hidden.length; i++) {
      this.weights.biases.hidden[i] += this.learningRate * hiddenGradients[i];
    }
  }

  public getModelAccuracy(testData: TrainingData[]): number {
    let totalError = 0;
    let totalSamples = 0;
    
    for (const data of testData) {
      const prediction = this.predict(data.capital, data.totalTrades, data.accuracy, data.riskRewardRatio);
      const actualError = Math.abs(prediction - data.expectedProfit) / data.expectedProfit;
      totalError += actualError;
      totalSamples++;
    }
    
    return 1 - (totalError / totalSamples); // Return accuracy as percentage
  }

  public saveModel(): string {
    return JSON.stringify(this.weights);
  }

  public loadModel(weightsJson: string): void {
    this.weights = JSON.parse(weightsJson);
  }
}

// Hybrid approach combining neural network with traditional formulas
export class HybridProfitCalculator {
  private neuralNetwork: NeuralNetworkModel;
  private traditionalFormula: (capital: number, trades: number, accuracy: number, rr: number) => number;

  constructor() {
    this.neuralNetwork = new NeuralNetworkModel();
    this.traditionalFormula = this.createTraditionalFormula();
  }

  private createTraditionalFormula() {
    return (capital: number, totalTrades: number, accuracy: number, riskRewardRatio: number): number => {
      const winRate = accuracy / 100;
      const kelly = (winRate * riskRewardRatio - (1 - winRate)) / riskRewardRatio;
      
      if (kelly <= 0) return 0;

      let kellyFraction, scalingFactor, accuracyExponent, rrExponent;

      if (riskRewardRatio <= 2) {
        kellyFraction = 0.20;
        scalingFactor = 0.12;
        accuracyExponent = 1.1;
        rrExponent = 0.5;
      } else if (riskRewardRatio <= 4) {
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
      const expectedValue = (winRate * riskRewardRatio) - (1 - winRate);
      const accuracyBoost = Math.pow(winRate, accuracyExponent);
      const rrBoost = Math.pow(riskRewardRatio, rrExponent);
      const perTradeReturn = fractionalKelly * expectedValue * accuracyBoost * rrBoost * scalingFactor;

      const finalBalance = capital * Math.pow(1 + perTradeReturn, totalTrades);
      return finalBalance - capital;
    };
  }

  public calculateTargetProfit(
    capital: number, 
    totalTrades: number, 
    accuracy: number, 
    riskRewardRatio: number,
    useNeuralNetwork: boolean = true
  ): number {
    if (useNeuralNetwork) {
      // Use neural network prediction
      const nnPrediction = this.neuralNetwork.predict(capital, totalTrades, accuracy, riskRewardRatio);
      const traditionalPrediction = this.traditionalFormula(capital, totalTrades, accuracy, riskRewardRatio);
      
      // Weighted average: 70% neural network, 30% traditional
      return nnPrediction * 0.7 + traditionalPrediction * 0.3;
    } else {
      return this.traditionalFormula(capital, totalTrades, accuracy, riskRewardRatio);
    }
  }

  public trainWithData(trainingData: TrainingData[]): void {
    this.neuralNetwork.train(trainingData);
  }

  public getModelAccuracy(testData: TrainingData[]): number {
    return this.neuralNetwork.getModelAccuracy(testData);
  }
}

// Export singleton instance
export const hybridCalculator = new HybridProfitCalculator();



