// Buildnet Real-Time Monitor - Only Real Data from Massa Blockchain

class BuildnetMonitor {
    constructor() {
        this.rpcUrl = 'https://buildnet.massa.net/api/v2';
        this.addresses = {
            account: 'AU12bZJtxqWUgNtJ66MrmWbSFRgn6UrezqJahr5b62vEgVioMsmJM',
            main: 'AS12FWRKui3k2T8pi7pjF4KxUnueGWixnj85kn9j9EXADt6NvAXY1',
            dex: 'AS12Da1qWr1ndnTZrkr38DeWeoH5gFcRcqnripYhKy7UkPggX72ME',
            vault: 'AS12shXJLaEJiv8da5Bc35b5xq9r9szkar9i3BtnMMKnd2fjJHGad',
            threads: [
                'AS12Pm77Wf5pVkhvXGcGeMKXdm5HssgkWvFRC1xPVDtrrygQgaeXw',
                'AS1Xo9XY1kxQD8Mqxri82JNxk97PXPazLZnnnD4foBUjBVMwL2AW',
                'AS124TYaaap2mH3ZgPyhkTATNhS9X4kHY8tqqxe2FLAJZ8awJFaMZ'
            ]
        };
        
        this.refreshInterval = 30000; // 30 seconds
        this.countdownInterval = null;
        this.refreshTimer = null;
        
        this.initWithWallet();
    }
    
    async initWithWallet() {
        // Initialize wallet manager first
        const hasWallet = await walletManager.init();
        
        if (!hasWallet) {
            // No wallet configured, show dialog
            this.addLog('⚠️ No wallet configured. Please configure your wallet.');
            walletManager.showConfigDialog();
            
            // Wait for wallet configuration
            window.reloadWithNewWallet = (config) => {
                this.addresses.account = config.address;
                this.addLog(`✅ Wallet configured: ${config.address}`);
                this.init();
            };
        } else {
            // Wallet found, use it
            const address = walletManager.getAddress();
            if (address) {
                this.addresses.account = address;
                this.addLog(`✅ Using wallet: ${address}`);
            }
            this.init();
        }
    }
    
    async init() {
        this.addLog('🚀 Initializing Buildnet Monitor...');
        await this.loadAllData();
        this.startAutoRefresh();
        this.addLog('✅ Monitor initialized - displaying real blockchain data only');
    }
    
