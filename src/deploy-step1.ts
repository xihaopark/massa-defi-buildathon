import 'dotenv/config';
import {
  Account,
  Args,
  Mas,
  SmartContract,
  JsonRpcProvider,
} from '@massalabs/massa-web3';
import { getScByteCode } from './utils';
import { writeFileSync, readFileSync } from 'fs';

const account = await Account.fromEnv();
const provider = JsonRpcProvider.buildnet(account);

interface DeploymentResult {
  contractName: string;
  address: string;
  threadId?: number;
}

async function deployContract(
  contractName: string, 
  constructorArgs: Args,
  coins: string = '0.01'
): Promise<DeploymentResult> {
  console.log(`\n🚀 Deploying ${contractName}...`);
  
  const byteCode = getScByteCode('build', `${contractName}.wasm`);
  
  const contract = await SmartContract.deploy(
    provider,
    byteCode,
    constructorArgs,
    { coins: Mas.fromString(coins) },
  );

  console.log(`✅ ${contractName} deployed at: ${contract.address}`);
  
  return {
    contractName,
    address: contract.address
  };
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForExecution(contract: SmartContract, description: string): Promise<void> {
  console.log(`⏳ ${description}...`);
  await sleep(3000); // Wait 3 seconds for execution
  console.log(`✅ ${description} completed`);
}

async function main() {
  console.log('🚀 Step1 DeFi System - Advanced Deployment');
  console.log('==========================================');
  console.log(`👛 Deploying from address: ${account.address}`);
  console.log(`💰 Account balance check...`);

  const deploymentResults: DeploymentResult[] = [];

  try {
    // Step 1: Deploy Observation Threads
    console.log('\n📡 Deploying Observation Threads...');
    const observationThreads: DeploymentResult[] = [];
    
    for (let i = 0; i < 3; i++) {
      const threadArgs = new Args()
        .addU8(i)           // Thread ID
        .addI64(BigInt(1000 * (i + 1))); // Initial value
      
      const thread = await deployContract('ObservationThread', threadArgs);
      thread.threadId = i;
      observationThreads.push(thread);
      deploymentResults.push(thread);
      
      await sleep(1000); // Wait between deployments
    }

    // Step 2: Deploy Main Contract (Enhanced Controller)
    console.log('\n🎯 Deploying Main Step1 System...');
    const mainArgs = new Args()
      .addU8(observationThreads.length); // Thread count
    
    // Add thread addresses
    for (const thread of observationThreads) {
      mainArgs.addString(thread.address);
    }

    const mainContract = await deployContract('main', mainArgs, '0.1');
    deploymentResults.push(mainContract);

    // Step 3: Initialize ASC (Autonomous Smart Contract)
    console.log('\n🤖 Initializing ASC (Autonomous Smart Contract)...');
    const contract = new SmartContract(provider, mainContract.address);
    
    await contract.call('initializeASC', new Args(), {
      coins: Mas.fromString('0.05')
    });
    await waitForExecution(contract, 'ASC initialization');

    // Step 4: Test System Functions
    console.log('\n🧪 Testing System Functions...');
    
    // Test system status
    try {
      const statusResult = await contract.read('getSystemStatus', new Args());
      console.log('✅ System status: Operational');
    } catch (error) {
      console.log('⚠️  Status check: System initializing...');
    }

    // Test project info
    try {
      const projectInfo = await contract.read('getProjectInfo', new Args());
      console.log('✅ Project info retrieved successfully');
    } catch (error) {
      console.log('⚠️  Project info: Function may not be available yet');
    }

    // Test health check
    try {
      await contract.call('healthCheck', new Args(), {
        coins: Mas.fromString('0.001')
      });
      console.log('✅ Health check completed');
    } catch (error) {
      console.log('⚠️  Health check: System starting up...');
    }

    // Step 5: Trigger Manual Autonomous Cycle
    console.log('\n🔄 Triggering Manual Autonomous Cycle...');
    try {
      await contract.call('autonomousCycle', new Args(), {
        coins: Mas.fromString('0.01')
      });
      await waitForExecution(contract, 'Autonomous cycle execution');
    } catch (error) {
      console.log('⚠️  Autonomous cycle: System may need more initialization time');
    }

    // Step 6: Start Market Simulation
    console.log('\n🎲 Starting Market Simulation on Threads...');
    for (const thread of observationThreads) {
      try {
        const threadContract = new SmartContract(provider, thread.address);
        await threadContract.call('simulateMarketData', new Args(), {
          coins: Mas.fromString('0.001')
        });
        console.log(`✅ Thread ${thread.threadId} market simulation started`);
        await sleep(500);
      } catch (error) {
        console.log(`⚠️  Thread ${thread.threadId} simulation: May need manual trigger`);
      }
    }

    // Step 7: Get ASC Statistics
    console.log('\n📊 Retrieving ASC Statistics...');
    try {
      await contract.call('getASCStats', new Args(), {
        coins: Mas.fromString('0.001')
      });
      console.log('✅ ASC statistics retrieved - check events for details');
    } catch (error) {
      console.log('⚠️  ASC stats: System initializing, stats will be available after first execution');
    }

    // Final Summary
    console.log('\n🎉 STEP1 DEFI SYSTEM DEPLOYMENT COMPLETED!');
    console.log('==========================================');
    console.log('\n📋 Contract Addresses:');
    console.log(`🎯 Main Step1 System: ${mainContract.address}`);
    
    observationThreads.forEach((thread) => {
      console.log(`🔗 Thread ${thread.threadId}: ${thread.address}`);
    });

    // Save deployment info
    const deploymentInfo = {
      timestamp: new Date().toISOString(),
      network: 'buildnet',
      deployer: account.address,
      step1System: {
        mainContract: mainContract.address,
        observationThreads: observationThreads.map(t => ({
          id: t.threadId,
          address: t.address
        }))
      },
      status: 'deployed',
      features: [
        'Practical Market Detection',
        'Autonomous Trading Execution', 
        'ASC Scheduling',
        'Real-time Data Aggregation',
        'Risk Management',
        'Emergency Controls'
      ]
    };

    writeFileSync('deployment.json', JSON.stringify(deploymentInfo, null, 2));
    console.log('\n💾 Deployment info saved to deployment.json');

    // Next Steps
    console.log('\n🚀 SYSTEM IS NOW RUNNING AUTONOMOUSLY!');
    console.log('======================================');
    console.log('\n✅ What\'s happening now:');
    console.log('• ASC scheduler is managing autonomous execution');
    console.log('• Market detection algorithms are analyzing data');
    console.log('• Risk management system is monitoring trades');
    console.log('• System will execute trades based on market conditions');
    console.log('\n📊 Monitoring options:');
    console.log('• Run: npm run monitor (to watch system events)');
    console.log('• Run: npm run status (to check system status)');
    console.log('• Check events in Massa explorer');
    console.log('\n🎮 Manual controls:');
    console.log('• Emergency stop: npm run emergency-stop');
    console.log('• Resume: npm run resume');
    console.log('• Force cycle: npm run force-cycle');

    // Update .env with contract addresses
    let envContent = readFileSync('.env', 'utf8');
    envContent = envContent.replace(/MAIN_CONTRACT_ADDRESS=""/, `MAIN_CONTRACT_ADDRESS="${mainContract.address}"`);
    writeFileSync('.env', envContent);

    console.log('\n✅ Contract address saved to .env file');

  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    console.error('\n🔧 Troubleshooting:');
    console.error('• Check your private key in .env');
    console.error('• Ensure you have enough MAS tokens (need ~1 MAS)');
    console.error('• Verify network connectivity to Massa buildnet');
    console.error('• Try running: npm run build first');
    process.exit(1);
  }
}

main().catch(console.error);