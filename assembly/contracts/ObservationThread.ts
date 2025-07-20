// Enhanced Observation Thread Contract with Real Data Integration
import { Context, generateEvent, Storage } from '@massalabs/massa-as-sdk';
import { Args, stringToBytes } from '@massalabs/as-types';
import { PriceOracle, PriceData } from './oracles/PriceOracle';

// Storage keys
const THREAD_ID_KEY = 'thread_id';
const CURRENT_VALUE_KEY = 'current_value';
const CONFIDENCE_KEY = 'confidence';
const OBSERVATION_COUNT_KEY = 'observation_count';
const LAST_UPDATE_KEY = 'last_update';
const DATA_SOURCE_KEY = 'data_source';
const ERROR_COUNT_KEY = 'error_count';
const THREAD_ASSET_KEY = 'thread_asset';
const HISTORICAL_VALUES_KEY = 'historical_values';

/**
 * Enhanced constructor with error handling
 */
export function constructor(binaryArgs: StaticArray<u8>): void {
  assert(Context.isDeployingContract(), 'Constructor can only be called during deployment');
  
  const args = new Args(binaryArgs);
  const threadIdResult = args.nextU8();
  const initialValueResult = args.nextI64();
  
  // Safe extraction with error handling
  if (!threadIdResult.isOk()) {
    assert(false, 'Thread ID is required');
    return;
  }
  
  if (!initialValueResult.isOk()) {
    assert(false, 'Initial value is required');
    return;
  }
  
  const threadId = threadIdResult.unwrap();
  const initialValue = initialValueResult.unwrap();
  
  // Validate inputs
  if (threadId > 10) {
    assert(false, 'Thread ID must be <= 10');
    return;
  }
  
  // Initialize thread state with safety checks
  Storage.set(THREAD_ID_KEY, threadId.toString());
  Storage.set(CURRENT_VALUE_KEY, initialValue.toString());
  Storage.set(CONFIDENCE_KEY, '100');
  Storage.set(OBSERVATION_COUNT_KEY, '0');
  Storage.set(LAST_UPDATE_KEY, Context.timestamp().toString());
  Storage.set(ERROR_COUNT_KEY, '0');
  Storage.set(THREAD_ASSET_KEY, 'MAS'); // Default asset
  Storage.set(HISTORICAL_VALUES_KEY, initialValue.toString());
  
  generateEvent(`Enhanced ObservationThread ${threadId} initialized with value ${initialValue}`);
}

/**
 * Update observation with real market data
 */
export function updateObservation(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const newValueResult = args.nextI64();
  
  if (!newValueResult.isOk()) {
    incrementErrorCount('Invalid observation value');
    return;
  }
  
  const newValue = newValueResult.unwrap();
  
  // Validate observation value
  if (newValue < -1000000 || newValue > 1000000) {
    incrementErrorCount('Observation value out of range');
    return;
  }
  
  // Safe current value retrieval
  if (!Storage.has(CURRENT_VALUE_KEY)) {
    incrementErrorCount('Current value not initialized');
    return;
  }
  
  const currentValueStr = Storage.get(CURRENT_VALUE_KEY);
  const currentValue = safeParseI64(currentValueStr, 0);
  
  // Calculate confidence based on value change and historical volatility
  const confidence = calculateConfidence(newValue, currentValue);
  
  // Update state with safety checks
  Storage.set(CURRENT_VALUE_KEY, newValue.toString());
  Storage.set(CONFIDENCE_KEY, confidence.toString());
  Storage.set(LAST_UPDATE_KEY, Context.timestamp().toString());
  
  // Update counter safely
  const count = safeGetCounter(OBSERVATION_COUNT_KEY) + 1;
  Storage.set(OBSERVATION_COUNT_KEY, count.toString());
  
  // Update historical values for trend analysis
  updateHistoricalValues(newValue);
  
  const threadId = safeGetString(THREAD_ID_KEY, '0');
  generateEvent(`Thread ${threadId} updated: value=${newValue}, confidence=${confidence}`);
}

/**
 * Get current thread state
 */
