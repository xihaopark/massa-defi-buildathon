// Data structures for Step1 DeFi System
import { Args } from '@massalabs/as-types';

// Thread observation state
export class ThreadState {
  value: i64;        // Latest observation value
  timestamp: u64;    // Observation timestamp
  confidence: u32;   // Confidence level (0-100)
  
  constructor(value: i64 = 0, timestamp: u64 = 0, confidence: u32 = 100) {
    this.value = value;
    this.timestamp = timestamp;
    this.confidence = confidence;
  }
  
  serialize(): StaticArray<u8> {
    const args = new Args();
    args.add(this.value);
    args.add(this.timestamp);
    args.add(this.confidence);
    return args.serialize();
  }
  
  static deserialize(data: StaticArray<u8>): ThreadState {
    const args = new Args(data);
    const value = args.nextI64().expect('Missing value');
    const timestamp = args.nextU64().expect('Missing timestamp');
    const confidence = args.nextU32().expect('Missing confidence');
    return new ThreadState(value, timestamp, confidence);
  }
}

// Market states for HMM
export enum MarketState {
  BULL = 0,    // Bull market
  BEAR = 1,    // Bear market
  SIDEWAYS = 2 // Sideways market
}

// Observation set from multiple threads
export class ObservationSet {
  observations: Map<u8, i64> = new Map<u8, i64>();
  
  addObservation(threadId: u8, value: i64): void {
    this.observations.set(threadId, value);
  }
  
  getObservation(threadId: u8): i64 {
    return this.observations.has(threadId) ? this.observations.get(threadId) : 0;
  }
  
  size(): i32 {
    return this.observations.size;
  }
}

// Attention weights for multiple threads
export class AttentionWeights {
  weights: Map<u8, u32> = new Map<u8, u32>(); // Using u32 for fixed-point representation
  
  setWeight(threadId: u8, weight: u32): void {
    this.weights.set(threadId, weight);
  }
  
  getWeight(threadId: u8): u32 {
    return this.weights.has(threadId) ? this.weights.get(threadId) : 0;
  }
  
  normalize(): void {
    let total: u32 = 0;
    const keys = this.weights.keys();
    
    // Calculate total
    for (let i = 0; i < keys.length; i++) {
      total += this.weights.get(keys[i]);
    }
    
    // Normalize to 1000000 (representing 1.0 in fixed point)
    if (total > 0) {
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const normalizedWeight = (this.weights.get(key) * 1000000) / total;
        this.weights.set(key, normalizedWeight);
      }
    }
  }
}

// HMM Model parameters
export class HMMModel {
  currentState: MarketState = MarketState.SIDEWAYS;
  stateProbabilities: Map<MarketState, u32> = new Map<MarketState, u32>();
  
  // Transition probabilities (fixed point representation)
  transitionMatrix: Map<MarketState, Map<MarketState, u32>> = new Map<MarketState, Map<MarketState, u32>>();
  
  constructor() {
    this.initializeDefaultModel();
  }
  
  private initializeDefaultModel(): void {
    // Initialize state probabilities (equal distribution)
    this.stateProbabilities.set(MarketState.BULL, 333333);
    this.stateProbabilities.set(MarketState.BEAR, 333333);
    this.stateProbabilities.set(MarketState.SIDEWAYS, 333334);
    
    // Initialize transition matrix with default probabilities
    this.initializeTransitionMatrix();
  }
  
  private initializeTransitionMatrix(): void {
    // Bull state transitions
    const bullTransitions = new Map<MarketState, u32>();
    bullTransitions.set(MarketState.BULL, 700000);     // 70% stay in bull
    bullTransitions.set(MarketState.SIDEWAYS, 250000); // 25% to sideways
    bullTransitions.set(MarketState.BEAR, 50000);      // 5% to bear
    this.transitionMatrix.set(MarketState.BULL, bullTransitions);
    
    // Bear state transitions
    const bearTransitions = new Map<MarketState, u32>();
    bearTransitions.set(MarketState.BEAR, 700000);     // 70% stay in bear
    bearTransitions.set(MarketState.SIDEWAYS, 250000); // 25% to sideways
    bearTransitions.set(MarketState.BULL, 50000);      // 5% to bull
    this.transitionMatrix.set(MarketState.BEAR, bearTransitions);
    
    // Sideways state transitions
    const sidewaysTransitions = new Map<MarketState, u32>();
    sidewaysTransitions.set(MarketState.SIDEWAYS, 600000); // 60% stay sideways
    sidewaysTransitions.set(MarketState.BULL, 200000);     // 20% to bull
    sidewaysTransitions.set(MarketState.BEAR, 200000);     // 20% to bear
    this.transitionMatrix.set(MarketState.SIDEWAYS, sidewaysTransitions);
  }
  
  updateState(observations: ObservationSet, weights: AttentionWeights): MarketState {
    // Simplified HMM state update based on weighted observations
    let weightedSum: i64 = 0;
    let totalWeight: u32 = 0;
    
    const obsKeys = observations.observations.keys();
    for (let i = 0; i < obsKeys.length; i++) {
      const threadId = obsKeys[i];
      const obsValue = observations.getObservation(threadId);
      const weight = weights.getWeight(threadId);
      
      weightedSum += (obsValue * weight) / 1000000; // Convert from fixed point
      totalWeight += weight;
    }
    
    if (totalWeight === 0) return this.currentState;
    
    const avgObservation = weightedSum;
    
    // Simple state determination based on observation trend
    if (avgObservation > 1000) {
      this.currentState = MarketState.BULL;
    } else if (avgObservation < -1000) {
      this.currentState = MarketState.BEAR;
    } else {
      this.currentState = MarketState.SIDEWAYS;
    }
    
    return this.currentState;
  }
}

// Decision action types
export enum ActionType {
  NO_ACTION = 0,
  BUY_SIGNAL = 1,
  SELL_SIGNAL = 2,
  REBALANCE = 3
}

// Decision record
export class DecisionRecord {
  timestamp: u64;
  state: MarketState;
  action: ActionType;
  description: string;
  
  constructor(timestamp: u64, state: MarketState, action: ActionType, description: string) {
    this.timestamp = timestamp;
    this.state = state;
    this.action = action;
    this.description = description;
  }
}