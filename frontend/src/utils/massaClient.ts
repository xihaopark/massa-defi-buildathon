// Massa blockchain client utilities
import { 
  JsonRpcProvider, 
  SmartContract, 
  Args,
  DefaultProviderUrls,
  Account
} from '@massalabs/massa-web3';
import type { SystemData, SystemStatus, Decision, AttentionWeight, ThreadObservation } from '../types';

// Configuration
const BUILDNET_URL = DefaultProviderUrls.BUILDNET;
let provider: JsonRpcProvider;
let mainControllerContract: SmartContract;
let observationThreadContracts: SmartContract[] = [];

// Mock data for development when contracts aren't deployed yet
const MOCK_DATA_MODE = true;

// Contract addresses (will be updated after deployment)
const CONTRACT_ADDRESSES = {
  mainController: 'A1...',  // Will be set from deployment.json
  observationThreads: ['A2...', 'A3...', 'A4...']
};

export async function initializeMassaClient(): Promise<void> {
  if (MOCK_DATA_MODE) {
    console.log('Running in mock data mode');
    return;
  }

  try {
    // Initialize provider
    provider = JsonRpcProvider.buildnet();
    
    // Initialize main controller contract
    mainControllerContract = new SmartContract(
      provider,
      CONTRACT_ADDRESSES.mainController
    );
    
    // Initialize observation thread contracts
    observationThreadContracts = CONTRACT_ADDRESSES.observationThreads.map(
      address => new SmartContract(provider, address)
    );
    
    console.log('Massa client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Massa client:', error);
    throw error;
  }
}

export async function getSystemData(): Promise<SystemData> {
  if (MOCK_DATA_MODE) {
    return getMockSystemData();
  }
  
  try {
    // Fetch system status
    const statusResult = await mainControllerContract.read('getSystemStatus', new Args());
    const status = parseSystemStatus(statusResult);
    
    // Fetch last decision
    const decisionResult = await mainControllerContract.read('getLastDecision', new Args());
    const lastDecision = parseDecision(decisionResult);
    
    // Fetch observations from threads
    const observations = await getObservationsFromThreads();
    
    // Generate attention weights (mock for now)
    const attentionWeights = generateMockAttentionWeights();
    
    return {
      status,
      attentionWeights,
      decisions: lastDecision ? [lastDecision] : [],
      observations,
      contractAddresses: CONTRACT_ADDRESSES
    };
  } catch (error) {
    console.error('Failed to fetch system data:', error);
    throw error;
  }
}

async function getObservationsFromThreads(): Promise<ThreadObservation[]> {
  const observations: ThreadObservation[] = [];
  
  for (let i = 0; i < observationThreadContracts.length; i++) {
    try {
      const contract = observationThreadContracts[i];
      const stateResult = await contract.read('getThreadState', new Args());
      const observation = parseThreadObservation(stateResult, i);
      observations.push(observation);
    } catch (error) {
      console.error(`Failed to get observation from thread ${i}:`, error);
    }
  }
  
  return observations;
}

function parseSystemStatus(result: any): SystemStatus {
  // Parse the result from contract call
  // This is a simplified implementation
  return {
    state: 'RUNNING',
    cycleCount: 0,
    decisionCount: 0,
    currentMarketState: 'SIDEWAYS',
    lastUpdate: Date.now()
  };
}

function parseDecision(result: any): Decision | null {
  // Parse decision from contract result
  return null;
}

function parseThreadObservation(result: any, threadId: number): ThreadObservation {
  // Parse observation from contract result
  return {
    threadId,
    value: 0,
    confidence: 100,
    timestamp: Date.now(),
    label: `Thread ${threadId}`
  };
}

function generateMockAttentionWeights(): AttentionWeight[] {
  return [
    { threadId: 0, weight: 0.4, label: 'Price Monitor' },
    { threadId: 1, weight: 0.35, label: 'Volume Tracker' },
    { threadId: 2, weight: 0.25, label: 'Volatility Sensor' }
  ];
}

