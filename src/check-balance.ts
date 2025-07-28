import 'dotenv/config';
import { Account, JsonRpcProvider } from '@massalabs/massa-web3';

async function checkBalance() {
  try {
    const account = await Account.fromEnv();
    const provider = JsonRpcProvider.buildnet(account);
    
    console.log('💰 Step1 DeFi System - Balance Check');
    console.log('===================================');
    console.log(`👛 Wallet Address: ${account.address}`);
    console.log(`🌐 Network: Massa Buildnet (Testnet)`);
    
    // Try to get balance using the correct API
    const balance = await provider.balance(account.address, true);
    const balanceInMas = Number(balance) / 1e9; // Convert from nanoMAS to MAS
    
    console.log(`💵 Current Balance: ${balanceInMas.toFixed(4)} MAS`);
    console.log(`📊 Raw Balance: ${balance} nanoMAS`);
    
    // Check if sufficient for deployment
    const requiredMas = 1.0; // Estimated requirement
    if (balanceInMas >= requiredMas) {
      console.log('✅ Sufficient balance for deployment!');
      console.log('🚀 You can now run: npm run deploy-step1');
    } else {
      console.log(`❌ Insufficient balance. Need ~${requiredMas} MAS for deployment.`);
      console.log(`📉 Need ${(requiredMas - balanceInMas).toFixed(4)} more MAS`);
      console.log('\n🔗 Get testnet tokens:');
      console.log('• Discord faucet: https://discord.gg/massa (#testnet-faucet)');
      console.log('• Massa Station: https://station.massa.net');
      console.log(`• Use command: /drip ${account.address}`);
    }
    
    console.log(`\n⏰ Check time: ${new Date().toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Balance check failed:', error);
  }
}

checkBalance().catch(console.error);