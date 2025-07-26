export interface WalletState {
  provider: unknown | null; // Flexible type for provider
  wallet: unknown | null; // Wallet provider instance from getWallets()
  balance: string;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
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
} 