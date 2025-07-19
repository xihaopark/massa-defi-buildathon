# Step1 DeFi System 🚀

*Multi-threaded Intelligent DeFi Decision System on Massa Blockchain*

**Built for AKINDO x Massa Buildathon Wave 1**

---

## 🎯 Project Overview

**Step1** is a revolutionary DeFi system that leverages Massa blockchain's unique capabilities to create a fully autonomous, intelligent decision-making platform. Using multi-threaded observation contracts, Hidden Markov Models (HMM), and Attention mechanisms, Step1 represents the future of decentralized finance—where your DeFi applications truly run themselves.

### 🔥 Key Innovation
- **Zero External Dependencies**: No Gelato, no Chainlink—pure blockchain autonomy
- **Multi-threaded Intelligence**: Parallel observation processing for real-time market analysis
- **Attention-based Decision Making**: Dynamic weight assignment to market signals
- **Complete On-chain Hosting**: Frontend deployed on Massa DeWeb

## 🏗 System Architecture

### Core Components

1. **🔗 Observation Threads** (Multi-contract parallel processing)
   - Independent monitoring of market indicators
   - Real-time data collection and confidence scoring
   - Fault-tolerant design with individual thread autonomy

2. **🧠 Main Controller** (HMM + Attention Engine)
   - Hidden Markov Model for market regime detection
   - Attention mechanism for multi-source data fusion
   - Autonomous decision execution based on state analysis

3. **⚡ Autonomous Execution**
   - Self-scheduling smart contracts (ASC)
   - Periodic cycle execution every ~10 Massa slots
   - Zero-downtime operation without external triggers

4. **🌐 DeWeb Frontend**
   - Fully decentralized web interface
   - Real-time visualization of system states
   - Complete on-chain hosting via Massa DeWeb

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- Massa wallet with testnet MAS tokens
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/xihaopark/massa-defi-buildathon.git
cd massa-defi-buildathon

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your wallet secret key
```

### Smart Contract Deployment

```bash
# Build contracts
npm run build

# Deploy to Massa Buildnet
npm run deploy
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### DeWeb Deployment

```bash
cd frontend
npm run build
npx @massalabs/deweb-cli upload dist --domain step1.massa
```

## 📊 System Features

### Market Intelligence
- **🐂 Bull Market Detection**: Automated buy signals during uptrends
- **🐻 Bear Market Identification**: Smart sell signals in downtrends  
- **📈 Sideways Market Management**: Portfolio rebalancing strategies

### Attention Mechanism
- **Dynamic Weight Assignment**: Real-time adjustment of thread importance
- **Signal Quality Assessment**: Confidence-based decision weighting
- **Multi-source Fusion**: Intelligent combination of diverse market signals

### Autonomous Operations
- **Self-executing Cycles**: No manual intervention required
- **Gas-optimized Processing**: Efficient fixed-point arithmetic
- **Resilient Architecture**: Individual thread failure tolerance

## 🎮 Usage Guide

### Monitoring System Status
The frontend provides real-time insights into:
- Current market state (BULL/BEAR/SIDEWAYS)
- Attention weight distribution across threads
- Decision history and system performance
- Thread observation values and confidence levels

### Interacting with Contracts
```javascript
// Get system status
const status = await mainController.read('getSystemStatus', new Args());

// Force a cycle update (testing)
await mainController.call('forceUpdate', new Args());

// Get thread observations
const threadState = await observationThread.read('getThreadState', new Args());
```

## 🔧 Technical Implementation

### Smart Contracts
- **Language**: AssemblyScript for Massa blockchain
- **Architecture**: Modular design with separate contracts
- **Storage**: Efficient on-chain state management
- **Events**: Comprehensive logging for transparency

### Data Structures
```typescript
// Market states
enum MarketState { BULL, BEAR, SIDEWAYS }

// Thread observations with confidence scoring
class ThreadState {
  value: i64;
  timestamp: u64;
  confidence: u32;
}

// Attention weights for decision fusion
class AttentionWeights {
  weights: Map<u8, u32>; // Fixed-point representation
}
```

### Algorithms
- **HMM State Transition**: Probabilistic market regime detection
- **Attention Computation**: Softmax-normalized weight assignment
- **Decision Logic**: State-based action determination

## 🚀 Future Roadmap

### Phase 2: Advanced Features
- **Multi-asset Support**: Extend beyond single market analysis
- **Custom Strategies**: User-configurable decision parameters
- **Risk Management**: Advanced position sizing and stop-loss
- **Yield Optimization**: Automated liquidity provision strategies

### Phase 3: Ecosystem Integration
- **Cross-chain Bridges**: Multi-blockchain observation threads
- **DeFi Protocol Integration**: Direct DEX and lending platform interaction
- **Community Governance**: Decentralized parameter adjustment
- **Plugin Architecture**: Third-party strategy development

## 📄 License

MIT License - Built for AKINDO x Massa Buildathon

---

**Built with ❤️ for the decentralized future**

*Step1 - Where DeFi Applications Run Themselves*
