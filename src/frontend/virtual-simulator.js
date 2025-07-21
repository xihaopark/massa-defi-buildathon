// Virtual Market Simulator - Synthetic Data for Algorithm Testing

class VirtualMarketSimulator {
    constructor() {
        this.isRunning = false;
        this.simulationSpeed = 1; // 1x real time
        this.portfolio = {
            totalValue: 10000,
            masHoldings: 5000,
            usdcHoldings: 5000,
            pnl24h: 0
        };
        
        this.marketData = {
            price: 1.0000,
            priceHistory: [],
            volume24h: 0,
            change24h: 0,
            volatility: 0.02, // 2% volatility
            marketState: 'SIDEWAYS'
        };
        
        this.tradingEngine = {
            status: 'RUNNING',
            currentSignal: 'HOLD',
            confidence: 50,
            nextDecision: 30,
            totalTrades: 0,
            winRate: 0,
            avgTradeSize: 0,
            lastTradeTime: Date.now()
        };
        
        this.riskManagement = {
            maxPosition: 25, // 25%
            stopLoss: 5, // 5%
            riskScore: 'Medium',
            maxDrawdown: 0
        };
        
        // Initialize price history with 50 points
        this.initializePriceHistory();
        
        this.updateInterval = null;
        this.decisionInterval = null;
        
        this.init();
    }
    
    async init() {
        this.addLog('🚀 Initializing virtual market simulator...');
        this.updateDisplay();
        this.startSimulation();
        this.addLog('✅ Virtual market simulator active');
        this.addLog('📊 Using synthetic market data for algorithm testing');
    }
    
    initializePriceHistory() {
        const basePrice = 1.0000;
        for (let i = 0; i < 50; i++) {
            const randomWalk = (Math.random() - 0.5) * 0.02; // ±1% random walk
            const price = Math.max(0.8, Math.min(1.2, basePrice + randomWalk * i * 0.1));
            this.marketData.priceHistory.push(price);
        }
        this.marketData.price = this.marketData.priceHistory[this.marketData.priceHistory.length - 1];
    }
    
    startSimulation() {
        if (this.updateInterval) clearInterval(this.updateInterval);
        if (this.decisionInterval) clearInterval(this.decisionInterval);
        
        this.isRunning = true;
        
        // Update market data every 5 seconds
        this.updateInterval = setInterval(() => {
            this.updateMarketData();
            this.updateDisplay();
            this.saveMarketSnapshot(); // Save data snapshots
        }, 5000 / this.simulationSpeed);
        
        // AI decision every 30 seconds
        this.decisionInterval = setInterval(() => {
            this.makeAIDecision();
        }, 30000 / this.simulationSpeed);
        
        // Update next decision countdown
        this.startDecisionCountdown();
    }
    
    stopSimulation() {
        if (this.updateInterval) clearInterval(this.updateInterval);
        if (this.decisionInterval) clearInterval(this.decisionInterval);
        this.isRunning = false;
    }
    
    updateMarketData() {
        // Simulate realistic market movements
        const volatility = this.marketData.volatility;
        const randomChange = (Math.random() - 0.5) * volatility * 2;
        const trendFactor = this.getTrendFactor();
        
        const newPrice = Math.max(0.5, Math.min(2.0, 
            this.marketData.price * (1 + randomChange + trendFactor)
        ));
        
        // Update price history
        this.marketData.priceHistory.push(newPrice);
        if (this.marketData.priceHistory.length > 100) {
            this.marketData.priceHistory.shift();
        }
        
        // Calculate 24h change
        const price24hAgo = this.marketData.priceHistory[Math.max(0, this.marketData.priceHistory.length - 20)];
        this.marketData.change24h = ((newPrice - price24hAgo) / price24hAgo) * 100;
        
        this.marketData.price = newPrice;
        this.marketData.volume24h = 80000 + Math.random() * 90000; // $80k - $170k
        
        // Update market state
        this.updateMarketState();
        
        // Update chart
        this.updatePriceChart();
        
        this.addLog(`📈 Price updated: $${newPrice.toFixed(4)} (${this.marketData.change24h > 0 ? '+' : ''}${this.marketData.change24h.toFixed(2)}%)`);
    }
    
    getTrendFactor() {
        // Add some trending behavior
        const time = Date.now() / 1000;
        const trendCycle = Math.sin(time / 300) * 0.001; // 5-minute trend cycles
        const momentum = this.marketData.change24h * 0.0001; // Momentum effect
        return trendCycle + momentum;
    }
    
