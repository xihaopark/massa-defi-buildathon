export interface WalletState {
  provider: unknown | null;
  wallet: unknown | null;
  balance: string;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  address: string;
}

export interface WalletAccount {
  address: string;
  name?: string;
  balance?: string;
}

export interface ContractAddresses {
  vault?: string;
  [key: string]: string | undefined;
}

export interface WalletConnectionResult {
  success: boolean;
  provider?: unknown;
  wallet?: unknown;
  balance?: string;
  error?: string;
  address?: string;
  accounts?: WalletAccount[];
} 