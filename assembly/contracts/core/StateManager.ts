/**
 * State Manager - Consistency and Lock Management
 * Priority: 🔴 High - Prevent race conditions and invalid state transitions
 */

import { Storage, Context, generateEvent } from '@massalabs/massa-as-sdk';
import { Args, stringToBytes } from '@massalabs/as-types';

// Storage keys for state management
const STATE_LOCK_KEY = 'state_lock';
const STATE_LOCK_OWNER_KEY = 'state_lock_owner';
const STATE_TRANSITION_LOG_KEY = 'state_transition_log';
const LAST_STATE_KEY = 'last_market_state';
const STATE_CHANGE_COUNT_KEY = 'state_change_count';

// Market states
export enum MarketState {
  BULL = 0,
  BEAR = 1,
  SIDEWAYS = 2,
  UNKNOWN = 3  // For error states
}

// Lock timeout in milliseconds (5 minutes)
const LOCK_TIMEOUT: u64 = 300000;

export class StateManager {
  
  /**
   * Acquire state lock with timeout protection
   */
  static acquireLock(operationId: string): boolean {
    const now = Context.timestamp();
    
    // Check if lock exists and is still valid
    if (Storage.has(STATE_LOCK_KEY)) {
      const lockTimestamp = U64.parseInt(Storage.get(STATE_LOCK_KEY));
      const lockAge = now - lockTimestamp;
      
      if (lockAge < LOCK_TIMEOUT) {
        const owner = Storage.has(STATE_LOCK_OWNER_KEY) ? Storage.get(STATE_LOCK_OWNER_KEY) : 'unknown';
        generateEvent(`State lock acquisition failed: locked by ${owner}, age: ${lockAge}ms`);
        return false; // Lock is still valid
      } else {
        // Lock expired, force release
        generateEvent(`Force releasing expired state lock (age: ${lockAge}ms)`);
        this.releaseLock();
      }
    }
    
    // Acquire new lock
    Storage.set(STATE_LOCK_KEY, now.toString());
    Storage.set(STATE_LOCK_OWNER_KEY, operationId);
    
    generateEvent(`State lock acquired by ${operationId}`);
    return true;
  }
  
  /**
   * Release state lock
   */
  static releaseLock(): void {
    const owner = Storage.has(STATE_LOCK_OWNER_KEY) ? Storage.get(STATE_LOCK_OWNER_KEY) : 'unknown';
    
    if (Storage.has(STATE_LOCK_KEY)) {
      Storage.set(STATE_LOCK_KEY, '');
    }
    if (Storage.has(STATE_LOCK_OWNER_KEY)) {
      Storage.set(STATE_LOCK_OWNER_KEY, '');
    }
    
    generateEvent(`State lock released by ${owner}`);
  }
  
  /**
   * Execute operation with state lock (simplified without exception handling)
   */
  static withStateLock<T>(
    operation: () => T,
    fallback: () => T,
    operationId: string
  ): T {
    if (!this.acquireLock(operationId)) {
      generateEvent(`Operation ${operationId} failed to acquire lock, using fallback`);
      return fallback();
    }
    
    // Execute operation and release lock
    const result = operation();
    this.releaseLock();
    return result;
  }
  
