import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Shield, Lock, X } from 'lucide-react';
import { PrivacyToggle } from '../components/PrivacyToggle';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  onClose,
  onSuccess
}) => {
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [defaultPrivacy, setDefaultPrivacy] = useState<'PUBLIC' | 'UNLISTED' | 'PRIVATE'>('PRIVATE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        const res = await api.login({ login: username || email, password });
        login(res.token, res.user);
      } else {
        const res = await api.register({
          username,
          email,
          password,
          default_privacy: defaultPrivacy
        });
        login(res.token, res.user);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="vault-badge-icon" style={{ width: 28, height: 28 }}>
              <Shield size={16} strokeWidth={2.8} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              {mode === 'login' ? 'Enter Your Vault' : 'Create Your CineVault'}
            </h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div
              style={{
                padding: '0.75rem',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 8,
                color: '#f87171',
                fontSize: '0.85rem'
              }}
            >
              {error}
            </div>
          )}

          <div className="form-group">
            <label>{mode === 'login' ? 'Username or Email' : 'Username'}</label>
            <input
              type="text"
              required
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={mode === 'login' ? 'e.g. christopher_nolan' : 'Unique username'}
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                required
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
              />
            </div>
          )}

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Default Diary Privacy</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Can be changed anytime</span>
              </label>
              <PrivacyToggle value={defaultPrivacy} onChange={setDefaultPrivacy} />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Encrypted Vault'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            {mode === 'login' ? (
              <span>
                Don't have a vault yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}
                >
                  Create one here
                </button>
              </span>
            ) : (
              <span>
                Already have a vault?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}
                >
                  Sign in
                </button>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
