import React, { useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import type { AttentionWeight } from '../types';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface AttentionWeightsProps {
  data: AttentionWeight[];
  isLoading: boolean;
}

const AttentionWeights: React.FC<AttentionWeightsProps> = ({ data, isLoading }) => {
  const chartRef = useRef<ChartJS<"doughnut"> | null>(null);

  useEffect(() => {
    // Update chart when data changes
    if (chartRef.current) {
      chartRef.current.update();
    }
  }, [data]);

  if (isLoading && data.length === 0) {
    return (
      <div className="panel">
        <h2>Attention Weights</h2>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading attention weights...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="panel">
        <h2>🧠 Attention Weights</h2>
        <div className="error-state">
          <p>No attention weight data available</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const colors = [
    '#FF6384',
    '#36A2EB', 
    '#FFCE56',
    '#4BC0C0',
    '#9966FF',
    '#FF9F40'
  ];

  const doughnutData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        data: data.map(item => (item.weight * 100).toFixed(1)),
        backgroundColor: colors.slice(0, data.length),
        borderColor: colors.slice(0, data.length).map(color => color + '80'),
        borderWidth: 2,
        hoverOffset: 4
      }
    ]
  };

  const barData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        label: 'Attention Weight (%)',
        data: data.map(item => (item.weight * 100).toFixed(1)),
        backgroundColor: colors.slice(0, data.length).map(color => color + '60'),
        borderColor: colors.slice(0, data.length),
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.parsed}%`;
          }
        }
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Weight: ${context.parsed.y}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Weight (%)'
        }
      }
    }
  };

  return (
    <div className="panel">
      <h2>🧠 Attention Mechanism</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>
          Dynamic weights assigned to each observation thread based on relevance and signal strength.
        </p>
        
        {/* Weight summary */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
          {data.map((item, index) => (
            <div key={item.threadId} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: colors[index] + '20',
              borderRadius: '20px',
              border: `2px solid ${colors[index]}40`,
              fontSize: '0.9rem'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: colors[index]
              }}></div>
              <span><strong>{item.label}:</strong> {(item.weight * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart container */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px', 
        maxWidth: '100%'
      }}>
        <div style={{ height: 300, width: '90%', margin: '0 auto', minWidth: 0 }}>
          <h4 style={{ textAlign: 'center', marginBottom: '10px', fontSize: '0.9rem' }}>
            Distribution View
          </h4>
          <Doughnut 
            data={doughnutData} 
            options={chartOptions}
            height={250}
          />
        </div>
        <div style={{ height: 300, width: '90%', margin: '0 auto', minWidth: 0 }}>
          <h4 style={{ textAlign: 'center', marginBottom: '10px', fontSize: '0.9rem' }}>
            Comparison View
          </h4>
          <Bar 
            data={barData} 
            options={barOptions}
            height={250}
          />
        </div>
      </div>

      {/* Technical details */}
      <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
        <h4 style={{ marginBottom: '10px', fontSize: '0.9rem' }}>Attention Mechanism Details</h4>
        <div style={{ fontSize: '0.8rem', color: '#666' }}>
          <p>• Weights are computed using softmax normalization of observation scores</p>
          <p>• Higher weights indicate greater relevance to current market conditions</p>
          <p>• Weights are recalculated every autonomous cycle (~10 slots)</p>
          <p>• Total weight sum always equals 100%</p>
        </div>
      </div>
    </div>
  );
};

export default AttentionWeights;