// Simplified Enhanced Main Controller - Compatible with AssemblyScript
import { 
  Context, 
  generateEvent, 
  Storage
} from '@massalabs/massa-as-sdk';
import { Args, stringToBytes } from '@massalabs/as-types';

// Storage keys
const THREAD_ADDRESSES_KEY = 'thread_addresses';
const CURRENT_STATE_KEY = 'current_state';
const CYCLE_COUNT_KEY = 'cycle_count';
const DECISION_COUNT_KEY = 'decision_count';
const LAST_DECISION_KEY = 'last_decision';
const SYSTEM_STATUS_KEY = 'system_status';
const LAST_ERROR_KEY = 'last_error';
const LOG_LEVEL_KEY = 'log_level';

// System states
enum SystemStatus {
  INITIALIZING = 0,
  RUNNING = 1,
  ERROR = 2,
  MAINTENANCE = 3
}

enum MarketState {
  BULL = 0,
  BEAR = 1,
  SIDEWAYS = 2
}

enum DecisionAction {
  NO_ACTION = 0,
  BUY_SIGNAL = 1,
  SELL_SIGNAL = 2,
  REBALANCE = 3
}

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

// Simple logging without complex classes
function logEvent(level: LogLevel, component: string, message: string, data: string = ''): void {
  const currentLevel = Storage.has(LOG_LEVEL_KEY) ? I32.parseInt(Storage.get(LOG_LEVEL_KEY)) as LogLevel : LogLevel.INFO;
  
  if (level < currentLevel) {
    return;
  }

  const timestamp = Context.timestamp();
  const levelStr = getLevelString(level);
  const dataStr = data.length > 0 ? ` | Data: ${data}` : '';
  const logMessage = `[${timestamp}] ${levelStr} [${component}] ${message}${dataStr}`;
  
  generateEvent(logMessage);
  
  // Store errors for debugging
  if (level >= LogLevel.ERROR) {
    const errorKey = `error_${timestamp}`;
    Storage.set(errorKey, logMessage);
  }
}

function getLevelString(level: LogLevel): string {
  switch (level) {
    case LogLevel.DEBUG: return 'DEBUG';
    case LogLevel.INFO: return 'INFO';
    case LogLevel.WARN: return 'WARN';
    case LogLevel.ERROR: return 'ERROR';
    case LogLevel.CRITICAL: return 'CRITICAL';
    default: return 'UNKNOWN';
  }
}

// Validation functions
function validateObservation(value: i64, threadId: u8, confidence: u32): boolean {
  const MIN_VALUE: i64 = -1000000;
  const MAX_VALUE: i64 = 1000000;
  
  if (value < MIN_VALUE || value > MAX_VALUE) {
    logEvent(LogLevel.WARN, 'Validator', `Observation out of range: ${value}`, `threadId=${threadId}`);
    return false;
  }
  
  if (confidence > 100) {
    logEvent(LogLevel.WARN, 'Validator', `Invalid confidence: ${confidence}`, `threadId=${threadId}`);
    return false;
  }
  
  return true;
}

/**
 * Enhanced constructor with validation and logging
 */
export function constructor(binaryArgs: StaticArray<u8>): void {
  assert(Context.isDeployingContract(), 'Constructor can only be called during deployment');
  
  // Initialize logging
  Storage.set(LOG_LEVEL_KEY, LogLevel.INFO.toString());
  logEvent(LogLevel.INFO, 'MainController', 'Starting system initialization', '');

  const args = new Args(binaryArgs);
  const threadCount = args.nextU8().expect('Thread count is required');

  // Validate thread count
  if (threadCount === 0 || threadCount > 10) {
    const errorMsg = `Invalid thread count: ${threadCount}. Must be between 1 and 10.`;
    logEvent(LogLevel.CRITICAL, 'MainController', errorMsg, '');
    Storage.set(SYSTEM_STATUS_KEY, SystemStatus.ERROR.toString());
    Storage.set(LAST_ERROR_KEY, errorMsg);
    assert(false, errorMsg);
    return;
  }

  // Store thread addresses with validation
  let addressesStr = threadCount.toString() + ';';
  for (let i: i32 = 0; i < (threadCount as i32); i++) {
    const addressResult = args.nextString();
    if (!addressResult.isOk()) {
      const errorMsg = `Missing thread address at index ${i}`;
      logEvent(LogLevel.CRITICAL, 'MainController', errorMsg, '');
      Storage.set(SYSTEM_STATUS_KEY, SystemStatus.ERROR.toString());
      Storage.set(LAST_ERROR_KEY, errorMsg);
      assert(false, errorMsg);
      return;
    }
    
    const addressStr = addressResult.unwrap();
    if (addressStr.length === 0) {
      const errorMsg = `Empty thread address at index ${i}`;
      logEvent(LogLevel.CRITICAL, 'MainController', errorMsg, '');
      Storage.set(SYSTEM_STATUS_KEY, SystemStatus.ERROR.toString());
      Storage.set(LAST_ERROR_KEY, errorMsg);
      assert(false, errorMsg);
      return;
    }

    addressesStr += addressStr + ';';
  }

  Storage.set(THREAD_ADDRESSES_KEY, addressesStr);

  // Initialize system state
  Storage.set(CURRENT_STATE_KEY, MarketState.SIDEWAYS.toString());
  Storage.set(CYCLE_COUNT_KEY, '0');
  Storage.set(DECISION_COUNT_KEY, '0');
  Storage.set(SYSTEM_STATUS_KEY, SystemStatus.RUNNING.toString());

  logEvent(LogLevel.INFO, 'MainController', 'System initialization completed', `threadCount=${threadCount}`);
  generateEvent(`Step1 Enhanced MainController initialized with ${threadCount} threads - Ready for autonomous operation`);
}

