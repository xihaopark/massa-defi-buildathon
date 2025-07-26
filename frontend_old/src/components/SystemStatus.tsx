import React from 'react';
import type { SystemData } from '../types';

interface SystemStatusProps {
  data: SystemData | null;
  isLoading: boolean;
}

const SystemStatus: React.FC<SystemStatusProps> = ({ data, isLoading }) => {
  if (isLoading && !data) {
    return (
      <div className="panel">
        <h2>System Status</h2>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading system status...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="panel">
        <h2>System Status</h2>
        <div className="error-state">
          <p>No system data available</p>
        </div>
      </div>
    );
  }

  const { status } = data;
  const lastUpdateTime = new Date(status.lastUpdate).toLocaleTimeString();

  return (
    <div className="panel">
      <h2>🎯 System Status</h2>
      
      <div className="status-grid">
        <div className="status-item">
          <div className="status-label">System State</div>
          <div className="status-value">{status.state}</div>
        </div>
        
        <div className="status-item">
          <div className="status-label">Cycles</div>
          <div className="status-value">{status.cycleCount}</div>
        </div>
        
        <div className="status-item">
          <div className="status-label">Decisions</div>
          <div className="status-value">{status.decisionCount}</div>
        </div>
        
        <div className="status-item">
          <div className="status-label">Last Update</div>
          <div className="status-value" style={{ fontSize: '0.9rem' }}>
            {lastUpdateTime}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <div className="status-label">Current Market State</div>
        <div className={`market-state ${status.currentMarketState.toLowerCase()}`}>
          {status.currentMarketState} Market
        </div>
      </div>

      {data.contractAddresses && (
        <div style={{ marginTop: '20px' }}>
          <div className="status-label">Contract Addresses</div>
          <div style={{ fontSize: '0.8rem', color: '#666', wordBreak: 'break-all' }}>
            <div><strong>Main Controller:</strong></div>
            <div style={{ marginBottom: '8px', fontFamily: 'monospace' }}>
              {data.contractAddresses.mainController}
            </div>
            <div><strong>Observation Threads:</strong></div>
            {data.contractAddresses.observationThreads.map((address, index) => (
              <div key={index} style={{ fontFamily: 'monospace', marginBottom: '4px' }}>
                Thread {index}: {address}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.observations && data.observations.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <div className="status-label">Thread Observations</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.observations.map((obs) => (
              <div key={obs.threadId} style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '8px',
                background: '#f8f9fa',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}>
                <span><strong>{obs.label}:</strong></span>
                <span>
                  {obs.value} 
                  <span style={{ color: '#666', marginLeft: '8px' }}>
                    ({obs.confidence.toFixed(0)}% confidence)
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemStatus;