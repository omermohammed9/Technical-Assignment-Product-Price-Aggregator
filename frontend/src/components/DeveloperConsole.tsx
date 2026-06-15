/**
 * @file DeveloperConsole.tsx
 * @description Component displaying active auth parameters, JWT payloads, claims,
 * and key expiration statuses for developer analysis.
 */

import React, { useState } from 'react';
import { Key, Copy, Check, Cpu, ShieldAlert, Award } from 'lucide-react';

interface DeveloperConsoleProps {
  apiKey: string;
  user: { email: string; role: string; exp?: number } | null;
}

export const DeveloperConsole: React.FC<DeveloperConsoleProps> = ({ apiKey, user }) => {
  const [copied, setCopied] = useState(false);

  /** Copies active credential keys onto the clipboard */
  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey || 'supersecureapikey123');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /** Formats JWT epoch expiration values to human-readable locale formats */
  const getExpirationDate = (exp?: number) => {
    if (!exp) return 'Never';
    return new Date(exp * 1000).toLocaleString();
  };

  const isJwt = apiKey && apiKey.startsWith('eyJ');


  return (
    <div className="card" id="developer-console-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <Cpu size={18} className="logo-text" />
        <h3 style={{ fontSize: '1.1rem' }}>Developer Console</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
        {/* Auth Mode Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Auth Method:</span>
          <span className="badge" style={{ backgroundColor: isJwt ? 'var(--primary-glow)' : 'rgba(255,255,255,0.05)', color: isJwt ? 'var(--primary)' : 'var(--text-secondary)' }}>
            {isJwt ? 'JWT Bearer' : 'API Key Header'}
          </span>
        </div>

        {/* Current Key Card */}
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '80%' }}>
            <Key size={14} color="var(--primary)" />
            <span style={{ fontFamily: 'monospace', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
              {apiKey ? `${apiKey.substring(0, 16)}...` : 'supersecureapikey123'}
            </span>
          </div>
          <button 
            type="button" 
            onClick={handleCopy} 
            className="btn-secondary" 
            style={{ padding: '0.3rem', width: '28px', height: '28px', borderRadius: '4px' }}
            title="Copy Active Token"
          >
            {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
          </button>
        </div>

        {/* JWT Claims Explorer */}
        {user ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              JWT Payload Details
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '0.4rem', padding: '0.75rem', backgroundColor: 'rgba(99, 102, 241, 0.03)', border: '1px solid var(--primary-glow)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Subject:</span>
              <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>

              <span style={{ color: 'var(--text-secondary)' }}>Role:</span>
              <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <Award size={12} color="var(--accent)" /> {user.role}
              </span>

              <span style={{ color: 'var(--text-secondary)' }}>Expires:</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{getExpirationDate(user.exp)}</span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', backgroundColor: 'rgba(245, 158, 11, 0.03)', border: '1px solid var(--warning-glow)', borderRadius: 'var(--radius-sm)', color: 'var(--warning)', alignItems: 'flex-start' }}>
            <ShieldAlert size={16} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', lineHeight: '1.3' }}>
              Using default read-only demo API key. Log in to authenticate as User or Administrator.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
