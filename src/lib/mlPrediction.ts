/**
 * Machine Learning Prediction Module
 * Uses TensorFlow.js for neural network-based expense prediction
 * 
 * Architecture:
 * - Input: Historical spending patterns (30-90 days of data)
 * - Model: Dense neural network with 2 hidden layers
 * - Output: Next month expense predictions per category
 * - Accuracy: Measured with R² and MAE metrics
 */

import * as tf from '@tensorflow/tfjs';
import { Transaction, Prediction, ExpenseCategory } from '@/types/finance';

interface TrainingData {
  features: number[][];
  labels: number[][];
  categoryIndexMap: Record<string, number>;
  categoryNames: string[];
  scalingFactor: number;
}

interface MLModel {
  model: tf.LayersModel;
  categoryIndexMap: Record<string, number>;
  categoryNames: string[];
  scalingFactor: number;
  accuracy: number;
  trainingLoss: number;
}

interface PredictionMetrics {
  predictions: Prediction[];
  modelAccuracy: number;
  meanAbsoluteError: number;
  r2Score: number;
  trainingHistory: { loss: number[]; val_loss: number[] };
  confidence: number;
}

/**
 * Prepare training data from transactions
 * Converts transaction history into numerical features for the neural network
 */
export function prepareTrainingData(transactions: Transaction[]): TrainingData | null {
  const expenses = transactions.filter(t => t.type === 'expense');
  
  if (expenses.length < 15) {
    console.warn('Insufficient data for ML training. Need at least 15 transactions.');
    return null;
  }

  // Get unique categories and map them to indices
  const categorySet = new Set<string>();
  expenses.forEach(t => categorySet.add(t.category));
  const categoryNames = Array.from(categorySet).sort();
  const categoryIndexMap: Record<string, number> = {};
  categoryNames.forEach((cat, idx) => {
    categoryIndexMap[cat] = idx;
  });

  // Sort transactions by date
  const sortedTransactions = [...expenses].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Group transactions by month
  const monthlyData: Record<string, Record<string, number>> = {};
  sortedTransactions.forEach(t => {
    const date = new Date(t.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {};
      categoryNames.forEach(cat => {
        monthlyData[monthKey][cat] = 0;
      });
    }
    monthlyData[monthKey][t.category] = (monthlyData[monthKey][t.category] || 0) + t.amount;
  });

  const months = Object.keys(monthlyData).sort();
  
  if (months.length < 2) {
    console.warn('Need at least 2 months of data for meaningful ML training.');
    return null;
  }

  // Create sliding windows of 2 months (input) -> 1 month (output)
  const features: number[][] = [];
  const labels: number[][] = [];
  
  for (let i = 0; i < months.length - 1; i++) {
    const inputMonth = monthlyData[months[i]];
    const outputMonth = monthlyData[months[i + 1]];
    
    // Create feature vector (category spending in current month)
    const feature = categoryNames.map(cat => inputMonth[cat] || 0);
    const label = categoryNames.map(cat => outputMonth[cat] || 0);
    
    features.push(feature);
    labels.push(label);
  }

  // Normalize data (scaling to 0-1 range for better training)
  const maxValue = Math.max(
    ...features.flat(),
    ...labels.flat()
  );
  const scalingFactor = maxValue > 0 ? maxValue : 1;

  const normalizedFeatures = features.map(f => f.map(v => v / scalingFactor));
  const normalizedLabels = labels.map(l => l.map(v => v / scalingFactor));

  return {
    features: normalizedFeatures,
    labels: normalizedLabels,
    categoryIndexMap,
    categoryNames,
    scalingFactor,
  };
}

/**
 * Build and train neural network model
 * Architecture: Input -> Dense(64) -> Dropout -> Dense(32) -> Dropout -> Output
 */
export async function trainMLModel(transactions: Transaction[]): Promise<MLModel | null> {
  const trainingData = prepareTrainingData(transactions);
  
  if (!trainingData) {
    return null;
  }

  const { features, labels, categoryIndexMap, categoryNames, scalingFactor } = trainingData;

  // Convert to tensors
  const xs = tf.tensor2d(features);
  const ys = tf.tensor2d(labels);

  // Build model
  const model = tf.sequential({
    layers: [
      // Input layer (implicit)
      tf.layers.dense({
        inputShape: [categoryNames.length],
        units: 64,
        activation: 'relu',
        name: 'hidden_1',
      }),
      tf.layers.dropout({ rate: 0.2 }),
      
      tf.layers.dense({
        units: 32,
        activation: 'relu',
        name: 'hidden_2',
      }),
      tf.layers.dropout({ rate: 0.2 }),
      
      tf.layers.dense({
        units: 16,
        activation: 'relu',
        name: 'hidden_3',
      }),
      
      // Output layer (one neuron per category)
      tf.layers.dense({
        units: categoryNames.length,
        activation: 'sigmoid',
        name: 'output',
      }),
    ],
  });

  // Compile model
  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'meanSquaredError',
    metrics: ['mae', 'mse'],
  });

  // Train model
  const history = await model.fit(xs, ys, {
    epochs: 200,
    batchSize: Math.max(2, Math.floor(features.length / 2)),
    validationSplit: 0.2,
    verbose: 0,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if (epoch % 50 === 0 && logs) {
          console.log(`Epoch ${epoch}: loss = ${logs.loss?.toFixed(4)}`);
        }
      },
    },
  });

  // Calculate accuracy metrics
  const predictions = model.predict(xs) as tf.Tensor;
  const predictionData = await (predictions as tf.Tensor2D).data();
  const labelData = await ys.data();

  // Calculate MAE (Mean Absolute Error)
  let mae = 0;
  for (let i = 0; i < labelData.length; i++) {
    mae += Math.abs(predictionData[i] - labelData[i]);
  }
  mae /= labelData.length;

  // Calculate R² (Coefficient of Determination)
  const meanLabel = (await ys.mean().data())[0];
  let ss_res = 0;
  let ss_tot = 0;
  for (let i = 0; i < labelData.length; i++) {
    ss_res += Math.pow(labelData[i] - predictionData[i], 2);
    ss_tot += Math.pow(labelData[i] - meanLabel, 2);
  }
  const r2 = 1 - (ss_res / ss_tot);

  // Get final training loss
  const finalLoss = (history.history.loss as number[])[(history.history.loss as number[]).length - 1] || 0;

  // Cleanup tensors
  xs.dispose();
  ys.dispose();
  predictions.dispose();

  // Calculate confidence (0-100%)
  // Based on: amount of data, R² score, MAE
  const dataConfidence = Math.min(100, (features.length / 20) * 100);
  const r2Confidence = Math.max(0, r2 * 100);
  const confidence = Math.round((dataConfidence * 0.3 + r2Confidence * 0.7));

  return {
    model,
    categoryIndexMap,
    categoryNames,
    scalingFactor,
    accuracy: r2,
    trainingLoss: finalLoss,
  };
}

