// Data validation utilities for Step1 DeFi System
import { Storage } from '@massalabs/massa-as-sdk';
import { Result } from './Result';
import { Logger } from './Logger';

export enum ValidationLevel {
  OK = 0,
  WARNING = 1,
  ERROR = 2
}

export class ValidationResult {
  level: ValidationLevel;
  message: string;

  constructor(level: ValidationLevel, message: string) {
    this.level = level;
    this.message = message;
  }

  static ok(): ValidationResult {
    return new ValidationResult(ValidationLevel.OK, '');
  }

  static warning(message: string): ValidationResult {
    return new ValidationResult(ValidationLevel.WARNING, message);
  }

  static error(message: string): ValidationResult {
    return new ValidationResult(ValidationLevel.ERROR, message);
  }

  isOk(): boolean {
    return this.level === ValidationLevel.OK;
  }

  isWarning(): boolean {
    return this.level === ValidationLevel.WARNING;
  }

  isError(): boolean {
    return this.level === ValidationLevel.ERROR;
  }
}

export class ObservationValidator {
  // Constants for validation
  static readonly MIN_OBSERVATION_VALUE: i64 = -1000000; // -1M
  static readonly MAX_OBSERVATION_VALUE: i64 = 1000000;  // +1M
  static readonly MAX_DEVIATION_MULTIPLIER: f64 = 5.0;   // 5x standard deviation
  static readonly MIN_CONFIDENCE: u32 = 0;
  static readonly MAX_CONFIDENCE: u32 = 100;
  static readonly HISTORY_SIZE: i32 = 10;

  /**
   * Validate observation value and context
   */
  static validateObservation(value: i64, threadId: u8, confidence: u32): ValidationResult {
    // Basic range check
    if (value < ObservationValidator.MIN_OBSERVATION_VALUE || 
        value > ObservationValidator.MAX_OBSERVATION_VALUE) {
      Logger.warn('ObservationValidator', 
        `Observation value out of range: ${value}`, 
        `threadId=${threadId}, range=[${ObservationValidator.MIN_OBSERVATION_VALUE}, ${ObservationValidator.MAX_OBSERVATION_VALUE}]`);
      return ValidationResult.error(`Observation value ${value} out of valid range`);
    }

    // Confidence validation
    if (confidence < ObservationValidator.MIN_CONFIDENCE || 
        confidence > ObservationValidator.MAX_CONFIDENCE) {
      Logger.warn('ObservationValidator', 
        `Invalid confidence level: ${confidence}`, 
        `threadId=${threadId}`);
      return ValidationResult.error(`Confidence ${confidence} must be between 0-100`);
    }

    // Historical deviation check
    const deviationResult = ObservationValidator.checkDeviation(value, threadId);
    if (deviationResult.isError()) {
      return deviationResult;
    }

    Logger.debug('ObservationValidator', 
      `Observation validated successfully`, 
      `threadId=${threadId}, value=${value}, confidence=${confidence}`);
    
    return ValidationResult.ok();
  }

