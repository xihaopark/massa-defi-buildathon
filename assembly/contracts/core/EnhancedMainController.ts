// Enhanced Main Controller - With robust error handling and logging
import { 
  Context, 
  generateEvent, 
  Storage, 
  call,
  Address
} from '@massalabs/massa-as-sdk';
import { Args, stringToBytes, bytesToString } from '@massalabs/as-types';
import { Result } from '../utils/Result';
import { Logger, LogLevel } from '../utils/Logger';
import { ObservationValidator, StateValidator, SystemValidator, ValidationResult } from '../utils/Validator';
import { LockManager, StateLock } from '../utils/StateLock';

// Storage keys
const THREAD_ADDRESSES_KEY = 'thread_addresses';
const CURRENT_STATE_KEY = 'current_state';
const CYCLE_COUNT_KEY = 'cycle_count';
const DECISION_COUNT_KEY = 'decision_count';
const LAST_DECISION_KEY = 'last_decision';
const SYSTEM_STATUS_KEY = 'system_status';
const LAST_ERROR_KEY = 'last_error';

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

/**
 * Enhanced constructor with comprehensive error handling
 */
export function constructor(binaryArgs: StaticArray<u8>): void {
  assert(Context.isDeployingContract(), 'Constructor can only be called during deployment');
  
  // Initialize logging
  Logger.setLogLevel(LogLevel.INFO);
  Logger.info('MainController', 'Starting system initialization', '');

  try {
    const args = new Args(binaryArgs);
    const threadCount = args.nextU8().expect('Thread count is required');

    // Validate thread count
    if (threadCount === 0 || threadCount > 10) {
      throw new Error(`Invalid thread count: ${threadCount}. Must be between 1 and 10.`);
    }

    // Store thread addresses with validation
    const addressResult = storeThreadAddresses(args, threadCount);
    if (addressResult.isError()) {
      throw new Error(`Failed to store thread addresses: ${addressResult.getError()}`);
    }

    // Initialize system state
    initializeSystemState();

    Logger.info('MainController', 
      'System initialization completed successfully', 
      `threadCount=${threadCount}`);

    generateEvent(`Step1 MainController initialized with ${threadCount} threads - Ready for autonomous operation`);

  } catch (error) {
    const errorMsg = `Initialization failed: ${error.message}`;
    Logger.critical('MainController', errorMsg, '');
    Storage.set(SYSTEM_STATUS_KEY, SystemStatus.ERROR.toString());
    Storage.set(LAST_ERROR_KEY, errorMsg);
    throw error;
  }
}

/**
 * Store and validate thread addresses
 */
function storeThreadAddresses(args: Args, threadCount: u8): Result<void> {
  try {
    let addressesStr = threadCount.toString() + ';';
    const addresses: string[] = [];

    for (let i: i32 = 0; i < (threadCount as i32); i++) {
      const address = args.nextString();
      if (address.isNone()) {
        return Result.error(`Missing thread address at index ${i}`);
      }
      
      const addressStr = address.unwrap();
      if (addressStr.length === 0) {
        return Result.error(`Empty thread address at index ${i}`);
      }

      addresses.push(addressStr);
      addressesStr += addressStr + ';';
    }

    Storage.set(THREAD_ADDRESSES_KEY, addressesStr);
    Logger.debug('MainController', 'Thread addresses stored', `count=${threadCount}`);
    
    return Result.ok<void>(null);
  } catch (error) {
    return Result.error(`Error storing thread addresses: ${error.message}`);
  }
}

/**
 * Initialize system state with defaults
 */
function initializeSystemState(): void {
  Storage.set(CURRENT_STATE_KEY, MarketState.SIDEWAYS.toString());
  Storage.set(CYCLE_COUNT_KEY, '0');
  Storage.set(DECISION_COUNT_KEY, '0');
  Storage.set(SYSTEM_STATUS_KEY, SystemStatus.RUNNING.toString());
  
  Logger.debug('MainController', 'System state initialized with defaults', '');
}

/**
 * Enhanced autonomous cycle with comprehensive error handling
 */
export function autonomousCycle(_: StaticArray<u8>): void {
  Logger.info('MainController', 'Starting autonomous cycle', '');

  // System health check
  const healthCheck = SystemValidator.validateSystemHealth();
  if (healthCheck.isError()) {
    Logger.error('MainController', 'System health check failed', healthCheck.message);
    Storage.set(SYSTEM_STATUS_KEY, SystemStatus.ERROR.toString());
    Storage.set(LAST_ERROR_KEY, healthCheck.message);
    return;
  }

  if (healthCheck.isWarning()) {
    Logger.warn('MainController', 'System health warning', healthCheck.message);
  }

  // Execute cycle with state lock protection
  const result = LockManager.withStateLock<boolean>(() => {
    return executeAutonomousCycleInternal();
  }, false);

  if (result) {
    Logger.info('MainController', 'Autonomous cycle completed successfully', '');
  } else {
    Logger.error('MainController', 'Autonomous cycle failed', '');
  }
}

