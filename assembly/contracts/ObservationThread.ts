// Observation Thread Contract - Simplified for Massa AS constraints
import { Context, generateEvent, Storage } from '@massalabs/massa-as-sdk';
import { Args, stringToBytes } from '@massalabs/as-types';

// Storage keys
const THREAD_ID_KEY = 'thread_id';
const CURRENT_VALUE_KEY = 'current_value';
const CONFIDENCE_KEY = 'confidence';
const OBSERVATION_COUNT_KEY = 'observation_count';
const LAST_UPDATE_KEY = 'last_update';

/**
 * Constructor for observation thread
 */
export function constructor(binaryArgs: StaticArray<u8>): void {
  assert(Context.isDeployingContract());
  
  const args = new Args(binaryArgs);
  const threadId = args.nextU8().expect('Thread ID is required');
  const initialValue = args.nextI64().expect('Initial value is required');
  
  // Initialize thread state
  Storage.set(THREAD_ID_KEY, threadId.toString());
  Storage.set(CURRENT_VALUE_KEY, initialValue.toString());
  Storage.set(CONFIDENCE_KEY, '100');
  Storage.set(OBSERVATION_COUNT_KEY, '0');
  Storage.set(LAST_UPDATE_KEY, Context.timestamp().toString());
  
  generateEvent(`ObservationThread ${threadId} initialized with value ${initialValue}`);
}

/**
 * Update observation value
 */
export function updateObservation(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const newValue = args.nextI64().expect('Observation value is required');
  
  // Get current value
  const currentValueStr = Storage.get(CURRENT_VALUE_KEY);
  const currentValue = I64.parseInt(currentValueStr);
  
  // Calculate confidence based on value change
  const valueDiff = Math.abs((newValue - currentValue) as f64) as i64;
  let confidence: i32 = 100;
  if (valueDiff > 10000) confidence = 60;
  else if (valueDiff > 5000) confidence = 80;
  
  // Update state
  Storage.set(CURRENT_VALUE_KEY, newValue.toString());
  Storage.set(CONFIDENCE_KEY, confidence.toString());
  Storage.set(LAST_UPDATE_KEY, Context.timestamp().toString());
  
  // Update counter
  const countStr = Storage.get(OBSERVATION_COUNT_KEY);
  const count = I32.parseInt(countStr) + 1;
  Storage.set(OBSERVATION_COUNT_KEY, count.toString());
  
  const threadId = Storage.get(THREAD_ID_KEY);
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
 * Simulate market data update (for testing)
 */
export function simulateMarketData(_: StaticArray<u8>): void {
  // Get current value
  const currentValueStr = Storage.get(CURRENT_VALUE_KEY);
  const currentValue = I64.parseInt(currentValueStr);
  
  // Generate pseudo-random movement based on timestamp
  const timestamp = Context.timestamp();
  const seed = (timestamp % 1000) as i32;
  const randomFactor = (seed * 7919) % 2000 - 1000; // Range: -1000 to +999
  
  const newValue = currentValue + randomFactor;
  
  // Update with simulated data
  const args = new Args();
  args.add(newValue);
  updateObservation(args.serialize());
  
  const threadId = Storage.get(THREAD_ID_KEY);
  generateEvent(`Thread ${threadId} simulated market data: ${newValue} (change: ${randomFactor})`);
}