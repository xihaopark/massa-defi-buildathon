// Main Controller Contract - Simplified for Massa AS constraints
import { 
  Context, 
  generateEvent, 
  Storage, 
  call,
  Address
} from '@massalabs/massa-as-sdk';
import { Args, stringToBytes, bytesToString } from '@massalabs/as-types';

// Storage keys
const THREAD_ADDRESSES_KEY = 'thread_addresses';
const CURRENT_STATE_KEY = 'current_state';
const CYCLE_COUNT_KEY = 'cycle_count';
const DECISION_COUNT_KEY = 'decision_count';
const LAST_DECISION_KEY = 'last_decision';

/**
 * Constructor for main controller
 */
export function constructor(binaryArgs: StaticArray<u8>): void {
  assert(Context.isDeployingContract());
  
  const args = new Args(binaryArgs);
  const threadCount = args.nextU8().expect('Thread count is required');
  
  // Store thread addresses as simple string concatenation
  let addressesStr = threadCount.toString() + ';';
  for (let i: i32 = 0; i < (threadCount as i32); i++) {
    const address = args.nextString().expect(`Thread address ${i} is required`);
    addressesStr += address + ';';
  }
  
  Storage.set(THREAD_ADDRESSES_KEY, addressesStr);
  Storage.set(CURRENT_STATE_KEY, 'SIDEWAYS'); // Default state
  Storage.set(CYCLE_COUNT_KEY, '0');
  Storage.set(DECISION_COUNT_KEY, '0');
  
  generateEvent(`MainController initialized with ${threadCount} observation threads`);
  
  // Schedule first cycle (simplified)
  scheduleNextCycle();
}

/**
 * Main autonomous cycle - simplified version
 */
export function autonomousCycle(_: StaticArray<u8>): void {
  // Update cycle counter
  const cycleStr = Storage.has(CYCLE_COUNT_KEY) ? Storage.get(CYCLE_COUNT_KEY) : '0';
  const cycle = I32.parseInt(cycleStr) + 1;
  Storage.set(CYCLE_COUNT_KEY, cycle.toString());
  
  generateEvent(`Starting autonomous cycle ${cycle}`);
  
  // Simplified logic without try-catch
  const observations = sampleObservations();
  const weights = computeAttentionWeights(observations);
  const newState = updateHiddenState(observations, weights);
  makeDecision(newState, observations);
  
  generateEvent(`Cycle ${cycle} completed successfully`);
  
  // Schedule next cycle
  scheduleNextCycle();
}

/**
 * Sample observations from threads - simplified
 */
function sampleObservations(): i32 {
  // Return mock weighted observation for now
  const cycle = I32.parseInt(Storage.get(CYCLE_COUNT_KEY));
  return (cycle % 100) - 50; // Range -50 to +49
}

/**
 * Compute attention weights - simplified
 */
function computeAttentionWeights(observation: i32): i32 {
  // Return simple weight based on observation magnitude
  return Math.abs(observation) as i32;
}

/**
 * Update HMM state - simplified
 */
function updateHiddenState(observation: i32, weight: i32): string {
  let newState = 'SIDEWAYS';
  
  if (observation > 20) {
    newState = 'BULL';
  } else if (observation < -20) {
    newState = 'BEAR';
  }
  
  Storage.set(CURRENT_STATE_KEY, newState);
  return newState;
}

/**
 * Make decision based on state
 */
function makeDecision(state: string, observation: i32): void {
  let action = 'NO_ACTION';
  let description = 'No action taken';
  
  if (state === 'BULL') {
    action = 'BUY_SIGNAL';
    description = 'Bull market detected - Buy signal generated';
  } else if (state === 'BEAR') {
    action = 'SELL_SIGNAL';
    description = 'Bear market detected - Sell signal generated';
  } else {
    action = 'REBALANCE';
    description = 'Sideways market - Rebalance portfolio';
  }
  
  // Record decision
  const timestamp = Context.timestamp();
  const decisionRecord = `${timestamp};${state};${action};${description}`;
  Storage.set(LAST_DECISION_KEY, decisionRecord);
  
  // Update decision counter
  const countStr = Storage.has(DECISION_COUNT_KEY) ? Storage.get(DECISION_COUNT_KEY) : '0';
  const count = I32.parseInt(countStr) + 1;
  Storage.set(DECISION_COUNT_KEY, count.toString());
  
  generateEvent(`Decision ${count}: ${description} (State: ${state})`);
}

/**
 * Schedule next cycle - simplified without deferredCall
 */
function scheduleNextCycle(): void {
  generateEvent('Next cycle will be triggered manually or by external scheduler');
}

/**
 * Get current system status
 */
export function getSystemStatus(_: StaticArray<u8>): StaticArray<u8> {
  const args = new Args();
  
  args.add(Storage.has(CURRENT_STATE_KEY) ? Storage.get(CURRENT_STATE_KEY) : 'UNINITIALIZED');
  args.add(Storage.has(CYCLE_COUNT_KEY) ? Storage.get(CYCLE_COUNT_KEY) : '0');
  args.add(Storage.has(DECISION_COUNT_KEY) ? Storage.get(DECISION_COUNT_KEY) : '0');
  args.add(Context.timestamp().toString());
  
  return args.serialize();
}

/**
 * Get last decision
 */
export function getLastDecision(_: StaticArray<u8>): StaticArray<u8> {
  if (!Storage.has(LAST_DECISION_KEY)) {
    return stringToBytes('No decisions made yet');
  }
  
  return stringToBytes(Storage.get(LAST_DECISION_KEY));
}

/**
 * Force update cycle (for testing)
 */
export function forceUpdate(_: StaticArray<u8>): void {
  autonomousCycle(new Args().serialize());
}

/**
 * Get thread addresses for frontend
 */
export function getThreadAddresses(_: StaticArray<u8>): StaticArray<u8> {
  const addresses = Storage.has(THREAD_ADDRESSES_KEY) ? Storage.get(THREAD_ADDRESSES_KEY) : '';
  return stringToBytes(addresses);
}