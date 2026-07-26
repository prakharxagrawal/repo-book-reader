import React, { useState } from 'react';
import { X, Key, CheckCircle, LogOut, ShieldAlert, User, ChevronDown, ChevronUp } from 'lucide-react';
import { UserProfile } from '../types';
import { initiateGithubOAuth } from '../services/authService';

const GithubIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onLogin: (token: string) => Promise<void>;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onLogin,
  onLogout,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPatInput, setShowPatInput] = useState(false);

  if (!isOpen) return null;

  const handleSubmitPat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await onLogin(tokenInput.trim());
      setTokenInput('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authenticate with GitHub');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <GithubIcon size={22} color="var(--accent-primary)" />
            <span>GitHub Authentication</span>
          </div>
          <button className="btn btn-icon" onClick={onClose} style={{ background: 'transparent', border: 'none' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {userProfile ? (
            /* Authenticated Profile View */
            <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.username}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  border: '3px solid var(--accent-primary)',
                  marginBottom: '1rem',
                  boxShadow: 'var(--shadow-md)',
                }}
              />

              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                {userProfile.name || userProfile.username}
              </h2>

              <div style={{ fontSize: '0.9rem', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', marginBottom: '0.75rem' }}>
                @{userProfile.username}
              </div>

              {userProfile.bio && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.4 }}>
                  {userProfile.bio}
                </p>
              )}

              <div className="badge" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', marginBottom: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)', border: '1px solid var(--accent-success)' }}>
                <CheckCircle size={14} style={{ marginRight: '0.4rem' }} />
                Logged in via GitHub SSO (5,000 requests/hr rate limit)
              </div>

              <button
                className="btn"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                style={{ width: '100%', borderColor: 'var(--accent-danger)', color: 'var(--accent-danger)' }}
              >
                <LogOut size={16} /> Sign Out of GitHub
              </button>
            </div>
          ) : (
            /* Login Options */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5, textAlign: 'center' }}>
                Sign in with your GitHub account for 1-click single sign-on, personalized reading history, and 5,000 API requests/hour.
              </p>

              {/* 1-Click GitHub SSO Button */}
              <button
                className="btn btn-primary"
                onClick={() => initiateGithubOAuth()}
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  gap: '0.6rem',
                  borderRadius: '0.6rem',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <GithubIcon size={22} color="#ffffff" />
                Sign in with GitHub (1-Click SSO)
              </button>

              <div style={{ display: 'flex', alignItems: 'center', margin: '0.5rem 0', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                <span style={{ padding: '0 0.75rem' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
              </div>

              {/* Advanced PAT Fallback Toggle */}
              <div>
                <button
                  className="btn"
                  onClick={() => setShowPatInput(!showPatInput)}
                  style={{ width: '100%', justifyContent: 'space-between', fontSize: '0.85rem', background: 'var(--bg-tertiary)' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Key size={15} color="var(--accent-primary)" /> Advanced: Use Personal Access Token (PAT)
                  </span>
                  {showPatInput ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showPatInput && (
                  <form onSubmit={handleSubmitPat} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="Paste ghp_xxxxxxxxxxxxxxxxxxxx"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                      required
                    />

                    {errorMsg && (
                      <div style={{ color: 'var(--accent-danger)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <ShieldAlert size={14} />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ width: '100%', fontSize: '0.85rem' }}>
                      {isSubmitting ? 'Authenticating...' : 'Sign In with Token'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