    updateMarketState() {
        const change = this.marketData.change24h;
        const volatility = this.calculateVolatility();
        
        if (volatility > 0.05) {
            this.marketData.marketState = 'HIGH_VOLATILITY';
        } else if (change > 3) {
            this.marketData.marketState = 'TRENDING_UP';
        } else if (change < -3) {
            this.marketData.marketState = 'TRENDING_DOWN';
        } else if (Math.abs(change) > 1.5) {
            this.marketData.marketState = 'BREAKOUT';
        } else {
            this.marketData.marketState = 'SIDEWAYS';
        }
    }
    
    calculateVolatility() {
        if (this.marketData.priceHistory.length < 10) return 0.02;
        
        const recent = this.marketData.priceHistory.slice(-10);
        const returns = [];
        for (let i = 1; i < recent.length; i++) {
            returns.push((recent[i] - recent[i-1]) / recent[i-1]);
        }
        
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
        return Math.sqrt(variance);
    }
    
    makeAIDecision() {
        const state = this.marketData.marketState;
        const price = this.marketData.price;
        const change = this.marketData.change24h;
        
        let signal = 'HOLD';
        let confidence = 50;
        
        // Simple decision logic based on market state
        switch (state) {
            case 'TRENDING_UP':
                signal = Math.random() > 0.3 ? 'BUY_SIGNAL' : 'HOLD';
                confidence = 60 + Math.random() * 25;
                break;
            case 'TRENDING_DOWN':
                signal = Math.random() > 0.3 ? 'SELL_SIGNAL' : 'HOLD';
                confidence = 60 + Math.random() * 25;
                break;
            case 'BREAKOUT':
                signal = change > 0 ? 'STRONG_BUY' : 'STRONG_SELL';
                confidence = 75 + Math.random() * 20;
                break;
            case 'HIGH_VOLATILITY':
                signal = 'WAIT';
                confidence = 40 + Math.random() * 20;
                break;
            default:
                signal = 'HOLD';
                confidence = 45 + Math.random() * 15;
        }
        
        this.tradingEngine.currentSignal = signal;
        this.tradingEngine.confidence = Math.round(confidence);
        
        // Execute trade if signal is strong enough
        if (confidence > 70 && signal !== 'HOLD' && signal !== 'WAIT') {
            this.executeTrade(signal, confidence);
        }
        
        this.addLog(`🤖 AI Decision: ${signal} (Confidence: ${Math.round(confidence)}%, State: ${state})`);
    }
    
    executeTrade(signal, confidence) {
        const tradeSize = Math.min(this.portfolio.totalValue * 0.1, // Max 10% per trade
                                 (confidence - 50) * this.portfolio.totalValue * 0.004); // Scale with confidence
        
        let masChange = 0;
        let usdcChange = 0;
        const currentPrice = this.marketData.price;
        
        // Simulate slippage and fees
        const slippage = 0.001; // 0.1%
        const fees = 0.0025; // 0.25%
        const effectivePrice = signal.includes('BUY') ? 
            currentPrice * (1 + slippage + fees) : 
            currentPrice * (1 - slippage - fees);
        
        if (signal.includes('BUY') && this.portfolio.usdcHoldings >= tradeSize) {
            masChange = tradeSize / effectivePrice;
            usdcChange = -tradeSize;
        } else if (signal.includes('SELL') && this.portfolio.masHoldings * effectivePrice >= tradeSize) {
            masChange = -tradeSize / effectivePrice;
            usdcChange = tradeSize;
        }
        
        if (masChange !== 0) {
            this.portfolio.masHoldings += masChange;
            this.portfolio.usdcHoldings += usdcChange;
            
            this.tradingEngine.totalTrades++;
            this.tradingEngine.lastTradeTime = Date.now();
            
            // Simulate win/loss (70% win rate for demonstration)
            const isWin = Math.random() > 0.3;
            if (isWin) {
                this.tradingEngine.winRate = ((this.tradingEngine.winRate * (this.tradingEngine.totalTrades - 1)) + 100) / this.tradingEngine.totalTrades;
            } else {
                this.tradingEngine.winRate = (this.tradingEngine.winRate * (this.tradingEngine.totalTrades - 1)) / this.tradingEngine.totalTrades;
            }
            
            this.tradingEngine.avgTradeSize = ((this.tradingEngine.avgTradeSize * (this.tradingEngine.totalTrades - 1)) + Math.abs(usdcChange)) / this.tradingEngine.totalTrades;
            
            this.addLog(`💰 Trade executed: ${signal} - ${Math.abs(masChange).toFixed(2)} MAS at $${effectivePrice.toFixed(4)}`);
        }
    }
    
