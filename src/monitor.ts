import 'dotenv/config';
import {
  Account,
  Args,
  SmartContract,
  JsonRpcProvider,
} from '@massalabs/massa-web3';
import { readFileSync, existsSync } from 'fs';

const account = await Account.fromEnv();
const provider = JsonRpcProvider.buildnet(account);

interface DeploymentInfo {
  step1System: {
    mainContract: string;
    observationThreads: Array<{
      id: number;
      address: string;
    }>;
  };
}

async function getContractAddress(): Promise<string> {
  if (existsSync('deployment.json')) {
    const deployment: DeploymentInfo = JSON.parse(readFileSync('deployment.json', 'utf8'));
    return deployment.step1System.mainContract;
  }
  
  const envContent = readFileSync('.env', 'utf8');
  const match = envContent.match(/MAIN_CONTRACT_ADDRESS="([^"]+)"/);
  if (match && match[1]) {
    return match[1];
  }
  
  throw new Error('Contract address not found. Please deploy first using: npm run deploy-step1');
}

async function monitorSystem() {
  console.log('📊 Step1 DeFi System Monitor');
  console.log('============================');
  
  try {
    const contractAddress = await getContractAddress();
    console.log(`🎯 Monitoring contract: ${contractAddress}`);
    
    const contract = new SmartContract(provider, contractAddress);
    
    console.log('\n🔍 System Health Check...');
    
    // 1. Project Info
    try {
      const projectInfo = await contract.read('getProjectInfo', new Args());
      console.log('✅ Project Info: Available');
    } catch (error) {
      console.log('❌ Project Info: Not available');
    }
    
    // 2. System Status
    try {
      const status = await contract.read('getSystemStatus', new Args());
      console.log('✅ System Status: Operational');
    } catch (error) {
      console.log('❌ System Status: Error or initializing');
    }
    
    // 3. Last Decision
    try {
      const decision = await contract.read('getLastDecision', new Args());
      console.log('✅ Last Decision: Available');
    } catch (error) {
      console.log('⚠️  Last Decision: No decisions yet or system starting');
    }
    
    // 4. ASC Statistics
    console.log('\n🤖 ASC (Autonomous Smart Contract) Status...');
    try {
      await contract.call('getASCStats', new Args(), {
        coins: provider.getBaseAccount().balance
      });
      console.log('✅ ASC Stats: Retrieved (check events)');
    } catch (error) {
      console.log('⚠️  ASC Stats: System may be initializing');
    }
    
    // 5. Health Check
    try {
      await contract.call('healthCheck', new Args());
      console.log('✅ Health Check: System responding');
    } catch (error) {
      console.log('❌ Health Check: System may be down');
    }
    
    console.log('\n📈 Performance Metrics:');
    console.log(`• Contract Address: ${contractAddress}`);
    console.log(`• Network: Massa Buildnet`);
    console.log(`• Monitor Time: ${new Date().toLocaleString()}`);
    
    console.log('\n🎮 Available Commands:');
    console.log('• npm run force-cycle    - Trigger manual autonomous cycle');
    console.log('• npm run emergency-stop - Emergency stop ASC');
    console.log('• npm run resume        - Resume ASC execution');
    console.log('• npm run check-threads - Check observation threads');
    
  } catch (error) {
    console.error('❌ Monitoring failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('• Run: npm run deploy-step1 (if not deployed yet)');
    console.log('• Check network connectivity');
    console.log('• Verify contract address in deployment.json or .env');
  }
}

// Run monitoring
monitorSystem().catch(console.error);