    // RPC helper function
    async rpcCall(method, params) {
        try {
            const response = await fetch(this.rpcUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: method,
                    params: params,
                    id: 1
                })
            });
            
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error.message);
            }
            
            return data.result;
        } catch (error) {
            console.error(`RPC call failed: ${method}`, error);
            throw error;
        }
    }
    
    // Load all data
    async loadAllData() {
        this.addLog('📊 Loading data from Massa Buildnet...');
        
        // Load in parallel for better performance
        await Promise.all([
            this.loadAccountData(),
            this.loadASCStatus(),
            this.loadContractBalances(),
            this.loadDEXData(),
            this.loadASCConfig(),
            this.loadThreadStatus()
        ]);
        
        this.addLog('✅ All data loaded successfully');
    }
    
    // Load account data
    async loadAccountData() {
        try {
            // Update wallet address display
            document.getElementById('wallet-address').textContent = this.addresses.account;
            
            const result = await this.rpcCall('get_addresses', [[this.addresses.account]]);
            if (result && result[0]) {
                const balance = result[0].candidate_balance || result[0].final_balance || '0';
                document.getElementById('account-balance').textContent = `${balance} MAS`;
                document.getElementById('balance-updated').textContent = new Date().toLocaleTimeString();
                
                this.addLog(`💰 Account balance: ${balance} MAS`);
            }
        } catch (error) {
            document.getElementById('account-balance').textContent = 'Error';
            this.addLog(`❌ Failed to load account balance: ${error.message}`);
        }
    }
    
    // Load ASC status
    async loadASCStatus() {
        try {
            // Get cycle count
            const cycleResult = await this.rpcCall('get_datastore_entries', [[{
                address: this.addresses.main,
                key: [99, 121, 99, 108, 101, 95, 99, 111, 117, 110, 116] // "cycle_count"
            }]]);
            
            let cycleCount = 0;
            if (cycleResult && cycleResult[0] && cycleResult[0].candidate_value) {
                const cycleBytes = cycleResult[0].candidate_value;
                cycleCount = parseInt(String.fromCharCode(...cycleBytes)) || 0;
            }
            
            document.getElementById('cycle-count').textContent = cycleCount.toString();
            
            // Get next execution time
            const nextExecResult = await this.rpcCall('get_datastore_entries', [[{
                address: this.addresses.main,
                key: [110, 101, 120, 116, 95, 101, 120, 101, 99, 117, 116, 105, 111, 110, 95, 116, 105, 109, 101] // "next_execution_time"
            }]]);
            
            if (nextExecResult && nextExecResult[0] && nextExecResult[0].candidate_value) {
                const timeBytes = nextExecResult[0].candidate_value;
                const timestamp = parseInt(String.fromCharCode(...timeBytes));
                const nextExecDate = new Date(timestamp);
                
                document.getElementById('next-execution').textContent = nextExecDate.toLocaleTimeString();
                
                // Calculate time until next execution
                const now = Date.now();
                const timeUntil = timestamp - now;
                
                if (timeUntil > 0) {
                    const seconds = Math.floor(timeUntil / 1000);
                    const minutes = Math.floor(seconds / 60);
                    document.getElementById('time-until').textContent = `${minutes}m ${seconds % 60}s`;
                    document.getElementById('asc-status').className = 'status-badge status-active';
                    document.getElementById('asc-status').textContent = 'ACTIVE';
                } else {
                    document.getElementById('time-until').textContent = 'Overdue';
                    document.getElementById('asc-status').className = 'status-badge status-pending';
                    document.getElementById('asc-status').textContent = 'PENDING';
                }
                
                this.addLog(`🤖 ASC Status: ${cycleCount} cycles completed, next execution at ${nextExecDate.toLocaleTimeString()}`);
            }
            
        } catch (error) {
            document.getElementById('asc-status').className = 'status-badge status-stopped';
            document.getElementById('asc-status').textContent = 'ERROR';
            this.addLog(`❌ Failed to load ASC status: ${error.message}`);
        }
    }
    
    // Load contract balances
    async loadContractBalances() {
        try {
            const addresses = [this.addresses.main, this.addresses.dex, this.addresses.vault];
            const result = await this.rpcCall('get_addresses', [addresses]);
            
            if (result) {
                if (result[0]) {
                    const balance = result[0].candidate_balance || '0';
                    document.getElementById('main-balance').textContent = `${balance} MAS`;
                }
                if (result[1]) {
                    const balance = result[1].candidate_balance || '0';
                    document.getElementById('dex-balance').textContent = `${balance} MAS`;
                }
                if (result[2]) {
                    const balance = result[2].candidate_balance || '0';
                    document.getElementById('vault-balance').textContent = `${balance} MAS`;
                }
                
                this.addLog('📊 Contract balances updated');
            }
        } catch (error) {
            this.addLog(`❌ Failed to load contract balances: ${error.message}`);
        }
    }
    
    // Load DEX data
    async loadDEXData() {
        try {
            // Get Reserve A
            const reserveAResult = await this.rpcCall('get_datastore_entries', [[{
                address: this.addresses.dex,
                key: [82, 65] // "RA"
            }]]);
            
            // Get Reserve B
            const reserveBResult = await this.rpcCall('get_datastore_entries', [[{
                address: this.addresses.dex,
                key: [82, 66] // "RB"
            }]]);
            
            let reserveA = 0, reserveB = 0;
            
            if (reserveAResult && reserveAResult[0] && reserveAResult[0].candidate_value) {
                reserveA = this.bytesToNumber(reserveAResult[0].candidate_value);
                document.getElementById('reserve-a').textContent = reserveA.toString();
            }
            
            if (reserveBResult && reserveBResult[0] && reserveBResult[0].candidate_value) {
                reserveB = this.bytesToNumber(reserveBResult[0].candidate_value);
                document.getElementById('reserve-b').textContent = reserveB.toString();
            }
            
            if (reserveA > 0 && reserveB > 0) {
                const price = (reserveB / reserveA).toFixed(4);
                document.getElementById('dex-price').textContent = price;
                document.getElementById('liquidity').textContent = Math.sqrt(reserveA * reserveB).toFixed(2);
                
                this.addLog(`💱 DEX Reserves - A: ${reserveA}, B: ${reserveB}, Price: ${price}`);
            } else {
                document.getElementById('dex-price').textContent = 'No liquidity';
                document.getElementById('liquidity').textContent = '0';
                
                this.addLog('⚠️ DEX has no liquidity');
            }
            
        } catch (error) {
            this.addLog(`❌ Failed to load DEX data: ${error.message}`);
        }
    }
    
    // Load ASC configuration
    async loadASCConfig() {
        try {
            const configResult = await this.rpcCall('get_datastore_entries', [[{
                address: this.addresses.main,
                key: [97, 115, 99, 95, 99, 111, 110, 102, 105, 103] // "asc_config"
            }]]);
            
            if (configResult && configResult[0] && configResult[0].candidate_value) {
                const configBytes = configResult[0].candidate_value;
                const configStr = String.fromCharCode(...configBytes);
                const parts = configStr.split('|');
                
                if (parts.length >= 5) {
                    document.getElementById('exec-interval').textContent = `${parts[0]} seconds`;
                    document.getElementById('max-gas').textContent = parts[1];
                    document.getElementById('auto-exec').textContent = parts[3] === 'true' ? 'Enabled' : 'Disabled';
                    document.getElementById('emergency-stopped').textContent = parts[4] === 'true' ? 'Yes' : 'No';
                    
                    this.addLog(`⚙️ ASC Config: Interval=${parts[0]}s, Auto=${parts[3]}, Stopped=${parts[4]}`);
                }
            }
        } catch (error) {
            this.addLog(`❌ Failed to load ASC config: ${error.message}`);
        }
    }
    
    // Load thread status
    async loadThreadStatus() {
        try {
            const result = await this.rpcCall('get_addresses', [this.addresses.threads]);
            
            if (result) {
                for (let i = 0; i < 3; i++) {
                    const threadEl = document.getElementById(`thread-${i}`);
                    if (result[i] && result[i].candidate_balance) {
                        threadEl.textContent = `Active (${result[i].candidate_balance} MAS)`;
                        threadEl.style.color = 'var(--success)';
                    } else {
                        threadEl.textContent = 'Not deployed';
                        threadEl.style.color = 'var(--error)';
                    }
                }
                
                this.addLog('🔧 Thread status updated');
            }
        } catch (error) {
            this.addLog(`❌ Failed to load thread status: ${error.message}`);
        }
    }
    
    // Helper function to convert bytes to number
    bytesToNumber(bytes) {
        if (!bytes || bytes.length === 0) return 0;
        
        // Try to interpret as string first
        try {
            const str = String.fromCharCode(...bytes);
            const num = parseInt(str);
            if (!isNaN(num)) return num;
        } catch (e) {
            // If string parsing fails, try as little-endian integer
        }
        
        // Interpret as little-endian integer
        let result = 0;
        for (let i = 0; i < Math.min(bytes.length, 8); i++) {
            result += bytes[i] * Math.pow(256, i);
        }
        
        return result;
    }
    
    // Add log entry
    addLog(message) {
        const logContainer = document.getElementById('system-logs');
        const timestamp = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.innerHTML = `
            <span class="log-timestamp">[${timestamp}]</span>
            <span class="log-content">${message}</span>
        `;
        
        logContainer.appendChild(logEntry);
        
        // Keep only last 50 logs
        while (logContainer.children.length > 50) {
            logContainer.removeChild(logContainer.firstChild);
        }
        
        // Auto-scroll to bottom
        logContainer.scrollTop = logContainer.scrollHeight;
        
        // Save to buildnet logs
        this.saveToBuildnetLogs(timestamp, message);
    }
    
    // Save logs to buildnet data storage
    saveToBuildnetLogs(timestamp, message) {
        try {
            const logData = {
                timestamp: new Date().toISOString(),
                localTime: timestamp,
                message: message,
                environment: 'buildnet'
            };
            
            // In a real implementation, this would save to the data/buildnet/ directory
            // For now, we'll use localStorage with a buildnet prefix
            const logs = JSON.parse(localStorage.getItem('buildnet_logs') || '[]');
            logs.push(logData);
            
            // Keep only last 1000 logs
            if (logs.length > 1000) {
                logs.splice(0, logs.length - 1000);
            }
            
            localStorage.setItem('buildnet_logs', JSON.stringify(logs));
        } catch (error) {
            console.error('Failed to save buildnet logs:', error);
        }
    }
    
    // Start auto-refresh
    startAutoRefresh() {
        let countdown = 30;
        
        // Update countdown every second
        this.countdownInterval = setInterval(() => {
            countdown--;
            document.getElementById('refresh-countdown').textContent = countdown;
            
            if (countdown <= 0) {
                countdown = 30;
            }
        }, 1000);
        
        // Refresh data every 30 seconds
        this.refreshTimer = setInterval(() => {
            this.loadAllData();
        }, this.refreshInterval);
    }
    
    // Stop auto-refresh
    stopAutoRefresh() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
    }
}

