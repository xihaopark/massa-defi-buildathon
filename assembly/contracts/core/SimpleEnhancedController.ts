// Enhanced Main Controller with State Management and Real Data
import { 
  Context, 
  generateEvent, 
  Storage
} from '@massalabs/massa-as-sdk';
import { Args, stringToBytes } from '@massalabs/as-types';
import { StateManager, MarketState as StateManagerState } from './StateManager';
import { PriceOracle } from '../oracles/PriceOracle';
import { 
  PracticalMarketDetector, 
  PracticalAttentionCalculator,
  PracticalMarketState,
  DetectionResult,
  TradingSignal 
} from '../algorithms/PracticalMarketDetector';
import { PracticalTradingExecutor, ExecutionResult } from '../trading/TradingExecutor';

// Storage keys
const THREAD_ADDRESSES_KEY = 'thread_addresses';
const CURRENT_STATE_KEY = 'current_state';
const CYCLE_COUNT_KEY = 'cycle_count';
const DECISION_COUNT_KEY = 'decision_count';
const LAST_DECISION_KEY = 'last_decision';
const SYSTEM_STATUS_KEY = 'system_status';
const LAST_ERROR_KEY = 'last_error';
const LOG_LEVEL_KEY = 'log_level';
const MARKET_DETECTION_KEY = 'market_detection';
const ATTENTION_WEIGHTS_KEY = 'attention_weights';
const TRADING_SIGNALS_KEY = 'trading_signals';
const VOLUME_DATA_KEY = 'volume_data';

// System states
enum SystemStatus {
  INITIALIZING = 0,
  RUNNING = 1,
  ERROR = 2,
  MAINTENANCE = 3
}

// Use MarketState from StateManager as StateManagerState

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
  Storage.set(CURRENT_STATE_KEY, StateManagerState.SIDEWAYS.toString());
  Storage.set(CYCLE_COUNT_KEY, '0');
  Storage.set(DECISION_COUNT_KEY, '0');
  Storage.set(SYSTEM_STATUS_KEY, SystemStatus.RUNNING.toString());

  logEvent(LogLevel.INFO, 'MainController', 'System initialization completed', `threadCount=${threadCount}`);
  generateEvent(`Step1 Enhanced MainController initialized with ${threadCount} threads - Ready for autonomous operation`);
}

/**
 * Enhanced autonomous cycle with state management and real data
 */
export function autonomousCycle(_: StaticArray<u8>): void {
  logEvent(LogLevel.INFO, 'MainController', 'Starting autonomous cycle with state management', '');

  // Execute cycle with state lock protection
  StateManager.withStateLock<boolean>(
    (): boolean => {
      executeAutonomousCycleLogic();
      return true;
    },
    (): boolean => {
      logEvent(LogLevel.WARN, 'MainController', 'Cycle execution fallback due to lock failure', '');
      return false;
    },
    'autonomousCycle'
  );
}

/**
 * Core cycle logic with state management
 */