  /**
   * Check if observation deviates too much from historical average
   */
  static checkDeviation(value: i64, threadId: u8): ValidationResult {
    const historyKey = `thread_${threadId}_history`;
    
    if (!Storage.has(historyKey)) {
      // No history yet, accept any value
      ObservationValidator.addToHistory(value, threadId);
      return ValidationResult.ok();
    }

    const history = ObservationValidator.getHistory(threadId);
    if (history.length === 0) {
      ObservationValidator.addToHistory(value, threadId);
      return ValidationResult.ok();
    }

    // Calculate average and standard deviation
    let sum: i64 = 0;
    for (let i = 0; i < history.length; i++) {
      sum += history[i];
    }
    const average = sum / history.length;

    let varianceSum: f64 = 0;
    for (let i = 0; i < history.length; i++) {
      const diff = (history[i] - average) as f64;
      varianceSum += diff * diff;
    }
    const variance = varianceSum / history.length;
    const stdDev = Math.sqrt(variance);

    // Check deviation
    const deviation = Math.abs((value - average) as f64);
    const maxAllowedDeviation = stdDev * ObservationValidator.MAX_DEVIATION_MULTIPLIER;

    if (deviation > maxAllowedDeviation && stdDev > 0) {
      Logger.warn('ObservationValidator', 
        `High deviation detected`, 
        `threadId=${threadId}, value=${value}, avg=${average}, deviation=${deviation}, maxAllowed=${maxAllowedDeviation}`);
      
      // Still add to history but return warning
      ObservationValidator.addToHistory(value, threadId);
      return ValidationResult.warning(`High deviation: ${deviation} > ${maxAllowedDeviation}`);
    }

    // Add to history
    ObservationValidator.addToHistory(value, threadId);
    return ValidationResult.ok();
  }

  /**
   * Get observation history for a thread
   */
  static getHistory(threadId: u8): i64[] {
    const historyKey = `thread_${threadId}_history`;
    
    if (!Storage.has(historyKey)) {
      return [];
    }

    const historyStr = Storage.get(historyKey);
    if (historyStr.length === 0) {
      return [];
    }

    const parts = historyStr.split(',');
    const history: i64[] = [];
    
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].length > 0) {
        history.push(I64.parseInt(parts[i]));
      }
    }
    
    return history;
  }

  /**
   * Add observation to history (maintaining circular buffer)
   */
  static addToHistory(value: i64, threadId: u8): void {
    const historyKey = `thread_${threadId}_history`;
    let history = ObservationValidator.getHistory(threadId);

    // Add new value
    history.push(value);

    // Keep only recent history
    if (history.length > ObservationValidator.HISTORY_SIZE) {
      history = history.slice(history.length - ObservationValidator.HISTORY_SIZE);
    }

    // Convert back to string and store
    const historyStr = history.map<string>(v => v.toString()).join(',');
    Storage.set(historyKey, historyStr);
  }

  /**
   * Clear history for a thread
   */
  static clearHistory(threadId: u8): void {
    const historyKey = `thread_${threadId}_history`;
    if (Storage.has(historyKey)) {
      Storage.delete(historyKey);
    }
  }
}

/**
 * State transition validator
 */
export class StateValidator {
  /**
   * Validate state transition is logical
   */
  static validateStateTransition(currentState: string, newState: string): ValidationResult {
    // Allow any transition for now, but log unusual ones
    if (currentState === newState) {
      return ValidationResult.ok();
    }

    // Log state changes
    Logger.info('StateValidator', 
      `State transition`, 
      `${currentState} -> ${newState}`);

    // Could add more sophisticated transition rules here
    // For example, preventing rapid state changes
    
    return ValidationResult.ok();
  }
}

/**
 * System health validator
 */
export class SystemValidator {
  /**
   * Validate system is in good state for processing
   */
  static validateSystemHealth(): ValidationResult {
    // Check if we have any critical errors recently
    const errors = Logger.getErrorHistory();
    const recentErrors = errors.filter(error => {
      // Check if error is from last 1000 timestamps (roughly last few minutes)
      const parts = error.split(' ');
      if (parts.length < 2) return false;
      
      const timestampStr = parts[0].replace('[', '').replace(']', '');
      const errorTime = U64.parseInt(timestampStr);
      const currentTime = Storage.has('last_timestamp') ? U64.parseInt(Storage.get('last_timestamp')) : 0;
      
      return currentTime - errorTime < 1000;
    });

    if (recentErrors.length > 5) {
      return ValidationResult.error(`Too many recent errors: ${recentErrors.length}`);
    }

    if (recentErrors.length > 2) {
      return ValidationResult.warning(`Multiple recent errors: ${recentErrors.length}`);
    }

    return ValidationResult.ok();
  }
}