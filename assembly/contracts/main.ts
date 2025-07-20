// Step1 DeFi System - Enhanced Main Deployment Contract
import { Context, generateEvent, Storage } from '@massalabs/massa-as-sdk';
import { Args, stringToBytes } from '@massalabs/as-types';

// Re-export enhanced main controller functions
export {
  constructor as mainControllerConstructor,
  autonomousCycle,
  getSystemStatus,
  getLastDecision,
  forceUpdate,
  getErrorHistory,
  clearErrorHistory,
  setLogLevel
} from './core/SimpleEnhancedController';

// Re-export observation thread functions
export {
  constructor as observationThreadConstructor,
  updateObservation,
  getThreadState,
  getThreadId,
  getStats,
  simulateMarketData
} from './ObservationThread';

// Import ASC functions
import { AutonomousScheduler } from './autonomous/AutonomousScheduler';

// Enhanced features integrated in main controller

const PROJECT_NAME_KEY = 'project_name';
const VERSION_KEY = 'version';

/**
 * Enhanced constructor for Step1 project with logging
 */
export function constructor(binaryArgs: StaticArray<u8>): void {
  assert(Context.isDeployingContract(), 'Constructor can only be called during deployment');
  
  // Set project metadata
  Storage.set(PROJECT_NAME_KEY, 'Step1 DeFi System - Enhanced');
  Storage.set(VERSION_KEY, '2.0.0');
  
  generateEvent('[INFO] [Step1Main] Project deployment initiated | Data: version=2.0.0');
  generateEvent('🚀 Step1 DeFi System (Enhanced) deployed successfully - Ready for autonomous operation');
  generateEvent('[INFO] [Step1Main] Enhanced features enabled | Data: logging=true, validation=true, errorHandling=true');
}

/**
 * Get project information
 */
export function getProjectInfo(_: StaticArray<u8>): StaticArray<u8> {
  const args = new Args();
  args.add(Storage.get(PROJECT_NAME_KEY));
  args.add(Storage.get(VERSION_KEY));
  args.add('Multi-threaded intelligent DeFi decision system with HMM and Attention mechanisms');
  return args.serialize();
}

/**
 * Health check function
 */
export function healthCheck(_: StaticArray<u8>): StaticArray<u8> {
  const message = `Step1 System is operational at timestamp ${Context.timestamp()}`;
  generateEvent(message);
  return stringToBytes(message);
}

/**
 * Initialize ASC (Autonomous Smart Contract) execution
 */
export function initializeASC(_: StaticArray<u8>): void {
  AutonomousScheduler.initializeAutonomousExecution();
  generateEvent('🚀 ASC initialization completed');
}

/**
 * ASC autonomous execution entry point
 */
export function autonomousExecute(args: StaticArray<u8>): void {
  AutonomousScheduler.autonomousExecute(args);
}

/**
 * Emergency stop ASC execution
 */
export function emergencyStopASC(_: StaticArray<u8>): void {
  AutonomousScheduler.emergencyStop();
}

/**
 * Resume ASC execution
 */
export function resumeASC(_: StaticArray<u8>): void {
  AutonomousScheduler.resumeExecution();
}

/**
 * Get ASC execution statistics
 */
export function getASCStats(_: StaticArray<u8>): StaticArray<u8> {
  const stats = AutonomousScheduler.getExecutionStats();
  const statsStr = `executions=${stats.totalExecutions}, success=${stats.successfulExecutions}, failed=${stats.failedExecutions}, lastSlot=${stats.lastExecutionSlot}`;
  generateEvent(`ASC Stats: ${statsStr}`);
  return stringToBytes(statsStr);
}
