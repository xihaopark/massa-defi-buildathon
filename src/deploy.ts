import 'dotenv/config';
import {
  Account,
  Args,
  Mas,
  SmartContract,
  JsonRpcProvider,
} from '@massalabs/massa-web3';
import { getScByteCode } from './utils';
import { writeFileSync } from 'fs';

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
  threadId?: number
): Promise<DeploymentResult> {
  console.log(`\n🚀 Deploying ${contractName}${threadId !== undefined ? ` (Thread ${threadId})` : ''}...`);
  
  const byteCode = getScByteCode('build', `${contractName}.wasm`);
  
  const contract = await SmartContract.deploy(
    provider,
    byteCode,
    constructorArgs,
    { coins: Mas.fromString('0.01') },
  );

  console.log(`✅ ${contractName} deployed at: ${contract.address}`);
  
  return {
    contractName,
    address: contract.address,
    threadId
  };
}

async function main() {
  console.log('🔧 Step1 DeFi System Deployment');
  console.log('================================');
  console.log(`👛 Deploying from address: ${account.address}`);

  const deploymentResults: DeploymentResult[] = [];

  try {
    // Step 1: Deploy observation thread contracts (3 threads)
    console.log('\n📡 Deploying Observation Threads...');
    const observationThreads: DeploymentResult[] = [];
    
    for (let i = 0; i < 3; i++) {
      const threadArgs = new Args()
        .addU8(i)           // Thread ID
        .addI64(1000 * (i + 1)); // Initial value
      
      const thread = await deployContract('ObservationThread', threadArgs, i);
      observationThreads.push(thread);
      deploymentResults.push(thread);
    }

    // Step 2: Deploy main controller with thread addresses
    console.log('\n🎯 Deploying Main Controller...');
    const controllerArgs = new Args()
      .addU8(observationThreads.length); // Thread count
    
    // Add thread addresses
    for (const thread of observationThreads) {
      controllerArgs.addString(thread.address);
    }

    const mainController = await deployContract('MainController', controllerArgs);
    deploymentResults.push(mainController);

    // Step 3: Test system functionality
    console.log('\n🧪 Testing System...');
    
    // Test main controller status
    const mainContract = new SmartContract(provider, mainController.address);
    const statusResult = await mainContract.read('getSystemStatus', new Args());
    console.log('📊 System status retrieved successfully');

    // Initialize market simulation for threads
    console.log('\n🎲 Starting Market Simulation...');
    for (const thread of observationThreads) {
      try {
        const threadContract = new SmartContract(provider, thread.address);
        await threadContract.call('simulateMarketData', new Args(), {
          coins: Mas.fromString('0.001')
        });
        console.log(`✅ Thread ${thread.threadId} simulation started`);
      } catch (error) {
        console.warn(`⚠️  Failed to start simulation for thread ${thread.threadId}`);
      }
    }

    // Final summary
    console.log('\n🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!');
    console.log('=====================================');
    console.log('\n📋 Contract Addresses:');
    console.log(`🎯 Main Controller: ${mainController.address}`);
    
    observationThreads.forEach((thread) => {
      console.log(`🔗 Observation Thread ${thread.threadId}: ${thread.address}`);
    });

    // Save deployment info
    const deploymentInfo = {
      timestamp: new Date().toISOString(),
      network: 'buildnet',
      deployer: account.address,
      contracts: deploymentResults.reduce((acc, contract) => {
        if (contract.contractName === 'MainController') {
          acc.mainController = contract.address;
        } else {
          if (!acc.observationThreads) acc.observationThreads = [];
          acc.observationThreads.push({
            id: contract.threadId,
            address: contract.address
          });
        }
        return acc;
      }, {} as any)
    };

    writeFileSync('deployment.json', JSON.stringify(deploymentInfo, null, 2));
    console.log('\n💾 Deployment info saved to deployment.json');

    console.log('\n🚀 Next Steps:');
    console.log('• System is now running autonomously');
    console.log('• Deploy frontend to DeWeb');
    console.log('• Monitor system through events');

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
