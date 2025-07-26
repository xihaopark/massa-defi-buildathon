import React, { useState } from 'react';

interface SystemControlsProps {
  onRefresh: () => Promise<void>;
  onForceUpdate: () => Promise<void>;
  isLoading: boolean;
}

const SystemControls: React.FC<SystemControlsProps> = ({ 
  onRefresh, 
  onForceUpdate, 
  isLoading 
}) => {
  const [isForceUpdating, setIsForceUpdating] = useState(false);

  const handleForceUpdate = async () => {
    setIsForceUpdating(true);
    try {
      await onForceUpdate();
    } catch (error) {
      console.error('Force update failed:', error);
    } finally {
      setIsForceUpdating(false);
    }
  };

  return (
    <div className="panel">
      <h2>🎮 System Controls</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>
          Monitor and interact with the autonomous Step1 DeFi system.
        </p>
      </div>

      <div className="controls">
        <button 
          className="btn" 
          onClick={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span style={{ marginRight: '8px' }}>🔄</span>
              Refreshing...
            </>
          ) : (
            <>
              <span style={{ marginRight: '8px' }}>🔄</span>
              Refresh Data
            </>
          )}
        </button>

        <button 
          className="btn secondary" 
          onClick={handleForceUpdate}
          disabled={isForceUpdating || isLoading}
        >
          {isForceUpdating ? (
            <>
              <span style={{ marginRight: '8px' }}>⚡</span>
              Updating...
            </>
          ) : (
            <>
              <span style={{ marginRight: '8px' }}>⚡</span>
              Force Cycle
            </>
          )}
        </button>
      </div>

      {/* System Information */}
      <div style={{ marginTop: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
        <h4 style={{ marginBottom: '15px', fontSize: '1rem', color: '#2a5298' }}>
          🤖 Autonomous Operation
        </h4>
        
        <div style={{ fontSize: '0.9rem', color: '#555', lineHeight: '1.6' }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>🔄 Auto-Refresh:</strong> Data updates every 5 seconds
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>⏰ Cycle Interval:</strong> ~10 Massa slots (≈32 seconds)
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>🧠 HMM States:</strong> BULL, BEAR, SIDEWAYS
          </div>
          <div>
            <strong>📊 Decisions:</strong> BUY, SELL, REBALANCE, NO_ACTION
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div style={{ marginTop: '20px', padding: '20px', background: '#e8f4f8', borderRadius: '8px' }}>
        <h4 style={{ marginBottom: '15px', fontSize: '1rem', color: '#1565c0' }}>
          ⚙️ Technical Architecture
        </h4>
        
        <div style={{ fontSize: '0.85rem', color: '#0d47a1', lineHeight: '1.5' }}>
          <div style={{ marginBottom: '8px' }}>
            <strong>Multi-Threading:</strong> 3 parallel observation contracts
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Attention Mechanism:</strong> Dynamic weight assignment
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>HMM Processing:</strong> Market regime detection
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>ASC Scheduling:</strong> Self-executing smart contracts
          </div>
          <div>
            <strong>DeWeb Hosting:</strong> Fully on-chain frontend
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div style={{ marginTop: '20px', padding: '20px', background: '#f3e5f5', borderRadius: '8px' }}>
        <h4 style={{ marginBottom: '15px', fontSize: '1rem', color: '#7b1fa2' }}>
          📈 Performance Features
        </h4>
        
        <div style={{ fontSize: '0.85rem', color: '#4a148c', lineHeight: '1.5' }}>
          <div style={{ marginBottom: '8px' }}>
            <strong>Zero Downtime:</strong> Autonomous execution without external triggers
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>No Middlemen:</strong> Direct blockchain execution (no Gelato/Chainlink)
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Gas Optimization:</strong> Efficient fixed-point arithmetic
          </div>
          <div>
            <strong>Fault Tolerance:</strong> Individual thread failure resistance
          </div>
        </div>
      </div>

      {/* Warning Note */}
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        background: '#fff3e0', 
        borderRadius: '8px',
        border: '1px solid #ffb74d' 
      }}>
        <div style={{ fontSize: '0.85rem', color: '#e65100' }}>
          <strong>⚠️ Important:</strong> This system operates autonomously on Massa blockchain. 
          Force cycle should only be used for testing purposes during development.
        </div>
      </div>
    </div>
  );
};

export default SystemControls;