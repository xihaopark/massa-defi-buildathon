// Type definitions for Step1 DeFi System

export interface SystemStatus {
  state: string;
  cycleCount: number;
  decisionCount: number;
  currentMarketState: 'BULL' | 'BEAR' | 'SIDEWAYS';
  lastUpdate: number;
}

export interface AttentionWeight {
  threadId: number;
  weight: number;
  label: string;
}

export interface Decision {
  timestamp: number;
  state: 'BULL' | 'BEAR' | 'SIDEWAYS';
  action: 'NO_ACTION' | 'BUY_SIGNAL' | 'SELL_SIGNAL' | 'REBALANCE';
  description: string;
  cycleNumber: number;
}

export interface ThreadObservation {
  threadId: number;
  value: number;
  confidence: number;
  timestamp: number;
  label: string;
}

export interface SystemData {
  status: SystemStatus;
  attentionWeights: AttentionWeight[];
  decisions: Decision[];
  observations: ThreadObservation[];
  contractAddresses: {
    mainController: string;
    observationThreads: string[];
  };
}

export interface ChartDataPoint {
  x: number;
  y: number;
  label?: string;
}

export interface AttentionChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}

export interface ContractCallResult {
  success: boolean;
  data?: any;
  error?: string;
}