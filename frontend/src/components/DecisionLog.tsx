import React from 'react';
import type { Decision } from '../types';

interface DecisionLogProps {
  decisions: Decision[];
  isLoading: boolean;
}

const DecisionLog: React.FC<DecisionLogProps> = ({ decisions, isLoading }) => {
  if (isLoading && decisions.length === 0) {
    return (
      <div className="panel">
        <h2>Decision Log</h2>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading decision history...</p>
        </div>
      </div>
    );
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'BUY_SIGNAL': return '📈';
      case 'SELL_SIGNAL': return '📉';
      case 'REBALANCE': return '⚖️';
      default: return '⏸️';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY_SIGNAL': return '#4caf50';
      case 'SELL_SIGNAL': return '#f44336';
      case 'REBALANCE': return '#ff9800';
      default: return '#666';
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'BULL': return '#4caf50';
      case 'BEAR': return '#f44336';
      case 'SIDEWAYS': return '#ff9800';
      default: return '#666';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
      time: date.toLocaleTimeString(),
      date: date.toLocaleDateString()
    };
  };

  return (
    <div className="panel">
      <h2>📋 Decision History</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>
          Autonomous decisions made by the HMM + Attention system based on market state analysis.
        </p>
      </div>

      {decisions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>No decisions recorded yet.</p>
          <p style={{ fontSize: '0.9rem' }}>
            The system will start making decisions once autonomous cycles begin.
          </p>
        </div>
      ) : (
        <div className="log-container">
          {decisions.map((decision, index) => {
            const { time, date } = formatTimestamp(decision.timestamp);
            
            return (
              <div key={index} className="log-entry" style={{
                borderLeft: `4px solid ${getActionColor(decision.action)}`,
                paddingLeft: '15px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>
                      {getActionIcon(decision.action)}
                    </span>
                    <div>
                      <div style={{ 
                        fontWeight: 'bold', 
                        color: getActionColor(decision.action),
                        fontSize: '0.9rem'
                      }}>
                        {decision.action.replace('_', ' ')}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        Cycle #{decision.cycleNumber}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                    <div style={{ 
                      color: getStateColor(decision.state),
                      fontWeight: 'bold',
                      marginBottom: '2px'
                    }}>
                      {decision.state}
                    </div>
                    <div className="log-timestamp">
                      {time}
                    </div>
                    <div style={{ color: '#999', fontSize: '0.7rem' }}>
                      {date}
                    </div>
                  </div>
                </div>
                
                <div className="log-message" style={{ 
                  fontSize: '0.9rem',
                  lineHeight: '1.4',
                  color: '#333'
                }}>
                  {decision.description}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Decision statistics */}
      {decisions.length > 0 && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
          <h4 style={{ marginBottom: '10px', fontSize: '0.9rem' }}>Decision Statistics</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px' }}>
            {['BUY_SIGNAL', 'SELL_SIGNAL', 'REBALANCE', 'NO_ACTION'].map(action => {
              const count = decisions.filter(d => d.action === action).length;
              const percentage = decisions.length > 0 ? ((count / decisions.length) * 100).toFixed(1) : '0';
              
              return (
                <div key={action} style={{ textAlign: 'center' }}>
                  <div style={{ 
                    color: getActionColor(action), 
                    fontWeight: 'bold',
                    fontSize: '1.2rem'
                  }}>
                    {count}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    {action.replace('_', ' ')}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#999' }}>
                    {percentage}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DecisionLog;