  /**
   * Validate state transition
   */
  static isValidTransition(fromState: MarketState, toState: MarketState): boolean {
    // Get transition history to detect rapid oscillations
    const recentTransitions = this.getRecentTransitions();
    
    // Rule 1: Same state transition is always valid
    if (fromState === toState) {
      return true;
    }
    
    // Rule 2: Any state can transition to UNKNOWN (error recovery)
    if (toState === MarketState.UNKNOWN) {
      return true;
    }
    
    // Rule 3: UNKNOWN can transition to any state (recovery)
    if (fromState === MarketState.UNKNOWN) {
      return true;
    }
    
    // Rule 4: Prevent rapid oscillations (more than 3 changes in 10 transitions)
    if (recentTransitions.length >= 10) {
      let changeCount = 0;
      for (let i = 1; i < recentTransitions.length; i++) {
        if (recentTransitions[i] !== recentTransitions[i-1]) {
          changeCount++;
        }
      }
      
      if (changeCount > 3) {
        generateEvent(`Transition rejected: too many recent changes (${changeCount}/10)`);
        return false;
      }
    }
    
    // Rule 5: Direct BULL <-> BEAR transitions require confirmation
    // (should usually go through SIDEWAYS)
    if ((fromState === MarketState.BULL && toState === MarketState.BEAR) ||
        (fromState === MarketState.BEAR && toState === MarketState.BULL)) {
      
      // Allow if there's strong evidence (this would be extended with actual logic)
      const transitionStrength = this.calculateTransitionStrength(fromState, toState);
      if (transitionStrength < 80) { // Require 80% confidence for direct reversal
        generateEvent(`Direct ${this.getStateName(fromState)} -> ${this.getStateName(toState)} transition rejected: insufficient confidence (${transitionStrength}%)`);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Calculate strength of state transition (0-100)
   */
  static calculateTransitionStrength(fromState: MarketState, toState: MarketState): u32 {
    // Simplified calculation - in production this would consider:
    // - Market data confidence levels
    // - Observation consensus
    // - Historical transition patterns
    
    // For now, return a reasonable default
    if (fromState === toState) return 100;
    if (toState === MarketState.SIDEWAYS) return 90; // Easy to transition to neutral
    if (fromState === MarketState.SIDEWAYS) return 85; // Neutral can go anywhere
    
    return 70; // Direct bull/bear transitions need more evidence
  }
  
  /**
   * Transition state with validation
   */
  static transitionState(newState: MarketState, reason: string): boolean {
    const currentState = this.getCurrentState();
    
    // Validate transition
    if (!this.isValidTransition(currentState, newState)) {
      generateEvent(`State transition rejected: ${this.getStateName(currentState)} -> ${this.getStateName(newState)}`);
      return false;
    }
    
    // Record transition
    this.recordTransition(currentState, newState, reason);
    
    // Update current state
    Storage.set(LAST_STATE_KEY, newState.toString());
    
    // Update counter
    const count = this.safeGetCounter(STATE_CHANGE_COUNT_KEY) + 1;
    Storage.set(STATE_CHANGE_COUNT_KEY, count.toString());
    
    generateEvent(`State transition: ${this.getStateName(currentState)} -> ${this.getStateName(newState)} (${reason})`);
    return true;
  }
  
  /**
   * Get current market state
   */
  static getCurrentState(): MarketState {
    if (!Storage.has(LAST_STATE_KEY)) {
      return MarketState.SIDEWAYS; // Default state
    }
    
    const stateStr = Storage.get(LAST_STATE_KEY);
    const stateValue = I32.parseInt(stateStr);
    
    // Validate state value
    if (stateValue < 0 || stateValue > 3) {
      generateEvent(`Invalid state value ${stateValue}, defaulting to UNKNOWN`);
      return MarketState.UNKNOWN;
    }
    
    return stateValue as MarketState;
  }
  
  /**
   * Record state transition for history
   */
  static recordTransition(fromState: MarketState, toState: MarketState, reason: string): void {
    const timestamp = Context.timestamp();
    const transitionRecord = `${timestamp}:${fromState}:${toState}:${reason}`;
    
    // Get existing transitions
    const existingTransitions = Storage.has(STATE_TRANSITION_LOG_KEY) 
      ? Storage.get(STATE_TRANSITION_LOG_KEY) 
      : '';
    
    const transitions = existingTransitions.length > 0 
      ? existingTransitions.split(';') 
      : [];
    
    // Add new transition
    transitions.push(transitionRecord);
    
    // Keep only last 20 transitions
    if (transitions.length > 20) {
      transitions.splice(0, transitions.length - 20);
    }
    
    Storage.set(STATE_TRANSITION_LOG_KEY, transitions.join(';'));
  }
  
  /**
   * Get recent state transitions for analysis
   */
  static getRecentTransitions(): MarketState[] {
    if (!Storage.has(STATE_TRANSITION_LOG_KEY)) {
      return [];
    }
    
    const transitionsStr = Storage.get(STATE_TRANSITION_LOG_KEY);
    const transitionRecords = transitionsStr.split(';');
    const states: MarketState[] = [];
    
    // Extract states from transition records
    for (let i = 0; i < transitionRecords.length; i++) {
      const parts = transitionRecords[i].split(':');
      if (parts.length >= 3) {
        const toState = I32.parseInt(parts[2]) as MarketState;
        states.push(toState);
      }
    }
    
    return states;
  }
  
  /**
   * Get state name for logging
   */
  static getStateName(state: MarketState): string {
    switch (state) {
      case MarketState.BULL: return 'BULL';
      case MarketState.BEAR: return 'BEAR';
      case MarketState.SIDEWAYS: return 'SIDEWAYS';
      case MarketState.UNKNOWN: return 'UNKNOWN';
      default: return 'INVALID';
    }
  }
  
  /**
   * Check if system is locked
   */
  static isLocked(): boolean {
    if (!Storage.has(STATE_LOCK_KEY)) {
      return false;
    }
    
    const lockTimestamp = U64.parseInt(Storage.get(STATE_LOCK_KEY));
    const now = Context.timestamp();
    const lockAge = now - lockTimestamp;
    
    return lockAge < LOCK_TIMEOUT;
  }
  
  /**
   * Get lock status information
   */
  static getLockStatus(): string {
    if (!this.isLocked()) {
      return 'unlocked';
    }
    
    const owner = Storage.has(STATE_LOCK_OWNER_KEY) ? Storage.get(STATE_LOCK_OWNER_KEY) : 'unknown';
    const lockTimestamp = U64.parseInt(Storage.get(STATE_LOCK_KEY));
    const age = Context.timestamp() - lockTimestamp;
    
    return `locked by ${owner} for ${age}ms`;
  }
  
  /**
   * Safe counter retrieval
   */
  static safeGetCounter(key: string): i32 {
    if (!Storage.has(key)) return 0;
    const value = Storage.get(key);
    const parsed = I32.parseInt(value);
    return Math.max(0, parsed) as i32;
  }
  
  /**
   * Force unlock (emergency function)
   */
  static forceUnlock(): void {
    const owner = Storage.has(STATE_LOCK_OWNER_KEY) ? Storage.get(STATE_LOCK_OWNER_KEY) : 'unknown';
    generateEvent(`Force unlocking state (was locked by ${owner})`);
    this.releaseLock();
  }
  
  /**
   * Get comprehensive state information
   */
  static getStateInfo(): Args {
    const args = new Args();
    
    args.add(StateManager.getStateName(StateManager.getCurrentState()));
    args.add(StateManager.getLockStatus());
    args.add(StateManager.safeGetCounter(STATE_CHANGE_COUNT_KEY).toString());
    args.add(Context.timestamp().toString());
    
    // Add recent transition summary  
    const recentTransitions = StateManager.getRecentTransitions();
    let transitionSummary = 'none';
    if (recentTransitions.length > 0) {
      const recent = recentTransitions.slice(-5);
      const stateNames: string[] = [];
      for (let i = 0; i < recent.length; i++) {
        stateNames.push(StateManager.getStateName(recent[i]));
      }
      transitionSummary = stateNames.join('->');
    }
    args.add(transitionSummary);
    
    return args;
  }
}

/**
 * Public functions for contract calls
 */

export function getStateInfo(_: StaticArray<u8>): StaticArray<u8> {
  return StateManager.getStateInfo().serialize();
}

export function getCurrentState(_: StaticArray<u8>): StaticArray<u8> {
  const state = StateManager.getCurrentState();
  return stringToBytes(StateManager.getStateName(state));
}

export function getLockStatus(_: StaticArray<u8>): StaticArray<u8> {
  return stringToBytes(StateManager.getLockStatus());
}

export function forceUnlock(_: StaticArray<u8>): void {
  StateManager.forceUnlock();
  generateEvent('State forcibly unlocked by external call');
}

export function validateTransition(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const fromStateResult = args.nextU8();
  const toStateResult = args.nextU8();
  
  if (!fromStateResult.isOk() || !toStateResult.isOk()) {
    return stringToBytes('false:invalid_args');
  }
  
  const fromState = fromStateResult.unwrap() as MarketState;
  const toState = toStateResult.unwrap() as MarketState;
  
  const isValid = StateManager.isValidTransition(fromState, toState);
  const strength = StateManager.calculateTransitionStrength(fromState, toState);
  
  return stringToBytes(`${isValid}:${strength}`);
}