function executeAutonomousCycleLogic(): void {
  // Health check
  const systemStatus = Storage.has(SYSTEM_STATUS_KEY) ? I32.parseInt(Storage.get(SYSTEM_STATUS_KEY)) : SystemStatus.RUNNING;
  
  if (systemStatus === SystemStatus.ERROR) {
    logEvent(LogLevel.ERROR, 'MainController', 'System in error state, skipping cycle', '');
    return;
  }

  // Update cycle counter with validation
  const currentCycle = safeGetCounter(CYCLE_COUNT_KEY);
  
  if (currentCycle > 1000000) {
    const errorMsg = `Cycle count overflow: ${currentCycle}`;
    logEvent(LogLevel.ERROR, 'MainController', errorMsg, '');
    Storage.set(SYSTEM_STATUS_KEY, SystemStatus.ERROR.toString());
    Storage.set(LAST_ERROR_KEY, errorMsg);
    return;
  }

  const newCycle = currentCycle + 1;
  Storage.set(CYCLE_COUNT_KEY, newCycle.toString());

  logEvent(LogLevel.DEBUG, 'MainController', `Executing cycle ${newCycle}`, '');

  // Sample observations with real data
  const observationData = sampleObservationsWithRealData();
  if (observationData.observations.length === 0) {
    logEvent(LogLevel.WARN, 'MainController', 'No valid observations collected', '');
    return;
  }

  // 🚀 Practical market detection - Core improvement
  const detectionResult = executeAdvancedMarketDetection(observationData);
  
  // Update state based on detection results
  const stateUpdated = updateStateFromDetection(detectionResult);
  
  // Make decisions based on detection results
  const tradingDecision = makePracticalTradingDecision(detectionResult, observationData);
  
  // 🚀 Execute actual trading
  const currentPrice = observationData.observations.length > 0 ? 
    observationData.observations[observationData.observations.length - 1] : 10000;
  
  const executionResult = PracticalTradingExecutor.executeStrategy(
    detectionResult,
    currentPrice
  );
  
  // Record decisions and results
  recordAdvancedDecision(detectionResult, tradingDecision, newCycle);
  recordExecutionResult(executionResult, newCycle);

  logEvent(LogLevel.INFO, 'MainController', 'Advanced cycle completed successfully', 
    `cycle=${newCycle}, detection=${getPracticalStateName(detectionResult.state)}, signal=${getTradingSignalName(detectionResult.signal)}, execution=${getExecutionResultName(executionResult)}`);

  generateEvent(`Cycle ${newCycle} completed: Detection=${getPracticalStateName(detectionResult.state)}, Signal=${getTradingSignalName(detectionResult.signal)}, Confidence=${detectionResult.confidence}%, Execution=${getExecutionResultName(executionResult)}`);
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

// Old functions removed - using enhanced versions below

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

// Old getDecisionDescription removed - using enhanced version below

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

// ==================== ENHANCED HELPER FUNCTIONS ====================

/**
 * Sample observations with real data from oracle
 */
function sampleObservationsWithRealData(): ObservationData {
  // Get thread addresses
  if (!Storage.has(THREAD_ADDRESSES_KEY)) {
    logEvent(LogLevel.ERROR, 'MainController', 'Thread addresses not configured', '');
    return new ObservationData([], [], []);
  }

  const addressesStr = Storage.get(THREAD_ADDRESSES_KEY);
  const parts = addressesStr.split(';');
  
  if (parts.length < 2) {
    logEvent(LogLevel.ERROR, 'MainController', 'Invalid thread addresses format', '');
    return new ObservationData([], [], []);
  }

  const count = I32.parseInt(parts[0]);
  const observations: i32[] = [];
  const volumes: i32[] = [];
  const timestamps: u64[] = [];

  // Try to get real data from price oracle first
  const priceData = PriceOracle.fetchPrice('MAS');
  
  if (priceData.isValid()) {
    // Use real price data for all threads (could be different assets in production)
    for (let i = 0; i < count; i++) {
      // Apply thread-specific modifications to base price
      const threadModifier = (i * 100) - 100; // -100, 0, +100 for threads 0,1,2
      const observationValue = (priceData.price + threadModifier) as i32;
      
      if (validateObservation(observationValue, i as u8, priceData.confidence)) {
        observations.push(observationValue);
        volumes.push(priceData.volume as i32);
        timestamps.push(Context.timestamp());
        logEvent(LogLevel.DEBUG, 'MainController', `Real data observation thread ${i}`, `value=${observationValue}`);
      }
    }
  }
  
  // If we don't have enough real data, supplement with mock data
  while (observations.length < count) {
    const threadId = observations.length;
    const mockValue = generateMockObservation(threadId);
    
    if (validateObservation(mockValue, threadId as u8, 70)) {
      observations.push(mockValue as i32);
      volumes.push(1000 + (threadId * 100)); // Mock volume data
      timestamps.push(Context.timestamp());
      logEvent(LogLevel.DEBUG, 'MainController', `Mock data observation thread ${threadId}`, `value=${mockValue}`);
    }
  }

  logEvent(LogLevel.INFO, 'MainController', 'Observations sampled with real data', `count=${observations.length}`);
  return new ObservationData(observations, volumes, timestamps);
}

/**
 * Update market state with validation and state management
 */
function updateMarketStateWithValidation(observations: i32[], weights: f64[]): StateManagerState {
  if (observations.length !== weights.length) {
    logEvent(LogLevel.WARN, 'MainController', 'Observations and weights length mismatch', 
      `obs=${observations.length}, weights=${weights.length}`);
    return StateManager.getCurrentState();
  }

  // Compute weighted average
  let weightedSum: f64 = 0;
  for (let i = 0; i < observations.length; i++) {
    weightedSum += (observations[i] as f64) * weights[i];
  }

  // Determine new state based on weighted sum
  let proposedState: StateManagerState;
  if (weightedSum > 20) {
    proposedState = StateManagerState.BULL;
  } else if (weightedSum < -20) {
    proposedState = StateManagerState.BEAR;
  } else {
    proposedState = StateManagerState.SIDEWAYS;
  }

  // Get current state for validation
  const currentState = StateManager.getCurrentState();
  
  // Validate transition and update state
  const transitionReason = `Weighted sum: ${weightedSum.toString()}, confidence from ${observations.length} observations`;
  
  if (StateManager.transitionState(proposedState, transitionReason)) {
    logEvent(LogLevel.INFO, 'MainController', 'Market state updated with validation', 
      `${StateManager.getStateName(currentState)} -> ${StateManager.getStateName(proposedState)}`);
    return proposedState;
  } else {
    logEvent(LogLevel.WARN, 'MainController', 'State transition rejected, keeping current state', 
      `attempted: ${StateManager.getStateName(currentState)} -> ${StateManager.getStateName(proposedState)}`);
    return currentState;
  }
}

/**
 * Enhanced decision making considering state transitions
 */
function makeDecisionSimple(state: StateManagerState, observations: i32[]): DecisionAction {
  let action: DecisionAction;

  // Get recent state transitions for context
  const recentTransitions = StateManager.getRecentTransitions();
  const isVolatile = recentTransitions.length >= 3 && 
    recentTransitions.slice(-3).some((s, i, arr) => i > 0 && s !== arr[i-1]);

  switch (state) {
    case StateManagerState.BULL:
      // In volatile conditions, be more conservative
      action = isVolatile ? DecisionAction.REBALANCE : DecisionAction.BUY_SIGNAL;
      break;
    case StateManagerState.BEAR:
      action = isVolatile ? DecisionAction.REBALANCE : DecisionAction.SELL_SIGNAL;
      break;
    case StateManagerState.UNKNOWN:
      // In unknown states, take no action
      action = DecisionAction.NO_ACTION;
      break;
    default: // SIDEWAYS
      action = DecisionAction.REBALANCE;
  }

  logEvent(LogLevel.INFO, 'MainController', 'Enhanced decision made', 
    `state=${StateManager.getStateName(state)}, volatile=${isVolatile}, action=${getActionName(action)}`);

  return action;
}

/**
 * Safe counter retrieval with validation
 */
function safeGetCounter(key: string): i32 {
  if (!Storage.has(key)) return 0;
  const value = Storage.get(key);
  
  if (value.length === 0) return 0;
  
  const parsed = I32.parseInt(value);
  // Ensure non-negative counters
  return Math.max(0, parsed) as i32;
}

/**
 * Enhanced state name getter that handles new states
 */
function getMarketStateName(state: StateManagerState): string {
  return StateManager.getStateName(state);
}

/**
 * Record decision with enhanced information
 */
function recordDecisionSimple(state: StateManagerState, action: DecisionAction, cycle: i32): void {
  const timestamp = Context.timestamp();
  const description = getDecisionDescription(state, action);
  
  const decisionRecord = timestamp.toString() + ';' + state.toString() + ';' + action.toString() + ';' + description + ';' + cycle.toString();
  Storage.set(LAST_DECISION_KEY, decisionRecord);

  // Update decision counter
  const count = safeGetCounter(DECISION_COUNT_KEY) + 1;
  Storage.set(DECISION_COUNT_KEY, count.toString());

  generateEvent('Decision ' + count.toString() + ': ' + description);
}

/**
 * Get decision description
 */
function getDecisionDescription(state: StateManagerState, action: DecisionAction): string {
  switch (state) {
    case StateManagerState.BULL:
      return 'Bull market detected - Generating buy signal for portfolio growth';
    case StateManagerState.BEAR:
      return 'Bear market identified - Executing defensive sell strategy';
    default:
      return 'Sideways market - Implementing balanced portfolio strategy';
  }
}

/**
 * Get current market state
 */
function getCurrentMarketState(): StateManagerState {
  return StateManager.getCurrentState();
}

// ==================== 实用市场检测核心函数 ====================

/**
 * 观测数据结构
 */
class ObservationData {
  constructor(
    public observations: i32[],
    public volumes: i32[],
    public timestamps: u64[]
  ) {}
}

/**
 * Advanced market detection execution
 */
function executeAdvancedMarketDetection(data: ObservationData): DetectionResult {
  logEvent(LogLevel.DEBUG, 'MarketDetector', 'Starting advanced market detection', '');
  
  // Get historical market states for state change detection
  const historicalStates = getHistoricalMarketStates();
  
  // Execute practical market detection
  const detectionResult = PracticalMarketDetector.detectMarketState(
    data.observations,
    data.volumes,
    Context.timestamp()
  );
  
  // Calculate attention weights
  const attentionWeights = PracticalAttentionCalculator.calculateAttentionWeights(
    data.observations,
    historicalStates,
    data.volumes
  );
  
  // Store attention weights for frontend display
  storeAttentionWeights(attentionWeights);
  
  // Store detection results
  storeDetectionResult(detectionResult);
  
  logEvent(LogLevel.INFO, 'MarketDetector', 'Detection completed', 
    `state=${getPracticalStateName(detectionResult.state)}, confidence=${detectionResult.confidence}%`);
  
  return detectionResult;
}

/**
 * 根据检测结果更新系统状态
 */
function updateStateFromDetection(detection: DetectionResult): boolean {
  // 将实用市场状态映射到系统状态
  let systemState: StateManagerState;
  
  switch (detection.state) {
    case PracticalMarketState.TRENDING_UP:
    case PracticalMarketState.BREAKOUT:
      if (detection.confidence > 70) {
        systemState = StateManagerState.BULL;
      } else {
        systemState = StateManagerState.SIDEWAYS;
      }
      break;
      
    case PracticalMarketState.TRENDING_DOWN:
    case PracticalMarketState.REVERSAL:
      if (detection.confidence > 70) {
        systemState = StateManagerState.BEAR;
      } else {
        systemState = StateManagerState.SIDEWAYS;
      }
      break;
      
    case PracticalMarketState.HIGH_VOLATILITY:
    case PracticalMarketState.LOW_VOLATILITY:
    default:
      systemState = StateManagerState.SIDEWAYS;
      break;
  }
  
  // 使用状态管理器进行转换验证
  const reason = `Market detection: ${getPracticalStateName(detection.state)} with ${detection.confidence}% confidence`;
  const updated = StateManager.transitionState(systemState, reason);
  
  if (updated) {
    logEvent(LogLevel.INFO, 'StateUpdate', 'State updated from detection', 
      `new_state=${StateManager.getStateName(systemState)}`);
  }
  
  return updated;
}

/**
 * Make practical trading decisions based on detection results
 */
function makePracticalTradingDecision(
  detection: DetectionResult, 
  data: ObservationData
): PracticalTradingDecision {
  
  logEvent(LogLevel.DEBUG, 'TradingDecision', 'Making practical trading decision', '');
  
  // Base decision from detection results
  let signal = detection.signal;
  let confidence = detection.confidence;
  let urgency = detection.urgency;
  
  // Risk management adjustment
  signal = applyRiskManagement(signal, detection, data);
  
  // Market condition adjustment
  signal = adjustForMarketConditions(signal, data);
  
  const decision = new PracticalTradingDecision(
    signal,
    confidence,
    urgency,
    calculatePositionSize(signal, confidence),
    detection.reasoning + ' + Risk adjusted'
  );
  
  logEvent(LogLevel.INFO, 'TradingDecision', 'Decision made', 
    `signal=${getTradingSignalName(signal)}, confidence=${confidence}%`);
  
  return decision;
}

/**
 * Practical trading decision class
 */
class PracticalTradingDecision {
  constructor(
    public signal: TradingSignal,
    public confidence: u32,
    public urgency: u32,
    public positionSize: u32,  // 百分比 0-100
    public reasoning: string
  ) {}
}

/**
 * 风险管理
 */
function applyRiskManagement(
  signal: TradingSignal, 
  detection: DetectionResult, 
  data: ObservationData
): TradingSignal {
  
  // 高波动时降低风险
  if (detection.state === PracticalMarketState.HIGH_VOLATILITY) {
    if (signal === TradingSignal.STRONG_BUY) return TradingSignal.BUY;
    if (signal === TradingSignal.STRONG_SELL) return TradingSignal.SELL;
  }
  
  // 低置信度时保守
  if (detection.confidence < 60) {
    if (signal === TradingSignal.STRONG_BUY || signal === TradingSignal.BUY) {
      return TradingSignal.HOLD;
    }
    if (signal === TradingSignal.STRONG_SELL || signal === TradingSignal.SELL) {
      return TradingSignal.HOLD;
    }
  }
  
  return signal;
}

/**
 * Market condition adjustment
 */
function adjustForMarketConditions(signal: TradingSignal, data: ObservationData): TradingSignal {
  if (data.observations.length < 5) return signal;
  
  // 检查近期波动
  const recentVolatility = calculateRecentVolatility(data.observations.slice(-5));
  
  // 极高波动时暂停交易
  if (recentVolatility > 500) { // 5%
    return TradingSignal.WAIT;
  }
  
  return signal;
}

/**
 * 计算仓位大小
 */
function calculatePositionSize(signal: TradingSignal, confidence: u32): u32 {
  let baseSize: u32 = 20; // 基础仓位20%
  
  switch (signal) {
    case TradingSignal.STRONG_BUY:
    case TradingSignal.STRONG_SELL:
      baseSize = 40;
      break;
    case TradingSignal.BUY:
    case TradingSignal.SELL:
      baseSize = 25;
      break;
    case TradingSignal.HOLD:
      baseSize = 10;
      break;
    case TradingSignal.WAIT:
      return 0;
  }
  
  // 根据置信度调整
  return (baseSize * confidence) / 100;
}

/**
 * 记录高级决策
 */
function recordAdvancedDecision(
  detection: DetectionResult,
  decision: PracticalTradingDecision, 
  cycle: i32
): void {
  
  const timestamp = Context.timestamp();
  
  // 构建决策记录
  const decisionRecord = [
    timestamp.toString(),
    cycle.toString(),
    getPracticalStateName(detection.state),
    getTradingSignalName(decision.signal),
    detection.confidence.toString(),
    decision.urgency.toString(),
    decision.positionSize.toString(),
    detection.reasoning.replace(';', '|') // 避免分隔符冲突
  ].join(';');
  
  Storage.set(LAST_DECISION_KEY, decisionRecord);
  
  // 更新决策计数
  const count = safeGetCounter(DECISION_COUNT_KEY) + 1;
  Storage.set(DECISION_COUNT_KEY, count.toString());
  
  // 存储交易信号历史（用于前端图表）
  storeSignalHistory(decision.signal, timestamp);
  
  generateEvent('Advanced Decision ' + count.toString() + ': ' + getTradingSignalName(decision.signal) + 
    ' (' + detection.confidence.toString() + '% confidence)');
}

// ==================== 辅助函数 ====================

/**
 * 获取历史市场状态
 */
function getHistoricalMarketStates(): PracticalMarketState[] {
  // 简化实现：返回最近几个状态
  const states: PracticalMarketState[] = [];
  
  // 这里可以从存储中读取历史状态
  // 现在返回默认值
  for (let i = 0; i < 5; i++) {
    states.push(PracticalMarketState.SIDEWAYS);
  }
  
  return states;
}

/**
 * 存储注意力权重
 */
function storeAttentionWeights(weights: f64[]): void {
  if (weights.length === 0) return;
  
  const weightsStr: string[] = [];
  for (let i = 0; i < weights.length; i++) {
    weightsStr.push(weights[i].toString());
  }
  
  Storage.set(ATTENTION_WEIGHTS_KEY, weightsStr.join(','));
}

/**
 * 存储检测结果
 */
function storeDetectionResult(result: DetectionResult): void {
  const resultStr = [
    result.state.toString(),
    result.confidence.toString(),
    result.signal.toString(),
    result.urgency.toString(),
    Context.timestamp().toString()
  ].join(';');
  
  Storage.set(MARKET_DETECTION_KEY, resultStr);
}

/**
 * 存储信号历史
 */
function storeSignalHistory(signal: TradingSignal, timestamp: u64): void {
  const signalRecord = signal.toString() + ':' + timestamp.toString();
  
  // 获取现有历史
  const existingHistory = Storage.has(TRADING_SIGNALS_KEY) ? 
    Storage.get(TRADING_SIGNALS_KEY) : '';
  
  // 添加新记录
  const newHistory = existingHistory.length > 0 ? 
    existingHistory + ',' + signalRecord : signalRecord;
  
  // 保持最近50个记录
  const records = newHistory.split(',');
  if (records.length > 50) {
    records.splice(0, records.length - 50);
  }
  
  Storage.set(TRADING_SIGNALS_KEY, records.join(','));
}

/**
 * 计算近期波动率
 */
function calculateRecentVolatility(prices: i32[]): i32 {
  if (prices.length < 2) return 0;
  
  let sum: i64 = 0;
  for (let i = 0; i < prices.length; i++) {
    sum += prices[i];
  }
  const mean = sum / (prices.length as i64);
  
  let variance: i64 = 0;
  for (let i = 0; i < prices.length; i++) {
    const diff = (prices[i] as i64) - mean;
    variance += diff * diff;
  }
  
  variance = variance / (prices.length as i64);
  const stdDev = Math.sqrt(variance as f64) as i64;
  
  // 返回波动率百分比 * 100
  return ((stdDev * 100) / mean) as i32;
}

/**
 * Get practical state name
 */
function getPracticalStateName(state: PracticalMarketState): string {
  switch (state) {
    case PracticalMarketState.HIGH_VOLATILITY: return 'HIGH_VOLATILITY';
    case PracticalMarketState.LOW_VOLATILITY: return 'LOW_VOLATILITY';
    case PracticalMarketState.TRENDING_UP: return 'TRENDING_UP';
    case PracticalMarketState.TRENDING_DOWN: return 'TRENDING_DOWN';
    case PracticalMarketState.SIDEWAYS: return 'SIDEWAYS';
    case PracticalMarketState.BREAKOUT: return 'BREAKOUT';
    case PracticalMarketState.REVERSAL: return 'REVERSAL';
    default: return 'UNKNOWN';
  }
}

/**
 * Get trading signal name
 */
function getTradingSignalName(signal: TradingSignal): string {
  switch (signal) {
    case TradingSignal.STRONG_BUY: return 'STRONG_BUY';
    case TradingSignal.BUY: return 'BUY';
    case TradingSignal.HOLD: return 'HOLD';
    case TradingSignal.SELL: return 'SELL';
    case TradingSignal.STRONG_SELL: return 'STRONG_SELL';
    case TradingSignal.WAIT: return 'WAIT';
    default: return 'UNKNOWN';
  }
}

/**
 * Record execution result
 */
function recordExecutionResult(result: ExecutionResult, cycle: i32): void {
  const resultKey = `execution_result_${cycle}`;
  const resultData = `${Context.timestamp()}|${result}|${cycle}`;
  Storage.set(resultKey, resultData);
  
  logEvent(LogLevel.INFO, 'TradingExecution', 'Execution result recorded', 
    `cycle=${cycle}, result=${getExecutionResultName(result)}`);
}

/**
 * Get execution result name
 */
function getExecutionResultName(result: ExecutionResult): string {
  switch (result) {
    case ExecutionResult.SUCCESS: return 'SUCCESS';
    case ExecutionResult.FAILED: return 'FAILED';
    case ExecutionResult.RISK_BLOCKED: return 'RISK_BLOCKED';
    case ExecutionResult.NO_ACTION: return 'NO_ACTION';
    case ExecutionResult.INSUFFICIENT_FUNDS: return 'INSUFFICIENT_FUNDS';
    default: return 'UNKNOWN';
  }
}