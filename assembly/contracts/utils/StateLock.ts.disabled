// State lock mechanism for preventing race conditions
import { Context, Storage } from '@massalabs/massa-as-sdk';
import { Logger } from './Logger';

export class StateLock {
  static readonly LOCK_PREFIX: string = 'lock_';
  static readonly LOCK_TIMEOUT: u64 = 1000; // 1000 timestamp units timeout
  static readonly MAX_LOCK_ATTEMPTS: i32 = 3;

  private lockKey: string;
  private acquired: boolean = false;

  constructor(lockName: string) {
    this.lockKey = StateLock.LOCK_PREFIX + lockName;
  }

  /**
   * Attempt to acquire the lock
   */
  acquire(): boolean {
    const currentTime = Context.timestamp();
    
    // Check if lock exists and is still valid
    if (Storage.has(this.lockKey)) {
      const lockTimeStr = Storage.get(this.lockKey);
      const lockTime = U64.parseInt(lockTimeStr);
      
      // Check if lock has expired
      if (currentTime - lockTime < StateLock.LOCK_TIMEOUT) {
        Logger.debug('StateLock', 
          `Lock acquisition failed - lock held`, 
          `lockKey=${this.lockKey}, lockTime=${lockTime}, currentTime=${currentTime}`);
        return false;
      } else {
        Logger.warn('StateLock', 
          `Expired lock detected and cleared`, 
          `lockKey=${this.lockKey}, lockTime=${lockTime}, currentTime=${currentTime}`);
      }
    }

    // Acquire the lock
    Storage.set(this.lockKey, currentTime.toString());
    this.acquired = true;
    
    Logger.debug('StateLock', 
      `Lock acquired successfully`, 
      `lockKey=${this.lockKey}, time=${currentTime}`);
    
    return true;
  }

  /**
   * Attempt to acquire lock with retries
   */
  acquireWithRetry(): boolean {
    for (let attempt = 0; attempt < StateLock.MAX_LOCK_ATTEMPTS; attempt++) {
      if (this.acquire()) {
        return true;
      }
      
      // Simple exponential backoff by checking more conditions
      if (attempt < StateLock.MAX_LOCK_ATTEMPTS - 1) {
        Logger.debug('StateLock', 
          `Lock acquisition attempt ${attempt + 1} failed, retrying`, 
          `lockKey=${this.lockKey}`);
        
        // In a real implementation, we might add a small delay here
        // For now, we just try again immediately
      }
    }
    
    Logger.warn('StateLock', 
      `Failed to acquire lock after ${StateLock.MAX_LOCK_ATTEMPTS} attempts`, 
      `lockKey=${this.lockKey}`);
    
    return false;
  }

  /**
   * Release the lock
   */
  release(): void {
    if (!this.acquired) {
      Logger.warn('StateLock', 
        `Attempted to release lock that wasn't acquired`, 
        `lockKey=${this.lockKey}`);
      return;
    }

    if (Storage.has(this.lockKey)) {
      Storage.delete(this.lockKey);
      this.acquired = false;
      
      Logger.debug('StateLock', 
        `Lock released successfully`, 
        `lockKey=${this.lockKey}`);
    } else {
      Logger.warn('StateLock', 
        `Lock not found when attempting to release`, 
        `lockKey=${this.lockKey}`);
    }
  }

  /**
   * Check if this lock instance is currently held
   */
  isHeld(): boolean {
    return this.acquired && Storage.has(this.lockKey);
  }

  /**
   * Force release a specific lock (use with caution)
   */
  static forceRelease(lockName: string): void {
    const lockKey = StateLock.LOCK_PREFIX + lockName;
    if (Storage.has(lockKey)) {
      Storage.delete(lockKey);
      Logger.warn('StateLock', 
        `Lock force released`, 
        `lockKey=${lockKey}`);
    }
  }

  /**
   * Check if a specific lock is currently held by anyone
   */
  static isLocked(lockName: string): boolean {
    const lockKey = StateLock.LOCK_PREFIX + lockName;
    
    if (!Storage.has(lockKey)) {
      return false;
    }

    const lockTimeStr = Storage.get(lockKey);
    const lockTime = U64.parseInt(lockTimeStr);
    const currentTime = Context.timestamp();

    // Check if lock has expired
    if (currentTime - lockTime >= StateLock.LOCK_TIMEOUT) {
      // Clean up expired lock
      Storage.delete(lockKey);
      Logger.debug('StateLock', 
        `Expired lock cleaned up`, 
        `lockKey=${lockKey}, lockTime=${lockTime}, currentTime=${currentTime}`);
      return false;
    }

    return true;
  }

  /**
   * Get lock timeout value
   */
  static getLockTimeout(): u64 {
    return StateLock.LOCK_TIMEOUT;
  }

  /**
   * Clean up all expired locks (maintenance function)
   */
  static cleanupExpiredLocks(): void {
    const currentTime = Context.timestamp();
    let cleanedCount = 0;

    // Note: In a real implementation, we'd need a way to iterate over all locks
    // For now, this is a placeholder that could be extended with lock registry
    
    Logger.info('StateLock', 
      `Lock cleanup completed`, 
      `cleanedCount=${cleanedCount}, currentTime=${currentTime}`);
  }
}

/**
 * Convenience class for common lock operations
 */
export class LockManager {
  static readonly STATE_LOCK_NAME: string = 'system_state';
  static readonly DECISION_LOCK_NAME: string = 'decision_making';
  static readonly OBSERVATION_LOCK_NAME: string = 'observation_update';

  /**
   * Execute a function with state lock protection
   */
  static withStateLock<T>(fn: () => T, defaultValue: T): T {
    const lock = new StateLock(LockManager.STATE_LOCK_NAME);
    
    if (!lock.acquireWithRetry()) {
      Logger.warn('LockManager', 
        'Failed to acquire state lock, returning default value', 
        '');
      return defaultValue;
    }

    try {
      const result = fn();
      return result;
    } finally {
      lock.release();
    }
  }

  /**
   * Execute a function with decision lock protection
   */
  static withDecisionLock<T>(fn: () => T, defaultValue: T): T {
    const lock = new StateLock(LockManager.DECISION_LOCK_NAME);
    
    if (!lock.acquireWithRetry()) {
      Logger.warn('LockManager', 
        'Failed to acquire decision lock, returning default value', 
        '');
      return defaultValue;
    }

    try {
      const result = fn();
      return result;
    } finally {
      lock.release();
    }
  }

  /**
   * Execute a function with observation lock protection
   */
  static withObservationLock<T>(fn: () => T, defaultValue: T): T {
    const lock = new StateLock(LockManager.OBSERVATION_LOCK_NAME);
    
    if (!lock.acquireWithRetry()) {
      Logger.warn('LockManager', 
        'Failed to acquire observation lock, returning default value', 
        '');
      return defaultValue;
    }

    try {
      const result = fn();
      return result;
    } finally {
      lock.release();
    }
  }
}