// Mock data for development
function getMockSystemData(): SystemData {
  const currentTime = Date.now();
  
  return {
    status: {
      state: 'RUNNING',
      cycleCount: Math.floor(Math.random() * 100) + 50,
      decisionCount: Math.floor(Math.random() * 30) + 10,
      currentMarketState: ['BULL', 'BEAR', 'SIDEWAYS'][Math.floor(Math.random() * 3)] as any,
      lastUpdate: currentTime
    },
    attentionWeights: [
      { 
        threadId: 0, 
        weight: 0.3 + Math.random() * 0.4, 
        label: 'Price Momentum' 
      },
      { 
        threadId: 1, 
        weight: 0.2 + Math.random() * 0.4, 
        label: 'Volume Analysis' 
      },
      { 
        threadId: 2, 
        weight: 0.1 + Math.random() * 0.4, 
        label: 'Volatility Index' 
      }
    ].map(w => ({ ...w, weight: w.weight / (0.6 + Math.random() * 0.8) })), // Normalize
    decisions: generateMockDecisions(),
    observations: [
      {
        threadId: 0,
        value: Math.floor(Math.random() * 2000) - 1000,
        confidence: 80 + Math.random() * 20,
        timestamp: currentTime - Math.random() * 60000,
        label: 'Price Momentum'
      },
      {
        threadId: 1,
        value: Math.floor(Math.random() * 1500) - 750,
        confidence: 70 + Math.random() * 30,
        timestamp: currentTime - Math.random() * 60000,
        label: 'Volume Analysis'
      },
      {
        threadId: 2,
        value: Math.floor(Math.random() * 1000) - 500,
        confidence: 85 + Math.random() * 15,
        timestamp: currentTime - Math.random() * 60000,
        label: 'Volatility Index'
      }
    ],
    contractAddresses: {
      mainController: 'A12s5FnNJf2H8K3sD6gH8L9mP0qR7tY4uI6oP8mN1bV3cX',
      observationThreads: [
        'A23t6GoOKg3I9L4tE7hI9M0nQ1rS8uZ5vJ7pQ9nO2cW4dY',
        'A34u7HpPLh4J0M5uF8iJ0N1oR2sT9vA6wK8qR0oP3dX5eZ',
        'A45v8IqQMi5K1N6vG9jK1O2pS3tU0wB7xL9rS1pQ4eY6fA'
      ]
    }
  };
}

function generateMockDecisions(): Decision[] {
  const decisions: Decision[] = [];
  const currentTime = Date.now();
  const states: ('BULL' | 'BEAR' | 'SIDEWAYS')[] = ['BULL', 'BEAR', 'SIDEWAYS'];
  const actions: ('NO_ACTION' | 'BUY_SIGNAL' | 'SELL_SIGNAL' | 'REBALANCE')[] = 
    ['NO_ACTION', 'BUY_SIGNAL', 'SELL_SIGNAL', 'REBALANCE'];
  
  for (let i = 0; i < 10; i++) {
    const state = states[Math.floor(Math.random() * states.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    
    decisions.push({
      timestamp: currentTime - (i * 30000) - Math.random() * 30000,
      state,
      action,
      description: getDecisionDescription(state, action),
      cycleNumber: 50 - i + Math.floor(Math.random() * 5)
    });
  }
  
  return decisions.sort((a, b) => b.timestamp - a.timestamp);
}

function getDecisionDescription(state: string, action: string): string {
  const descriptions = {
    'BULL_BUY_SIGNAL': 'Strong bullish momentum detected - Initiating buy signal',
    'BEAR_SELL_SIGNAL': 'Bearish trend confirmed - Executing sell signal',
    'SIDEWAYS_REBALANCE': 'Market consolidation - Rebalancing portfolio',
    'BULL_REBALANCE': 'Bull market plateau - Portfolio rebalancing',
    'BEAR_NO_ACTION': 'Bear market conditions - Holding current positions',
    'SIDEWAYS_NO_ACTION': 'Sideways movement - No action required'
  };
  
  const key = `${state}_${action}`;
  return descriptions[key as keyof typeof descriptions] || 
    `${state} market state - ${action} executed`;
}