/**
 * Internal cycle execution logic
 */
function executeAutonomousCycleInternal(): boolean {
  try {
    // Update cycle counter
    const cycleResult = incrementCycleCounter();
    if (cycleResult.isError()) {
      Logger.error('MainController', 'Failed to update cycle counter', cycleResult.getError());
      return false;
    }

    const cycle = cycleResult.unwrap();
    Logger.debug('MainController', `Executing cycle ${cycle}`, '');

    // Sample observations
    const observationResult = sampleObservations();
    if (observationResult.isError()) {
      Logger.error('MainController', 'Failed to sample observations', observationResult.getError());
      return false;
    }

    const observations = observationResult.unwrap();
    Logger.debug('MainController', 'Observations sampled', `count=${observations.length}`);

    // Compute attention weights
    const weightsResult = computeAttentionWeights(observations);
    if (weightsResult.isError()) {
      Logger.error('MainController', 'Failed to compute attention weights', weightsResult.getError());
      return false;
    }

    const weights = weightsResult.unwrap();

    // Update market state
    const stateResult = updateMarketState(observations, weights);
    if (stateResult.isError()) {
      Logger.error('MainController', 'Failed to update market state', stateResult.getError());
      return false;
    }

    const newState = stateResult.unwrap();

    // Make decision
    const decisionResult = makeStrategicDecision(newState, observations);
    if (decisionResult.isError()) {
      Logger.error('MainController', 'Failed to make decision', decisionResult.getError());
      return false;
    }

    generateEvent(`Cycle ${cycle} completed: State=${getMarketStateName(newState)}, Decision=${getDecisionActionName(decisionResult.unwrap())}`);
    return true;

  } catch (error) {
    Logger.critical('MainController', 'Critical error in cycle execution', error.message);
    Storage.set(SYSTEM_STATUS_KEY, SystemStatus.ERROR.toString());
    Storage.set(LAST_ERROR_KEY, error.message);
    return false;
  }
}

/**
 * Increment cycle counter with validation
 */
function incrementCycleCounter(): Result<i32> {
  try {
    const cycleStr = Storage.has(CYCLE_COUNT_KEY) ? Storage.get(CYCLE_COUNT_KEY) : '0';
    const currentCycle = I32.parseInt(cycleStr);
    
    if (currentCycle < 0 || currentCycle > 1000000) {
      return Result.error(`Invalid cycle count: ${currentCycle}`);
    }

    const newCycle = currentCycle + 1;
    Storage.set(CYCLE_COUNT_KEY, newCycle.toString());
    
    return Result.ok<i32>(newCycle);
  } catch (error) {
    return Result.error(`Error incrementing cycle counter: ${error.message}`);
  }
}

/**
 * Enhanced observation sampling with validation
 */