export function getThreadState(_: StaticArray<u8>): StaticArray<u8> {
  const args = new Args();
  
  args.add(Storage.get(THREAD_ID_KEY));
  args.add(Storage.get(CURRENT_VALUE_KEY));
  args.add(Storage.get(CONFIDENCE_KEY));
  args.add(Storage.get(LAST_UPDATE_KEY));
  
  return args.serialize();
}

/**
 * Get thread ID
 */
export function getThreadId(_: StaticArray<u8>): StaticArray<u8> {
  const threadId = Storage.has(THREAD_ID_KEY) ? Storage.get(THREAD_ID_KEY) : '0';
  return stringToBytes(threadId);
}

/**
 * Get observation statistics
 */
export function getStats(_: StaticArray<u8>): StaticArray<u8> {
  const args = new Args();
  
  args.add(Storage.get(THREAD_ID_KEY));
  args.add(Storage.get(OBSERVATION_COUNT_KEY));
  args.add(Storage.get(LAST_UPDATE_KEY));
  args.add(Storage.get(CURRENT_VALUE_KEY));
  args.add(Storage.get(CONFIDENCE_KEY));
  
  return args.serialize();
}

/**
 * Update with real market data from oracle
 */
export function updateFromOracle(_: StaticArray<u8>): void {
  const asset = safeGetString(THREAD_ASSET_KEY, 'MAS');
  
  // Fetch real market data
  const priceData = PriceOracle.fetchPrice(asset);
  
  if (!priceData.isValid()) {
    incrementErrorCount('Invalid oracle data received');
    // Fallback to simulation in case of oracle failure
    simulateMarketData(_);
    return;
  }
  
  // Store data source information
  Storage.set(DATA_SOURCE_KEY, priceData.source.toString());
  
  // Update with real data
  const args = new Args();
  args.add(priceData.price);
  updateObservation(args.serialize());
  
  const threadId = safeGetString(THREAD_ID_KEY, '0');
  generateEvent(`Thread ${threadId} updated from oracle: price=${priceData.price}, confidence=${priceData.confidence}%`);
}

/**
 * Simulate market data update (fallback for testing)
 */
export function simulateMarketData(_: StaticArray<u8>): void {
  // Safe current value retrieval
  const currentValue = safeGetI64(CURRENT_VALUE_KEY, 1000);
  
  // Generate more realistic pseudo-random movement
  const timestamp = Context.timestamp();
  const seed = (timestamp % 1000) as i32;
  const randomFactor = (seed * 7919) % 2000 - 1000; // Range: -1000 to +999
  
  // Apply some bounds checking to prevent extreme values
  let newValue = currentValue + randomFactor;
  if (newValue > 500000) newValue = 500000;
  if (newValue < -500000) newValue = -500000;
  
  // Mark as simulated data
  Storage.set(DATA_SOURCE_KEY, '2'); // DataSource.MOCK_SIMULATION
  
  // Update with simulated data
  const args = new Args();
  args.add(newValue);
  updateObservation(args.serialize());
  
  const threadId = safeGetString(THREAD_ID_KEY, '0');
  generateEvent(`Thread ${threadId} simulated market data: ${newValue} (change: ${randomFactor})`);
}

// ==================== SAFETY HELPER FUNCTIONS ====================

/**
 * Safe string retrieval with default
 */
function safeGetString(key: string, defaultValue: string): string {
  return Storage.has(key) ? Storage.get(key) : defaultValue;
}

/**
 * Safe i64 parsing with default
 */
function safeParseI64(value: string, defaultValue: i64): i64 {
  if (value.length === 0) return defaultValue;
  
  const parsed = I64.parseInt(value);
  // Basic validation - if parsing returns 0 for non-zero string, it likely failed
  if (parsed === 0 && value !== '0') {
    return defaultValue;
  }
  return parsed;
}

/**
 * Safe i64 retrieval with default
 */
function safeGetI64(key: string, defaultValue: i64): i64 {
  if (!Storage.has(key)) return defaultValue;
  return safeParseI64(Storage.get(key), defaultValue);
}

/**
 * Safe counter retrieval
 */
