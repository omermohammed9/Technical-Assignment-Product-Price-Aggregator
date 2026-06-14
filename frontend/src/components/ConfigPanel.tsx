import React, { useState, useEffect } from 'react';
import { Settings, Key, Globe, Check, AlertCircle } from 'lucide-react';

interface ConfigPanelProps {
  onConfigChange: (config: { apiKey: string; baseUrl: string }) => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ onConfigChange }) => {
  const [apiKey, setApiKey] = useState('supersecureapikey123');
  const [baseUrl, setBaseUrl] = useState(window.location.origin === 'http://localhost:5173' ? 'http://localhost:3000' : '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedKey = localStorage.getItem('aggregator_api_key');
    const storedUrl = localStorage.getItem('aggregator_base_url');
    
    if (storedKey) setApiKey(storedKey);
    if (storedUrl !== null) setBaseUrl(storedUrl);
    
    // Initial config dispatch
    onConfigChange({
      apiKey: storedKey || 'supersecureapikey123',
      baseUrl: storedUrl !== null ? storedUrl : (window.location.origin === 'http://localhost:5173' ? 'http://localhost:3000' : '')
    });
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('aggregator_api_key', apiKey);
      localStorage.setItem('aggregator_base_url', baseUrl);
      
      onConfigChange({ apiKey, baseUrl });
      setSaved(true);
      setError('');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Failed to save settings to localStorage');
    }
  };

  return (
    <div className="card" id="config-panel" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Settings size={20} className="logo-text" style={{ strokeWidth: 2.5 }} />
        <h3 style={{ fontSize: '1.15rem' }}>Settings & API Config</h3>
      </div>
      
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
            <Key size={14} />
            API Key (x-api-key)
          </label>
          <input
            id="input-api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter API Key..."
            required
            style={{ fontSize: '0.85rem' }}
          />
        </div>
        
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
            <Globe size={14} />
            API Base URL
          </label>
          <input
            id="input-base-url"
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="Leave empty for current domain, or e.g. http://localhost:3000"
            style={{ fontSize: '0.85rem' }}
          />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
            Vite Dev server runs on port 5173, backend on 3000.
          </span>
        </div>
        
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--danger)', backgroundColor: 'var(--danger-glow)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}
        
        <button
          id="btn-save-config"
          type="submit"
          className="btn-primary"
          style={{ width: '100%', padding: '0.65rem', fontSize: '0.85rem', height: '38px' }}
        >
          {saved ? (
            <>
              <Check size={16} /> Saved!
            </>
          ) : (
            'Apply Configuration'
          )}
        </button>
      </form>
    </div>
  );
};
