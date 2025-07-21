import 'dotenv/config';
import {
  Account,
  Args,
  Mas,
  SmartContract,
  JsonRpcProvider,
} from '@massalabs/massa-web3';
import { readFileSync, existsSync } from 'fs';

const account = await Account.fromEnv();
const provider = JsonRpcProvider.buildnet(account);

async function getContractAddress(): Promise<string> {
  if (existsSync('deployment.json')) {
    const deployment = JSON.parse(readFileSync('deployment.json', 'utf8'));
    return deployment.step1System.mainContract;
  }
  
  const envContent = readFileSync('.env', 'utf8');
  const match = envContent.match(/MAIN_CONTRACT_ADDRESS="([^"]+)"/);
  if (match && match[1]) {
    return match[1];
  }
  
  throw new Error('Contract address not found. Please deploy first.');
}

async function executeCommand(command: string) {
  console.log(`🎮 Step1 DeFi System Control - ${command.toUpperCase()}`);
  console.log('=' .repeat(50));
  
  try {
    const contractAddress = await getContractAddress();
    console.log(`🎯 Contract: ${contractAddress}`);
    
    const contract = new SmartContract(provider, contractAddress);
    
    switch (command) {
      case 'force-cycle':
        console.log('\n🔄 Triggering manual autonomous cycle...');
        await contract.call('autonomousCycle', new Args(), {
          coins: Mas.fromString('0.01')
        });
        console.log('✅ Autonomous cycle triggered successfully!');
        console.log('📊 Check events for execution results');
        break;
        
      case 'emergency-stop':
        console.log('\n🛑 Activating emergency stop...');
        await contract.call('emergencyStopASC', new Args(), {
          coins: Mas.fromString('0.001')
        });
        console.log('✅ Emergency stop activated!');
        console.log('⚠️  All autonomous execution has been halted');
        break;
        
      case 'resume':
        console.log('\n▶️ Resuming ASC execution...');
        await contract.call('resumeASC', new Args(), {
          coins: Mas.fromString('0.01')
        });
        console.log('✅ ASC execution resumed!');
        console.log('🤖 System will continue autonomous operation');
        break;
        
      case 'status':
        console.log('\n📊 Checking system status...');
        
        // System Status
        try {
          const status = await contract.read('getSystemStatus', new Args());
          console.log('✅ System Status: Operational');
        } catch (error) {
          console.log('❌ System Status: Error or offline');
        }
        
        // Last Decision
        try {
          const decision = await contract.read('getLastDecision', new Args());
          console.log('✅ Last Decision: Available');
        } catch (error) {
          console.log('⚠️  Last Decision: No recent decisions');
        }
        
        // ASC Stats
        try {
          await contract.call('getASCStats', new Args(), {
            coins: Mas.fromString('0.001')
          });
          console.log('✅ ASC Statistics: Retrieved (check events)');
        } catch (error) {
          console.log('⚠️  ASC Statistics: Not available');
        }
        break;
        
      case 'health':
        console.log('\n🏥 Performing health check...');
        await contract.call('healthCheck', new Args(), {
          coins: Mas.fromString('0.001')
        });
        console.log('✅ Health check completed successfully!');
        break;
        
      case 'init-asc':
        console.log('\n🤖 Initializing ASC system...');
        await contract.call('initializeASC', new Args(), {
          coins: Mas.fromString('0.05')
        });
        console.log('✅ ASC system initialized!');
        console.log('🚀 Autonomous execution is now active');
        break;
        
      default:
        console.log('❌ Unknown command:', command);
        console.log('\n🎮 Available commands:');
        console.log('• force-cycle    - Trigger manual autonomous cycle');
        console.log('• emergency-stop - Emergency stop ASC');
        console.log('• resume        - Resume ASC execution');
        console.log('• status        - Check system status');
        console.log('• health        - Perform health check');
        console.log('• init-asc      - Initialize ASC system');
        return;
    }
    
    console.log(`\n✅ Command '${command}' executed successfully!`);
    console.log(`⏰ Timestamp: ${new Date().toLocaleString()}`);
    
  } catch (error) {
    console.error(`❌ Command '${command}' failed:`, error);
    console.log('\n🔧 Troubleshooting:');
    console.log('• Check if system is deployed: npm run deploy-step1');
    console.log('• Verify you have enough MAS tokens');
    console.log('• Check network connectivity');
  }
}

// Get command from command line arguments
const command = process.argv[2];
if (!command) {
  console.log('🎮 Step1 DeFi System Control');
  console.log('============================');
  console.log('\nUsage: npm run control <command>');
  console.log('\n🎮 Available commands:');
  console.log('• force-cycle    - Trigger manual autonomous cycle');
  console.log('• emergency-stop - Emergency stop ASC');
  console.log('• resume        - Resume ASC execution');
  console.log('• status        - Check system status');
  console.log('• health        - Perform health check');
  console.log('• init-asc      - Initialize ASC system');
  process.exit(1);
}

executeCommand(command).catch(console.error);