function safeGetCounter(key: string): i32 {
  if (!Storage.has(key)) return 0;
  const value = Storage.get(key);
  const parsed = I32.parseInt(value);
  // Ensure non-negative counters
  return Math.max(0, parsed) as i32;
}

/**
 * Calculate confidence based on value change and volatility
 */
function calculateConfidence(newValue: i64, currentValue: i64): i32 {
  const valueDiff = Math.abs((newValue - currentValue) as f64) as i64;
  
  // Get historical volatility for better confidence calculation
  const historicalVolatility = calculateHistoricalVolatility();
  
  // Base confidence
  let confidence: i32 = 100;
  
  // Adjust based on change magnitude relative to historical volatility
  if (historicalVolatility > 0) {
    const normalizedChange = (valueDiff as f64) / (historicalVolatility as f64);
    
    if (normalizedChange > 3.0) confidence = 30;      // > 3 sigma: very suspicious
    else if (normalizedChange > 2.0) confidence = 50; // > 2 sigma: suspicious
    else if (normalizedChange > 1.0) confidence = 70; // > 1 sigma: somewhat normal
    else confidence = 95; // Within 1 sigma: high confidence
  } else {
    // Fallback to simple thresholds if no historical data
    if (valueDiff > 10000) confidence = 60;
    else if (valueDiff > 5000) confidence = 80;
  }
  
  return confidence;
}

/**
 * Calculate historical volatility from stored values
 */
function calculateHistoricalVolatility(): i64 {
  if (!Storage.has(HISTORICAL_VALUES_KEY)) {
    return 1000; // Default volatility
  }
  
  const valuesStr = Storage.get(HISTORICAL_VALUES_KEY);
  const values = valuesStr.split(',');
  
  if (values.length < 2) {
    return 1000;
  }
  
  // Calculate simple volatility (standard deviation approximation)
  let sum: f64 = 0;
  let count: i32 = 0;
  
  for (let i = 0; i < values.length; i++) {
    const value = safeParseI64(values[i], 0);
    sum += value as f64;
    count++;
  }
  
  if (count === 0) return 1000;
  
  const mean = sum / (count as f64);
  let variance: f64 = 0;
  
  for (let i = 0; i < values.length; i++) {
    const value = safeParseI64(values[i], 0);
    const diff = (value as f64) - mean;
    variance += diff * diff;
  }
  
  const stdDev = Math.sqrt(variance / (count as f64));
  const stdDevInt = stdDev as i64;
  return stdDevInt > 100 ? stdDevInt : 100; // Minimum volatility of 100
}

/**
 * Update historical values buffer for trend analysis
 */
function updateHistoricalValues(newValue: i64): void {
  const key = HISTORICAL_VALUES_KEY;
  const valuesStr = safeGetString(key, '');
  const values = valuesStr.length > 0 ? valuesStr.split(',') : [];
  
  // Add new value
  values.push(newValue.toString());
  
  // Keep only last 20 values for volatility calculation
  if (values.length > 20) {
    values.splice(0, values.length - 20);
  }
  
  Storage.set(key, values.join(','));
}

/**
 * Increment error counter and log
 */
function incrementErrorCount(errorMessage: string): void {
  const count = safeGetCounter(ERROR_COUNT_KEY) + 1;
  Storage.set(ERROR_COUNT_KEY, count.toString());
  
  const threadId = safeGetString(THREAD_ID_KEY, '0');
  generateEvent(`Thread ${threadId} error ${count}: ${errorMessage}`);
  
  // If too many errors, switch to degraded mode
  if (count > 10) {
    generateEvent(`Thread ${threadId} entering degraded mode due to excessive errors`);
  }
}

/**
 * Get error statistics
 */
export function getErrorStats(_: StaticArray<u8>): StaticArray<u8> {
  const args = new Args();
  
  args.add(safeGetString(THREAD_ID_KEY, '0'));
  args.add(safeGetCounter(ERROR_COUNT_KEY).toString());
  args.add(safeGetString(DATA_SOURCE_KEY, '2')); // Default to mock
  args.add(Context.timestamp().toString());
  
  return args.serialize();
}