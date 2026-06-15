import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, Mail, ShieldAlert } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseUrl: string;
  onSuccess: (token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, baseUrl, onSuccess }) => {
  // Modal toggle state (Login vs Register views)
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  // Focus Trapping useEffect Hook: traps focus inside the modal for accessibility (WCAG compliance)
  useEffect(() => {
    if (!isOpen) return;

    // Save previous active element to restore on close
    const previousActiveElement = document.activeElement as HTMLElement;

    // Focus the modal content initially
    setTimeout(() => {
      modalRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (!modalRef.current) return;
        const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const focusableElements = Array.from(
          modalRef.current.querySelectorAll(focusableSelectors)
        ) as HTMLElement[];

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // If Shift + Tab is pressed, check if we're on the first element and loop to the last
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          // If Tab is pressed, check if we're on the last element and loop to the first
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousActiveElement?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  /**
   * Handles modal form submission. Sends registering or login payloads to the NestJS backend auth paths
   * and invokes onSuccess callback with returned access tokens.
   * 
   * @param {React.FormEvent} e - Form event context
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const body = isLogin 
        ? { email, password }
        : { email, password, role };

      const res = await fetch(`${baseUrl || ''}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // If it's a register request, it doesn't return a token, so we immediately log them in automatically
      if (!isLogin) {
        const loginRes = await fetch(`${baseUrl || ''}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginData.message || 'Auto-login failed after registration');
        onSuccess(loginData.access_token);
      } else {
        onSuccess(data.access_token);
      }
      
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fade-in" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 'var(--z-modal)' as string,
      backdropFilter: 'blur(4px)'
    }}>
      <div 
        ref={modalRef}
        tabIndex={-1}
        aria-modal="true"
        role="dialog"
        className="card slide-up" 
        style={{ width: '100%', maxWidth: '400px', padding: '2rem', position: 'relative', margin: '1rem', outline: 'none' }}
      >
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          <button 
            type="button"
            onClick={() => setIsLogin(true)}
            style={{ 
              background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer',
              color: isLogin ? 'var(--primary)' : 'var(--text-secondary)'
            }}
          >
            Log In
          </button>
          <button 
            type="button"
            onClick={() => setIsLogin(false)}
            style={{ 
              background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer',
              color: !isLogin ? 'var(--primary)' : 'var(--text-secondary)'
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              <Mail size={14} /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              <Lock size={14} /> Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                <ShieldAlert size={14} /> Role
              </label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value as 'USER' | 'ADMIN')}
                style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
              >
                <option value="USER">Normal User</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
          )}

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: '0.85rem', backgroundColor: 'var(--danger-glow)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ padding: '0.75rem', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}
          </button>
        </form>
      </div>
    </div>
  );
};