/**
 * Enhanced autonomous cycle with error handling
 */
export function autonomousCycle(_: StaticArray<u8>): void {
  logEvent(LogLevel.INFO, 'MainController', 'Starting autonomous cycle', '');

  // Simple health check
  const systemStatus = Storage.has(SYSTEM_STATUS_KEY) ? I32.parseInt(Storage.get(SYSTEM_STATUS_KEY)) : SystemStatus.RUNNING;
  
  if (systemStatus === SystemStatus.ERROR) {
    logEvent(LogLevel.ERROR, 'MainController', 'System in error state, skipping cycle', '');
    return;
  }

  // Update cycle counter with validation
  const cycleStr = Storage.has(CYCLE_COUNT_KEY) ? Storage.get(CYCLE_COUNT_KEY) : '0';
  const currentCycle = I32.parseInt(cycleStr);
  
  if (currentCycle < 0 || currentCycle > 1000000) {
    const errorMsg = `Invalid cycle count: ${currentCycle}`;
    logEvent(LogLevel.ERROR, 'MainController', errorMsg, '');
    Storage.set(SYSTEM_STATUS_KEY, SystemStatus.ERROR.toString());
    Storage.set(LAST_ERROR_KEY, errorMsg);
    return;
  }

  const newCycle = currentCycle + 1;
  Storage.set(CYCLE_COUNT_KEY, newCycle.toString());

  logEvent(LogLevel.DEBUG, 'MainController', `Executing cycle ${newCycle}`, '');

  // Sample observations (simplified with validation)
  const observations = sampleObservationsSimple();
  if (observations.length === 0) {
    logEvent(LogLevel.WARN, 'MainController', 'No valid observations collected', '');
    return;
  }

  // Compute attention weights
  const weights = computeAttentionWeightsSimple(observations);

  // Update market state
  const newState = updateMarketStateSimple(observations, weights);

  // Make decision
  const action = makeDecisionSimple(newState, observations);

  // Record decision
  recordDecisionSimple(newState, action, newCycle);

  logEvent(LogLevel.INFO, 'MainController', 'Cycle completed successfully', 
    `cycle=${newCycle}, state=${getMarketStateName(newState)}, action=${getActionName(action)}`);

  generateEvent(`Cycle ${newCycle} completed: State=${getMarketStateName(newState)}, Decision=${getActionName(action)}`);
}

/**
 * Simple observation sampling
 */
function sampleObservationsSimple(): i32[] {
  // Get thread addresses
  if (!Storage.has(THREAD_ADDRESSES_KEY)) {
    logEvent(LogLevel.ERROR, 'MainController', 'Thread addresses not configured', '');
    return [];
  }

  const addressesStr = Storage.get(THREAD_ADDRESSES_KEY);
  const parts = addressesStr.split(';');
  
  if (parts.length < 2) {
    logEvent(LogLevel.ERROR, 'MainController', 'Invalid thread addresses format', '');
    return [];
  }

  const count = I32.parseInt(parts[0]);
  const observations: i32[] = [];

  // Generate mock observations with validation
  for (let i = 0; i < count; i++) {
    const mockValue = generateMockObservation(i);
    
    if (validateObservation(mockValue, i as u8, 90)) {
      observations.push(mockValue as i32);
    } else {
      logEvent(LogLevel.WARN, 'MainController', `Skipping invalid observation from thread ${i}`, `value=${mockValue}`);
    }
  }

  logEvent(LogLevel.DEBUG, 'MainController', 'Observations sampled', `count=${observations.length}`);
  return observations;
}

