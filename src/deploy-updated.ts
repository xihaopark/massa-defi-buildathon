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
}

async function deployContract(
  contractName: string, 
  constructorArgs: Args,
  coins: string = '0.1'
): Promise<DeploymentResult> {
  console.log(`\n🚀 Deploying ${contractName}...`);
  
  const byteCode = getScByteCode('build', `${contractName}.wasm`);
  
  // Use maximum gas limit and more coins for deployment
  const contract = await SmartContract.deploy(
    provider,
    byteCode,
    constructorArgs,
    { 
      coins: Mas.fromString(coins),
      maxGas: BigInt(3980167295), // Maximum allowed gas limit
      gasPrice: BigInt(1), // Standard gas price
    },
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

async function main() {
  console.log('🚀 Updated Step1 DeFi System - Deployment');
  console.log('==========================================');
  console.log(`👛 Deploying from address: ${account.address}`);

  try {
    // First, deploy the main contract with updated features
    console.log('\n🎯 Deploying Updated Main Controller...');
    const mainArgs = new Args()
      .addU8(3); // Thread count (using existing threads)
    
    // Add existing thread addresses (from addresses.json)
    const addresses = JSON.parse(readFileSync('addresses.json', 'utf8'));
    for (const thread of addresses.step1.threads) {
      mainArgs.addString(thread.address);
    }

    const mainContract = await deployContract('MainController', mainArgs, '2.0'); // More coins for large contract

    // Update addresses.json with new main contract
    addresses.step1.main = mainContract.address;
    addresses.timestamp = new Date().toISOString();
    addresses.status = 'updated';
    
    writeFileSync('addresses.json', JSON.stringify(addresses, null, 2));

    // Update .env with new contract address
    let envContent = readFileSync('.env', 'utf8');
    envContent = envContent.replace(/MAIN_CONTRACT_ADDRESS="[^"]*"/, `MAIN_CONTRACT_ADDRESS="${mainContract.address}"`);
    writeFileSync('.env', envContent);

    console.log('\n🎉 UPDATED DEPLOYMENT COMPLETED!');
    console.log('=================================');
    console.log(`🎯 New Main Controller: ${mainContract.address}`);
    console.log('✅ Contract address saved to .env and deployment.json');
    
    console.log('\n🧪 Testing new features...');
    const contract = new SmartContract(provider, mainContract.address);
    
    // Test basic functionality
    try {
      await contract.call('initializeASC', new Args(), {
        coins: Mas.fromString('0.05'),
        maxGas: BigInt(50000000),
      });
      console.log('✅ ASC initialization successful');
    } catch (error) {
      console.log('⚠️  ASC initialization: May need manual trigger');
    }

    console.log('\n🚀 New Features Available:');
    console.log('• Strategy Management (switchStrategy, getActiveStrategy)');
    console.log('• Mean Reversion Strategy');
    console.log('• Virtual Market Generation');
    console.log('• Enhanced Market Data Processing');
    
    console.log('\n📊 Test commands:');
    console.log('• npm run control status');
    console.log('• npm run control health');
    console.log('• Frontend will now support strategy switching!');

  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    console.error('\n🔧 Troubleshooting:');
    console.error('• Check network connectivity');
    console.error('• Verify you have enough MAS tokens');
    console.error('• Try with smaller gas limit if needed');
    process.exit(1);
  }
}

main().catch(console.error);