    updatePortfolioValue() {
        const currentPrice = this.marketData.price;
        this.portfolio.totalValue = this.portfolio.masHoldings * currentPrice + this.portfolio.usdcHoldings;
        
        // Calculate 24h P&L (simplified)
        const initialValue = 10000;
        this.portfolio.pnl24h = this.portfolio.totalValue - initialValue;
    }
    
    startDecisionCountdown() {
        let countdown = 30;
        const countdownInterval = setInterval(() => {
            countdown--;
            document.getElementById('next-decision').textContent = `${countdown}s`;
            
            if (countdown <= 0) {
                countdown = 30;
            }
        }, 1000 / this.simulationSpeed);
    }
    
    updateDisplay() {
        this.updatePortfolioValue();
        
        // Portfolio
        document.getElementById('portfolio-value').textContent = `$${this.portfolio.totalValue.toFixed(2)}`;
        document.getElementById('mas-holdings').textContent = `${this.portfolio.masHoldings.toFixed(1)} MAS`;
        document.getElementById('usdc-holdings').textContent = `${this.portfolio.usdcHoldings.toFixed(1)} USDC`;
        document.getElementById('pnl-24h').textContent = 
            `${this.portfolio.pnl24h >= 0 ? '+' : ''}$${this.portfolio.pnl24h.toFixed(2)}`;
        
        // Market data
        document.getElementById('mas-price').textContent = `$${this.marketData.price.toFixed(4)}`;
        document.getElementById('price-change').textContent = 
            `${this.marketData.change24h >= 0 ? '+' : ''}${this.marketData.change24h.toFixed(2)}%`;
        document.getElementById('volume-24h').textContent = `$${Math.round(this.marketData.volume24h).toLocaleString()}`;
        document.getElementById('market-state').textContent = this.marketData.marketState;
        
        // AI Engine
        document.getElementById('algo-status').textContent = this.isRunning ? 'RUNNING' : 'STOPPED';
        document.getElementById('current-signal').textContent = this.tradingEngine.currentSignal;
        document.getElementById('confidence').textContent = `${this.tradingEngine.confidence}%`;
        
        // Trading performance
        document.getElementById('total-trades').textContent = this.tradingEngine.totalTrades.toString();
        document.getElementById('win-rate').textContent = `${this.tradingEngine.winRate.toFixed(1)}%`;
        document.getElementById('avg-trade-size').textContent = `$${this.tradingEngine.avgTradeSize.toFixed(2)}`;
        
        const lastTradeAgo = Math.floor((Date.now() - this.tradingEngine.lastTradeTime) / 1000);
        document.getElementById('last-trade').textContent = lastTradeAgo < 60 ? `${lastTradeAgo}s ago` : `${Math.floor(lastTradeAgo/60)}m ago`;
        
        // Risk management
        document.getElementById('max-position').textContent = `${this.riskManagement.maxPosition}%`;
        document.getElementById('stop-loss').textContent = `${this.riskManagement.stopLoss}%`;
        document.getElementById('risk-score').textContent = this.riskManagement.riskScore;
        document.getElementById('max-drawdown').textContent = `${this.riskManagement.maxDrawdown.toFixed(1)}%`;
        
        // Simulation settings
        document.getElementById('sim-speed').textContent = `${this.simulationSpeed}x`;
        document.getElementById('volatility').textContent = 'Medium';
        document.getElementById('data-feed').textContent = 'Synthetic';
        document.getElementById('auto-refresh').textContent = '5s';
    }
    
