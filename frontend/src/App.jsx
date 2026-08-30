import { useEffect, useState } from 'react';
import axiosClient from './api/axiosClient';

// Phase 1 goal: prove the full stack is wired together correctly
// (React -> Express -> MongoDB) before any real feature is built.
// This will be replaced by proper routing (react-router-dom) once
// pages exist in Phase 2+.
function App() {
  const [status, setStatus] = useState('loading'); // 'loading' | 'connected' | 'error'
  const [details, setDetails] = useState(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await axiosClient.get('/health');
        setDetails(response.data);
        setStatus('connected');
      } catch (error) {
        setDetails({ message: error.message });
        setStatus('error');
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="app-shell">
      <div className="status-card">
        <h1>Clothing Exchange & Swap Marketplace</h1>
        <p>Phase 1 — Scaffolding</p>

        <p>
          <span className={`status-dot ${status}`} />
          {status === 'loading' && 'Checking backend connection…'}
          {status === 'connected' && 'Backend + database connected'}
          {status === 'error' && 'Could not reach backend'}
        </p>

        {details && (
          <pre style={{ textAlign: 'left', fontSize: '0.85rem', overflowX: 'auto' }}>
            {JSON.stringify(details, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

export default App;
