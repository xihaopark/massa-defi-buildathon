// Structured logging system for Step1 DeFi System
import { Context, generateEvent, Storage } from '@massalabs/massa-as-sdk';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export class LogEntry {
  timestamp: u64;
  level: LogLevel;
  component: string;
  message: string;
  data: string;
  slot: u64;

  constructor(
    timestamp: u64,
    level: LogLevel,
    component: string,
    message: string,
    data: string = '',
    slot: u64 = 0
  ) {
    this.timestamp = timestamp;
    this.level = level;
    this.component = component;
    this.message = message;
    this.data = data;
    this.slot = slot;
  }

  toString(): string {
    const levelStr = this.getLevelString();
    const dataStr = this.data.length > 0 ? ` | Data: ${this.data}` : '';
    return `[${this.timestamp}] ${levelStr} [${this.component}] ${this.message}${dataStr}`;
  }

  private getLevelString(): string {
    switch (this.level) {
      case LogLevel.DEBUG: return 'DEBUG';
      case LogLevel.INFO: return 'INFO';
      case LogLevel.WARN: return 'WARN';
      case LogLevel.ERROR: return 'ERROR';
      case LogLevel.CRITICAL: return 'CRITICAL';
      default: return 'UNKNOWN';
    }
  }
}

export class Logger {
  static readonly ERROR_HISTORY_KEY: string = 'error_history';
  static readonly LOG_LEVEL_KEY: string = 'log_level';
  static readonly MAX_ERROR_HISTORY: i32 = 50;

  static setLogLevel(level: LogLevel): void {
    Storage.set(Logger.LOG_LEVEL_KEY, level.toString());
  }

  static getLogLevel(): LogLevel {
    if (!Storage.has(Logger.LOG_LEVEL_KEY)) {
      return LogLevel.INFO; // Default level
    }
    return I32.parseInt(Storage.get(Logger.LOG_LEVEL_KEY)) as LogLevel;
  }

  static debug(component: string, message: string, data: string = ''): void {
    Logger.log(LogLevel.DEBUG, component, message, data);
  }

  static info(component: string, message: string, data: string = ''): void {
    Logger.log(LogLevel.INFO, component, message, data);
  }

  static warn(component: string, message: string, data: string = ''): void {
    Logger.log(LogLevel.WARN, component, message, data);
  }

  static error(component: string, message: string, data: string = ''): void {
    Logger.log(LogLevel.ERROR, component, message, data);
  }

  static critical(component: string, message: string, data: string = ''): void {
    Logger.log(LogLevel.CRITICAL, component, message, data);
  }

  static log(level: LogLevel, component: string, message: string, data: string = ''): void {
    // Check if we should log at this level
    if (level < Logger.getLogLevel()) {
      return;
    }

    const timestamp = Context.timestamp();
    const entry = new LogEntry(timestamp, level, component, message, data);

    // Emit as blockchain event
    generateEvent(entry.toString());

    // Store critical errors for analysis
    if (level >= LogLevel.ERROR) {
      Logger.storeError(entry);
    }
  }

  private static storeError(entry: LogEntry): void {
    // Store individual error with timestamp key
    const errorKey = `error_${entry.timestamp}`;
    Storage.set(errorKey, entry.toString());

    // Update error history list (circular buffer)
    Logger.updateErrorHistory(errorKey);
  }

  private static updateErrorHistory(errorKey: string): void {
    let history: string[] = [];
    
    if (Storage.has(Logger.ERROR_HISTORY_KEY)) {
      const historyStr = Storage.get(Logger.ERROR_HISTORY_KEY);
      history = historyStr.split(',').filter(key => key.length > 0);
    }

    // Add new error
    history.push(errorKey);

    // Keep only the last MAX_ERROR_HISTORY errors
    if (history.length > Logger.MAX_ERROR_HISTORY) {
      // Remove oldest error from storage
      const oldestKey = history.shift()!;
      if (Storage.has(oldestKey)) {
        Storage.delete(oldestKey);
      }
    }

    // Update history
    Storage.set(Logger.ERROR_HISTORY_KEY, history.join(','));
  }

  static getErrorHistory(): string[] {
    if (!Storage.has(Logger.ERROR_HISTORY_KEY)) {
      return [];
    }

    const historyStr = Storage.get(Logger.ERROR_HISTORY_KEY);
    const errorKeys = historyStr.split(',').filter(key => key.length > 0);
    const errors: string[] = [];

    for (let i = 0; i < errorKeys.length; i++) {
      const key = errorKeys[i];
      if (Storage.has(key)) {
        errors.push(Storage.get(key));
      }
    }

    return errors;
  }

  static clearErrorHistory(): void {
    if (Storage.has(Logger.ERROR_HISTORY_KEY)) {
      const historyStr = Storage.get(Logger.ERROR_HISTORY_KEY);
      const errorKeys = historyStr.split(',').filter(key => key.length > 0);
      
      // Delete all error entries
      for (let i = 0; i < errorKeys.length; i++) {
        const key = errorKeys[i];
        if (Storage.has(key)) {
          Storage.delete(key);
        }
      }
      
      Storage.delete(Logger.ERROR_HISTORY_KEY);
    }
  }
}