function sampleObservations(): Result<i32[]> {
  try {
    const addressesResult = getThreadAddresses();
    if (addressesResult.isError()) {
      return Result.error(addressesResult.getError());
    }

    const addresses = addressesResult.unwrap();
    const observations: i32[] = [];

    // For now, use mock data with validation
    for (let i = 0; i < addresses.length; i++) {
      const mockValue = generateMockObservation(i);
      
      // Validate observation
      const validation = ObservationValidator.validateObservation(
        mockValue, 
        i as u8, 
        90 // Mock confidence
      );

      if (validation.isError()) {
        Logger.warn('MainController', 
          `Invalid observation from thread ${i}`, 
          validation.message);
        continue; // Skip invalid observations
      }

      if (validation.isWarning()) {
        Logger.debug('MainController', 
          `Observation warning for thread ${i}`, 
          validation.message);
      }

      observations.push(mockValue as i32);
    }

    if (observations.length === 0) {
      return Result.error('No valid observations collected');
    }

    return Result.ok<i32[]>(observations);
  } catch (error) {
    return Result.error(`Error sampling observations: ${error.message}`);
  }
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
 * Get thread addresses from storage
 */
function getThreadAddresses(): Result<string[]> {
  try {
    if (!Storage.has(THREAD_ADDRESSES_KEY)) {
      return Result.error('Thread addresses not configured');
    }

    const addressesStr = Storage.get(THREAD_ADDRESSES_KEY);
    const parts = addressesStr.split(';');
    
    if (parts.length < 2) {
      return Result.error('Invalid thread addresses format');
    }

    const count = I32.parseInt(parts[0]);
    if (count <= 0 || count > 10) {
      return Result.error(`Invalid thread count: ${count}`);
    }

    const addresses: string[] = [];
    for (let i = 1; i <= count; i++) {
      if (i < parts.length && parts[i].length > 0) {
        addresses.push(parts[i]);
      }
    }

    if (addresses.length !== count) {
      return Result.error(`Address count mismatch: expected ${count}, got ${addresses.length}`);
    }

    return Result.ok<string[]>(addresses);
  } catch (error) {
    return Result.error(`Error getting thread addresses: ${error.message}`);
  }
}

/**
 * Compute attention weights with validation
 */
function computeAttentionWeights(observations: i32[]): Result<f64[]> {
  try {
    if (observations.length === 0) {
      return Result.error('No observations to compute weights for');
    }

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

    Logger.debug('MainController', 
      'Attention weights computed', 
      `totalWeight=${totalWeight}, count=${weights.length}`);

    return Result.ok<f64[]>(weights);
  } catch (error) {
    return Result.error(`Error computing attention weights: ${error.message}`);
  }
}

/**
 * Update market state with validation
 */
function updateMarketState(observations: i32[], weights: f64[]): Result<MarketState> {
  try {
    if (observations.length !== weights.length) {
      return Result.error('Observations and weights length mismatch');
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

    // Validate state transition
    const currentState = getCurrentMarketState();
    const validation = StateValidator.validateStateTransition(
      getMarketStateName(currentState), 
      getMarketStateName(newState)
    );

    if (validation.isError()) {
      Logger.warn('MainController', 
        'Invalid state transition attempted', 
        validation.message);
      return Result.ok<MarketState>(currentState); // Keep current state
    }

    // Update state
    Storage.set(CURRENT_STATE_KEY, newState.toString());
    
    Logger.info('MainController', 
      'Market state updated', 
      `weightedSum=${weightedSum}, newState=${getMarketStateName(newState)}`);

    return Result.ok<MarketState>(newState);
  } catch (error) {
    return Result.error(`Error updating market state: ${error.message}`);
  }
}

/**
 * Make strategic decision with comprehensive logic
 */
function makeStrategicDecision(state: MarketState, observations: i32[]): Result<DecisionAction> {
  return LockManager.withDecisionLock<Result<DecisionAction>>(() => {
    try {
      let action: DecisionAction;
      let description: string;

      // Enhanced decision logic
      switch (state) {
        case MarketState.BULL:
          action = DecisionAction.BUY_SIGNAL;
          description = 'Bull market detected - Generating buy signal for portfolio growth';
          break;
        case MarketState.BEAR:
          action = DecisionAction.SELL_SIGNAL;
          description = 'Bear market identified - Executing defensive sell strategy';
          break;
        default:
          action = DecisionAction.REBALANCE;
          description = 'Sideways market - Implementing balanced portfolio strategy';
      }

      // Record decision
      const recordResult = recordDecision(state, action, description);
      if (recordResult.isError()) {
        return Result.error(recordResult.getError());
      }

      Logger.info('MainController', 
        'Strategic decision made', 
        `state=${getMarketStateName(state)}, action=${getDecisionActionName(action)}`);

      return Result.ok<DecisionAction>(action);
    } catch (error) {
      return Result.error(`Error making decision: ${error.message}`);
    }
  }, Result.error<DecisionAction>('Failed to acquire decision lock'));
}

/**
 * Record decision with timestamp and context
 */
function recordDecision(state: MarketState, action: DecisionAction, description: string): Result<void> {
  try {
    const timestamp = Context.timestamp();
    const cycle = I32.parseInt(Storage.get(CYCLE_COUNT_KEY));
    
    const decisionRecord = `${timestamp};${state};${action};${description};${cycle}`;
    Storage.set(LAST_DECISION_KEY, decisionRecord);

    // Update decision counter
    const countStr = Storage.has(DECISION_COUNT_KEY) ? Storage.get(DECISION_COUNT_KEY) : '0';
    const count = I32.parseInt(countStr) + 1;
    Storage.set(DECISION_COUNT_KEY, count.toString());

    generateEvent(`Decision ${count}: ${description}`);
    
    return Result.ok<void>(null);
  } catch (error) {
    return Result.error(`Error recording decision: ${error.message}`);
  }
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
 * Get market state name for logging
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
 * Get decision action name for logging
 */
function getDecisionActionName(action: DecisionAction): string {
  switch (action) {
    case DecisionAction.BUY_SIGNAL: return 'BUY_SIGNAL';
    case DecisionAction.SELL_SIGNAL: return 'SELL_SIGNAL';
    case DecisionAction.REBALANCE: return 'REBALANCE';
    case DecisionAction.NO_ACTION: return 'NO_ACTION';
    default: return 'UNKNOWN';
  }
}

/**
 * Enhanced system status with detailed information
 */
export function getSystemStatus(_: StaticArray<u8>): StaticArray<u8> {
  try {
    const args = new Args();
    
    // Basic status
    const currentState = getCurrentMarketState();
    args.add(getMarketStateName(currentState));
    
    const cycleCount = Storage.has(CYCLE_COUNT_KEY) ? Storage.get(CYCLE_COUNT_KEY) : '0';
    args.add(cycleCount);
    
    const decisionCount = Storage.has(DECISION_COUNT_KEY) ? Storage.get(DECISION_COUNT_KEY) : '0';
    args.add(decisionCount);
    
    args.add(Context.timestamp().toString());
    
    // System health
    const systemStatus = Storage.has(SYSTEM_STATUS_KEY) ? Storage.get(SYSTEM_STATUS_KEY) : SystemStatus.RUNNING.toString();
    args.add(systemStatus);
    
    // Last error if any
    const lastError = Storage.has(LAST_ERROR_KEY) ? Storage.get(LAST_ERROR_KEY) : '';
    args.add(lastError);

    Logger.debug('MainController', 'System status requested', `state=${getMarketStateName(currentState)}, cycles=${cycleCount}`);
    
    return args.serialize();
  } catch (error) {
    Logger.error('MainController', 'Error getting system status', error.message);
    const errorArgs = new Args();
    errorArgs.add('ERROR');
    errorArgs.add('0');
    errorArgs.add('0');
    errorArgs.add(Context.timestamp().toString());
    errorArgs.add(SystemStatus.ERROR.toString());
    errorArgs.add(error.message);
    return errorArgs.serialize();
  }
}

/**
 * Get last decision with error handling
 */
export function getLastDecision(_: StaticArray<u8>): StaticArray<u8> {
  try {
    if (!Storage.has(LAST_DECISION_KEY)) {
      return stringToBytes('No decisions made yet');
    }
    
    const decision = Storage.get(LAST_DECISION_KEY);
    Logger.debug('MainController', 'Last decision requested', `decision=${decision}`);
    
    return stringToBytes(decision);
  } catch (error) {
    Logger.error('MainController', 'Error getting last decision', error.message);
    return stringToBytes(`Error: ${error.message}`);
  }
}

/**
 * Force update cycle with enhanced safety
 */
export function forceUpdate(_: StaticArray<u8>): void {
  Logger.warn('MainController', 'Force update requested', 'This should only be used for testing');
  
  // Check if system is in a state that allows force updates
  const systemStatus = Storage.has(SYSTEM_STATUS_KEY) ? I32.parseInt(Storage.get(SYSTEM_STATUS_KEY)) : SystemStatus.RUNNING;
  
  if (systemStatus === SystemStatus.ERROR) {
    Logger.error('MainController', 'Force update rejected - system in error state', '');
    generateEvent('Force update rejected: System in error state');
    return;
  }

  autonomousCycle(new Args().serialize());
}

/**
 * Get error history for debugging
 */
export function getErrorHistory(_: StaticArray<u8>): StaticArray<u8> {
  try {
    const errors = Logger.getErrorHistory();
    const errorStr = errors.join('|');
    
    Logger.debug('MainController', 'Error history requested', `count=${errors.length}`);
    
    return stringToBytes(errorStr);
  } catch (error) {
    Logger.error('MainController', 'Error getting error history', error.message);
    return stringToBytes(`Error: ${error.message}`);
  }
}

/**
 * Clear error history (maintenance function)
 */
export function clearErrorHistory(_: StaticArray<u8>): void {
  try {
    Logger.clearErrorHistory();
    Logger.info('MainController', 'Error history cleared', '');
    generateEvent('Error history cleared successfully');
  } catch (error) {
    Logger.error('MainController', 'Error clearing error history', error.message);
  }
}

/**
 * Set log level for debugging
 */
export function setLogLevel(binaryArgs: StaticArray<u8>): void {
  try {
    const args = new Args(binaryArgs);
    const level = args.nextU8().expect('Log level is required');
    
    if (level > LogLevel.CRITICAL) {
      throw new Error(`Invalid log level: ${level}`);
    }

    Logger.setLogLevel(level as LogLevel);
    Logger.info('MainController', `Log level changed to ${level}`, '');
    generateEvent(`Log level changed to ${level}`);
  } catch (error) {
    Logger.error('MainController', 'Error setting log level', error.message);
  }
}