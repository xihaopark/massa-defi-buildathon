import React, { useState, useEffect } from 'react';
import SystemStatus from './components/SystemStatus';
import AttentionWeights from './components/AttentionWeights';
import DecisionLog from './components/DecisionLog';
import SystemControls from './components/SystemControls';
import { initializeMassaClient, getSystemData } from './utils/massaClient';
import type { SystemData } from './types';

function App() {
  const [systemData, setSystemData] = useState<SystemData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Initialize Massa client
        await initializeMassaClient();
        setIsConnected(true);
        
        // Fetch initial data
        const data = await getSystemData();
        setSystemData(data);
        
        // Set up polling interval
        interval = setInterval(async () => {
          try {
            const updatedData = await getSystemData();
            setSystemData(updatedData);
          } catch (err) {
            console.error('Failed to update system data:', err);
          }
        }, 5000); // Update every 5 seconds
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize system');
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      const data = await getSystemData();
      setSystemData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !systemData) {
    return (
      <div className="container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Initializing Step1 DeFi System...</p>
        </div>
      </div>
    );
  }

  if (error && !systemData) {
    return (
      <div className="container">
        <div className="error-state">
          <h3>Connection Error</h3>
          <p>{error}</p>
          <button className="btn" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Step1 DeFi System</h1>
        <p>Multi-threaded Intelligent Decision System on Massa Blockchain</p>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          <div className="status-dot"></div>
          {isConnected ? 'Connected to Massa Network' : 'Disconnected'}
        </div>
      </header>

      <main className="dashboard">
        <SystemStatus 
          data={systemData} 
          isLoading={isLoading}
        />
        
        <AttentionWeights 
          data={systemData?.attentionWeights || []}
          isLoading={isLoading}
        />
        
        <DecisionLog 
          decisions={systemData?.decisions || []}
          isLoading={isLoading}
        />
        
        <SystemControls 
          onRefresh={handleRefresh}
          onForceUpdate={async () => {
            // Implementation for force update
            console.log('Force update triggered');
          }}
          isLoading={isLoading}
        />
      </main>

      <footer style={{ 
        textAlign: 'center', 
        padding: '20px', 
        color: 'rgba(255,255,255,0.7)',
        fontSize: '0.9rem' 
      }}>
        <p>Powered by Massa Blockchain • Deployed on DeWeb • Built for AKINDO x Massa Buildathon</p>
      </footer>
    </div>
  );
}

export default App;