/**
 * Generate mock observation for testing
 */
function generateMockObservation(threadId: i32): i64 {
  const cycle = I32.parseInt(Storage.get(CYCLE_COUNT_KEY));
  const timestamp = Context.timestamp();
  
  // Generate deterministic but varying mock data
  const seed = (cycle + threadId * 7 + (timestamp % 1000) as i32) * 31;
  return ((seed % 200) - 100) as i64; // Range: -100 to +99
}

/**
 * Simple attention weight computation
 */
function computeAttentionWeightsSimple(observations: i32[]): f64[] {
  const weights: f64[] = [];
  let totalWeight: f64 = 0;

  // Simple attention: weight by absolute value
  for (let i = 0; i < observations.length; i++) {
    const weight = Math.abs(observations[i] as f64) + 1.0; // +1 to avoid zero weights
    weights.push(weight);
    totalWeight += weight;
  }

  // Normalize weights
  if (totalWeight > 0) {
    for (let i = 0; i < weights.length; i++) {
      weights[i] = weights[i] / totalWeight;
    }
  }

  logEvent(LogLevel.DEBUG, 'MainController', 'Attention weights computed', `totalWeight=${totalWeight}`);
  return weights;
}

/**
 * Simple market state update
 */
function updateMarketStateSimple(observations: i32[], weights: f64[]): MarketState {
  if (observations.length !== weights.length) {
    logEvent(LogLevel.WARN, 'MainController', 'Observations and weights length mismatch', 
      `obs=${observations.length}, weights=${weights.length}`);
    return getCurrentMarketState();
  }

  // Compute weighted average
  let weightedSum: f64 = 0;
  for (let i = 0; i < observations.length; i++) {
    weightedSum += (observations[i] as f64) * weights[i];
  }

  // Determine new state
  let newState: MarketState;
  if (weightedSum > 20) {
    newState = MarketState.BULL;
  } else if (weightedSum < -20) {
    newState = MarketState.BEAR;
  } else {
    newState = MarketState.SIDEWAYS;
  }

  // Update state
  Storage.set(CURRENT_STATE_KEY, newState.toString());
  
  logEvent(LogLevel.INFO, 'MainController', 'Market state updated', 
    `weightedSum=${weightedSum}, newState=${getMarketStateName(newState)}`);

  return newState;
}

/**
 * Simple decision making
 */
function makeDecisionSimple(state: MarketState, observations: i32[]): DecisionAction {
  let action: DecisionAction;

  switch (state) {
    case MarketState.BULL:
      action = DecisionAction.BUY_SIGNAL;
      break;
    case MarketState.BEAR:
      action = DecisionAction.SELL_SIGNAL;
      break;
    default:
      action = DecisionAction.REBALANCE;
  }

  logEvent(LogLevel.INFO, 'MainController', 'Decision made', 
    `state=${getMarketStateName(state)}, action=${getActionName(action)}`);

  return action;
}

/**
 * Record decision with timestamp
 */
function recordDecisionSimple(state: MarketState, action: DecisionAction, cycle: i32): void {
  const timestamp = Context.timestamp();
  const description = getDecisionDescription(state, action);
  
  const decisionRecord = `${timestamp};${state};${action};${description};${cycle}`;
  Storage.set(LAST_DECISION_KEY, decisionRecord);

  // Update decision counter
  const countStr = Storage.has(DECISION_COUNT_KEY) ? Storage.get(DECISION_COUNT_KEY) : '0';
  const count = I32.parseInt(countStr) + 1;
  Storage.set(DECISION_COUNT_KEY, count.toString());

  generateEvent(`Decision ${count}: ${description}`);
}

/**
 * Get current market state
 */
function getCurrentMarketState(): MarketState {
  if (!Storage.has(CURRENT_STATE_KEY)) {
    return MarketState.SIDEWAYS;
  }
  
  const stateStr = Storage.get(CURRENT_STATE_KEY);
  const stateValue = I32.parseInt(stateStr);
  return stateValue as MarketState;
}

/**
 * Get market state name
 */
function getMarketStateName(state: MarketState): string {
  switch (state) {
    case MarketState.BULL: return 'BULL';
    case MarketState.BEAR: return 'BEAR';
    case MarketState.SIDEWAYS: return 'SIDEWAYS';
    default: return 'UNKNOWN';
  }
}

