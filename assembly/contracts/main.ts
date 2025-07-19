// Step1 DeFi System - Main deployment contract
import { Context, generateEvent, Storage } from '@massalabs/massa-as-sdk';
import { Args, stringToBytes } from '@massalabs/as-types';

// Re-export main controller functions for deployment
export {
  constructor as mainControllerConstructor,
  autonomousCycle,
  getSystemStatus,
  getLastDecision,
  forceUpdate
} from './MainController';

// Re-export observation thread functions
export {
  constructor as observationThreadConstructor,
  updateObservation,
  getThreadState,
  getThreadId,
  getStats,
  simulateMarketData
} from './ObservationThread';

const PROJECT_NAME_KEY = 'project_name';
const VERSION_KEY = 'version';

/**
 * Default constructor for Step1 project
 */
export function constructor(binaryArgs: StaticArray<u8>): void {
  assert(Context.isDeployingContract());
  
  Storage.set(PROJECT_NAME_KEY, 'Step1 DeFi System');
  Storage.set(VERSION_KEY, '1.0.0');
  
  generateEvent('Step1 DeFi System deployed successfully');
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