// Initialize monitor on page load
let monitor;
document.addEventListener('DOMContentLoaded', function() {
    monitor = new BuildnetMonitor();
});

// Action handlers
async function refreshAccountData() {
    monitor.addLog('🔄 Refreshing account data...');
    await monitor.loadAccountData();
}

async function forceCycle() {
    monitor.addLog('🎮 Force cycle not implemented in monitor');
    alert('To force a cycle, use the command line:\nnpm run force-cycle');
}

async function emergencyStop() {
    monitor.addLog('🛑 Emergency stop not implemented in monitor');
    alert('To emergency stop, use the command line:\nnpm run emergency-stop');
}

function updateConfig() {
    monitor.addLog('⚙️ Config update not implemented in monitor');
    alert('Configuration updates must be done through smart contract calls');
}

function clearLogs() {
    const logContainer = document.getElementById('system-logs');
    logContainer.innerHTML = '';
    monitor.addLog('🗑️ Logs cleared');
}

function exportLogs() {
    const logs = document.querySelectorAll('.log-entry');
    let logContent = 'Step1 DeFi System - Buildnet Monitor Log Export\n';
    logContent += `Export Time: ${new Date().toLocaleString()}\n`;
    logContent += '='.repeat(50) + '\n\n';
    
    logs.forEach(log => {
        const timestamp = log.querySelector('.log-timestamp').textContent;
        const content = log.querySelector('.log-content').textContent;
        logContent += `${timestamp} ${content}\n`;
    });
    
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `step1-buildnet-logs-${new Date().toISOString().slice(0, 19)}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    monitor.addLog('📥 Logs exported');
}