import * as massa from '@massalabs/massa-web3';
import { getWallets } from '@massalabs/wallet-provider';
import type { WalletConnectionResult } from '../types';

/**
 * Connect to Massa wallet using available wallet providers
 */
export const connectWallet = async (): Promise<WalletConnectionResult> => {
  try {
    console.log('🔍 Searching for available wallets...');
    
    // Get available wallets
    const wallets = await getWallets();
    console.log('📋 Found wallets:', wallets.map(w => {
      try {
        return w.name?.() || 'Unknown wallet';
      } catch {
        return 'Unknown wallet';
      }
    }));
    
    // Filter for Massa-specific wallets
    const massaWallets = wallets.filter(wallet => {
      try {
        const walletName = wallet.name?.()?.toLowerCase() || '';
        return walletName.includes('massa') || 
               walletName.includes('bearby') || 
               walletName.includes('massastation');
      } catch {
        return false;
      }
    });
    
    console.log('🎯 Massa wallets found:', massaWallets.map(w => {
      try {
        return w.name?.() || 'Unknown';
      } catch {
        return 'Unknown';
      }
    }));
    
    if (massaWallets.length === 0) {
      return {
        success: false,
        error: 'No Massa wallet found. Please install MassaStation or Bearby wallet extension.'
      };
    }
    
    // Connect to first available Massa wallet
    const selectedWallet = massaWallets[0];
    console.log('🔗 Connecting to wallet:', selectedWallet.name?.() || 'Unknown');
    
    const connected = await selectedWallet.connect();
    
    if (!connected) {
      return {
        success: false,
        error: 'Failed to connect to Massa wallet'
      };
    }
    
    console.log('✅ Wallet connected successfully');
    
    // Get accounts from wallet
    const accounts = await selectedWallet.accounts();
    console.log('📊 Found accounts:', accounts.length);
    
    if (accounts.length === 0) {
      return {
        success: false,
        error: 'No accounts found in Massa wallet'
      };
    }
    
    // Use first account as provider
    const provider = accounts[0];
    console.log('💰 Getting balance for account...');
    
    const balance = await provider.balance(true);
    const balanceString = massa.Mas.toString(balance);
    console.log('💎 Balance:', balanceString, 'MAS');
    
    return {
      success: true,
      provider,
      wallet: selectedWallet,
      balance: balanceString
    };
  } catch (error) {
    console.error('❌ Wallet connection error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to Massa wallet'
    };
  }
};

/**
 * Connect using private key (development fallback) - specifically for Massa buildnet
 */
export const connectWithPrivateKey = async (
  address: string, 
  privateKey: string
): Promise<WalletConnectionResult> => {
  try {
    console.log('🔑 Connecting with private key to Massa buildnet...');
    
    // Validate private key format (Massa private keys start with S1)
    if (!privateKey.startsWith('S1')) {
      return {
        success: false,
        error: 'Invalid Massa private key format. Private key should start with S1.'
      };
    }
    
    console.log('✅ Credentials validated, creating account...');
    
    // Create account from private key using the correct API
    const account = await massa.Account.fromPrivateKey(privateKey);
    console.log('📝 Account created from private key');
    
    // Create provider specifically for buildnet
    const provider = massa.JsonRpcProvider.buildnet(account);
    console.log('🌐 Connected to Massa buildnet');
    
    // Get balance from buildnet
    const balance = await provider.balance(true);
    const balanceString = massa.Mas.toString(balance);
    console.log('💎 Buildnet balance:', balanceString, 'MAS');
    
    return {
      success: true,
      provider: account,
      wallet: null, // No wallet provider when using private key
      balance: balanceString
    };
  } catch (error) {
    console.error('❌ Private key connection error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to Massa buildnet with private key'
    };
  }
};

/**
 * Disconnect wallet and clear state
 */
export const disconnectWallet = async (wallet: unknown): Promise<void> => {
  try {
    console.log('🔌 Disconnecting wallet...');
    if (wallet && typeof wallet === 'object' && wallet !== null && 'disconnect' in wallet && typeof (wallet as { disconnect: unknown }).disconnect === 'function') {
      await (wallet as { disconnect: () => Promise<void> }).disconnect();
      console.log('✅ Wallet disconnected successfully');
    }
  } catch (error) {
    console.error('❌ Error disconnecting wallet:', error);
  }
};

/**
 * Get contract addresses from environment or fallback
 */
export const getContractAddresses = (): Record<string, string> => {
  const addresses: Record<string, string> = {};
  
  // Try to get addresses from environment variables
  if (import.meta.env.VITE_VAULT_ADDRESS) {
    addresses.vault = import.meta.env.VITE_VAULT_ADDRESS;
  }
  
  return addresses;
}; 