/**
 * Get action name
 */
function getActionName(action: DecisionAction): string {
  switch (action) {
    case DecisionAction.BUY_SIGNAL: return 'BUY_SIGNAL';
    case DecisionAction.SELL_SIGNAL: return 'SELL_SIGNAL';
    case DecisionAction.REBALANCE: return 'REBALANCE';
    case DecisionAction.NO_ACTION: return 'NO_ACTION';
    default: return 'UNKNOWN';
  }
}

/**
 * Get decision description
 */
function getDecisionDescription(state: MarketState, action: DecisionAction): string {
  switch (state) {
    case MarketState.BULL:
      return 'Bull market detected - Generating buy signal for portfolio growth';
    case MarketState.BEAR:
      return 'Bear market identified - Executing defensive sell strategy';
    default:
      return 'Sideways market - Implementing balanced portfolio strategy';
  }
}

/**
 * Enhanced system status
 */
export function getSystemStatus(_: StaticArray<u8>): StaticArray<u8> {
  const args = new Args();
  
  const currentState = getCurrentMarketState();
  args.add(getMarketStateName(currentState));
  
  const cycleCount = Storage.has(CYCLE_COUNT_KEY) ? Storage.get(CYCLE_COUNT_KEY) : '0';
  args.add(cycleCount);
  
  const decisionCount = Storage.has(DECISION_COUNT_KEY) ? Storage.get(DECISION_COUNT_KEY) : '0';
  args.add(decisionCount);
  
  args.add(Context.timestamp().toString());
  
  const systemStatus = Storage.has(SYSTEM_STATUS_KEY) ? Storage.get(SYSTEM_STATUS_KEY) : SystemStatus.RUNNING.toString();
  args.add(systemStatus);
  
  const lastError = Storage.has(LAST_ERROR_KEY) ? Storage.get(LAST_ERROR_KEY) : '';
  args.add(lastError);

  logEvent(LogLevel.DEBUG, 'MainController', 'System status requested', 
    `state=${getMarketStateName(currentState)}, cycles=${cycleCount}`);
  
  return args.serialize();
}

/**
 * Get last decision
 */
export function getLastDecision(_: StaticArray<u8>): StaticArray<u8> {
  if (!Storage.has(LAST_DECISION_KEY)) {
    return stringToBytes('No decisions made yet');
  }
  
  const decision = Storage.get(LAST_DECISION_KEY);
  logEvent(LogLevel.DEBUG, 'MainController', 'Last decision requested', '');
  
  return stringToBytes(decision);
}

/**
 * Force update with safety checks
 */
export function forceUpdate(_: StaticArray<u8>): void {
  logEvent(LogLevel.WARN, 'MainController', 'Force update requested', 'Testing only');
  
  const systemStatus = Storage.has(SYSTEM_STATUS_KEY) ? I32.parseInt(Storage.get(SYSTEM_STATUS_KEY)) : SystemStatus.RUNNING;
  
  if (systemStatus === SystemStatus.ERROR) {
    logEvent(LogLevel.ERROR, 'MainController', 'Force update rejected - system in error state', '');
    generateEvent('Force update rejected: System in error state');
    return;
  }

  autonomousCycle(new Args().serialize());
}

/**
 * Set log level
 */
export function setLogLevel(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const level = args.nextU8().expect('Log level is required');
  
  if ((level as i32) > LogLevel.CRITICAL) {
    logEvent(LogLevel.ERROR, 'MainController', `Invalid log level: ${level}`, '');
    return;
  }

  Storage.set(LOG_LEVEL_KEY, level.toString());
  logEvent(LogLevel.INFO, 'MainController', `Log level changed to ${level}`, '');
  generateEvent(`Log level changed to ${level}`);
}

/**
 * Get basic error info
 */
export function getErrorHistory(_: StaticArray<u8>): StaticArray<u8> {
  const lastError = Storage.has(LAST_ERROR_KEY) ? Storage.get(LAST_ERROR_KEY) : 'No errors';
  logEvent(LogLevel.DEBUG, 'MainController', 'Error history requested', '');
  return stringToBytes(lastError);
}

/**
 * Clear error history
 */
export function clearErrorHistory(_: StaticArray<u8>): void {
  if (Storage.has(LAST_ERROR_KEY)) {
    Storage.set(LAST_ERROR_KEY, '');
  }
  logEvent(LogLevel.INFO, 'MainController', 'Error history cleared', '');
  generateEvent('Error history cleared successfully');
}