    updatePriceChart() {
        const svg = document.getElementById('price-chart');
        const width = svg.clientWidth || 350;
        const height = svg.clientHeight || 200;
        
        const data = this.marketData.priceHistory.slice(-50);
        const maxPrice = Math.max(...data);
        const minPrice = Math.min(...data);
        const priceRange = maxPrice - minPrice || 0.01;
        
        // Create line path
        let pathData = '';
        data.forEach((price, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((price - minPrice) / priceRange) * height;
            pathData += (i === 0 ? 'M' : 'L') + ` ${x} ${y}`;
        });
        
        // Create area path
        let areaData = pathData + ` L ${width} ${height} L 0 ${height} Z`;
        
        svg.innerHTML = `
            <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:var(--virtual);stop-opacity:0.3" />
                    <stop offset="100%" style="stop-color:var(--virtual);stop-opacity:0" />
                </linearGradient>
            </defs>
            <path class="chart-area" d="${areaData}" />
            <path class="chart-line" d="${pathData}" />
        `;
    }
    
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
        
        // Save to virtual logs
        this.saveToVirtualLogs(timestamp, message);
    }
    
    // Save logs to virtual data storage
    saveToVirtualLogs(timestamp, message) {
        try {
            const logData = {
                timestamp: new Date().toISOString(),
                localTime: timestamp,
                message: message,
                environment: 'virtual',
                simulationTime: this.simulationSpeed
            };
            
            // In a real implementation, this would save to the data/virtual/ directory
            // For now, we'll use localStorage with a virtual prefix
            const logs = JSON.parse(localStorage.getItem('virtual_logs') || '[]');
            logs.push(logData);
            
            // Keep only last 1000 logs
            if (logs.length > 1000) {
                logs.splice(0, logs.length - 1000);
            }
            
            localStorage.setItem('virtual_logs', JSON.stringify(logs));
        } catch (error) {
            console.error('Failed to save virtual logs:', error);
        }
    }
    
    // Save market data snapshots
    saveMarketSnapshot() {
        try {
            const snapshot = {
                timestamp: new Date().toISOString(),
                price: this.marketData.price,
                volume24h: this.marketData.volume24h,
                change24h: this.marketData.change24h,
                marketState: this.marketData.marketState,
                portfolio: { ...this.portfolio },
                tradingEngine: { ...this.tradingEngine }
            };
            
            const snapshots = JSON.parse(localStorage.getItem('virtual_market_snapshots') || '[]');
            snapshots.push(snapshot);
            
            // Keep only last 500 snapshots
            if (snapshots.length > 500) {
                snapshots.splice(0, snapshots.length - 500);
            }
            
            localStorage.setItem('virtual_market_snapshots', JSON.stringify(snapshots));
        } catch (error) {
            console.error('Failed to save market snapshot:', error);
        }
    }
}

// Initialize simulator on page load
let simulator;
document.addEventListener('DOMContentLoaded', function() {
    simulator = new VirtualMarketSimulator();
});

// Action handlers
function resetPortfolio() {
    simulator.portfolio = {
        totalValue: 10000,
        masHoldings: 5000,
        usdcHoldings: 5000,
        pnl24h: 0
    };
    simulator.addLog('💰 Portfolio reset to initial state');
    simulator.updateDisplay();
}

function toggleAlgorithm() {
    if (simulator.isRunning) {
        simulator.stopSimulation();
        simulator.addLog('⏸️ Algorithm paused');
    } else {
        simulator.startSimulation();
        simulator.addLog('▶️ Algorithm resumed');
    }
}

function forceDecision() {
    simulator.makeAIDecision();
    simulator.addLog('🎮 Forced algorithm decision');
}

function updateRiskSettings() {
    simulator.addLog('⚙️ Risk settings update not implemented in simulator');
    alert('Risk settings can be modified in the full implementation');
}

function exportResults() {
    const results = {
        portfolio: simulator.portfolio,
        marketData: simulator.marketData,
        tradingEngine: simulator.tradingEngine,
        timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `step1-simulation-results-${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    simulator.addLog('📥 Simulation results exported');
}

function resetSimulation() {
    if (confirm('Are you sure you want to reset the entire simulation?')) {
        simulator.stopSimulation();
        simulator = new VirtualMarketSimulator();
        simulator.addLog('🔄 Simulation completely reset');
    }
}

function clearLogs() {
    const logContainer = document.getElementById('system-logs');
    logContainer.innerHTML = '';
    simulator.addLog('🗑️ Logs cleared');
}

function exportLogs() {
    const logs = document.querySelectorAll('.log-entry');
    let logContent = 'Step1 DeFi System - Virtual Market Simulator Log Export\n';
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
    a.download = `step1-virtual-logs-${new Date().toISOString().slice(0, 19)}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    simulator.addLog('📥 Logs exported');
}