/**
 * Make predictions using trained ML model
 */
export async function predictExpenses(
  trainedModel: MLModel,
  currentMonthTransactions: Transaction[]
): Promise<Prediction[]> {
  const { model, categoryNames, scalingFactor, accuracy } = trainedModel;

  // Prepare current month's spending
  const currentSpending: Record<string, number> = {};
  categoryNames.forEach(cat => {
    currentSpending[cat] = 0;
  });

  currentMonthTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      currentSpending[t.category] = (currentSpending[t.category] || 0) + t.amount;
    });

  // Normalize input
  const input = categoryNames.map(cat => currentSpending[cat] || 0);
  const normalizedInput = input.map(v => v / scalingFactor);

  // Predict
  const inputTensor = tf.tensor2d([normalizedInput]);
  const prediction = model.predict(inputTensor) as tf.Tensor;
  const predictionData = await (prediction.array() as Promise<number[][]>);
  const denormalizedPredictions = predictionData[0].map(v => v * scalingFactor);

  // Convert to Prediction objects
  const predictions: Prediction[] = categoryNames
    .map((category, idx) => {
      const predictedAmount = Math.round(denormalizedPredictions[idx]);
      const currentAmount = Math.round(currentSpending[category] || 0);
      const percentageChange = currentAmount > 0 
        ? Math.round(((predictedAmount - currentAmount) / currentAmount) * 100)
        : 0;

      const trend: 'up' | 'down' | 'stable' = 
        percentageChange > 5 ? 'up' : percentageChange < -5 ? 'down' : 'stable';

      return {
        category: category as ExpenseCategory,
        predictedAmount,
        confidence: Math.round(Math.max(50, Math.min(95, 70 + (accuracy * 25)))),
        trend,
        percentageChange,
      };
    })
    .filter(p => p.predictedAmount > 0)
    .sort((a, b) => b.predictedAmount - a.predictedAmount)
    .slice(0, 6);

  // Cleanup
  inputTensor.dispose();
  prediction.dispose();

  return predictions;
}

/**
 * Calculate comprehensive metrics for model evaluation
 */
export async function calculateMetrics(
  trainedModel: MLModel,
  transactions: Transaction[],
  trainingHistory: { loss: number[]; val_loss: number[] }
): Promise<PredictionMetrics> {
  const predictions = await predictExpenses(trainedModel, transactions);
  const confidence = Math.round(
    Math.max(50, Math.min(95, 70 + (trainedModel.accuracy * 25)))
  );

  // Calculate MAE from training
  const mae = trainingHistory.loss.length > 0 
    ? Math.sqrt(trainingHistory.loss[trainingHistory.loss.length - 1])
    : 0;

  return {
    predictions,
    modelAccuracy: Math.round(trainedModel.accuracy * 100),
    meanAbsoluteError: parseFloat(mae.toFixed(2)),
    r2Score: parseFloat((trainedModel.accuracy * 100).toFixed(2)),
    trainingHistory,
    confidence,
  };
}

/**
 * Serialize model for storage
 */
export async function saveModel(model: MLModel): Promise<string> {
  // Note: In production, you'd save this to IndexedDB or a backend service
  // For now, we'll return a JSON representation of metadata
  return JSON.stringify({
    categoryIndexMap: model.categoryIndexMap,
    categoryNames: model.categoryNames,
    scalingFactor: model.scalingFactor,
    accuracy: model.accuracy,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Load model from storage
 */
export async function loadModel(modelData: string): Promise<MLModel | null> {
  try {
    const metadata = JSON.parse(modelData);
    // In production, you'd load the actual model from storage
    // For now, we'll return null and retrain on demand
    console.log('Model metadata:', metadata);
    return null;
  } catch (error) {
    console.error('Failed to load model:', error);
    return null;
  }
}

/**
 * Cleanup model and free GPU/CPU memory
 */
export function disposeModel(model: MLModel): void {
  model.model.dispose();
}
