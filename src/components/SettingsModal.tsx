import React from 'react';
import { X, Key, Type, Palette, Layout } from 'lucide-react';
import { UserSettings, Theme, FontFamily, FontSize } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Reader & API Settings</span>
          </div>
          <button className="btn btn-icon" onClick={onClose} style={{ background: 'transparent', border: 'none' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* GitHub Personal Access Token */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem', color: 'var(--text-main)' }}>
              <Key size={15} color="var(--accent-primary)" />
              GitHub Personal Access Token (PAT)
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>
              Unauthenticated GitHub requests are limited to 60/hr. Adding a PAT increases your rate limit to 5,000 requests/hr.
            </p>
            <input
              type="password"
              className="input-field"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={settings.githubPat}
              onChange={(e) => onUpdateSettings({ githubPat: e.target.value })}
              style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
            />
          </div>

          {/* Theme Selection */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
              <Palette size={15} color="var(--accent-primary)" />
              Reader Theme Palette
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {(['dark', 'obsidian', 'sepia', 'light'] as Theme[]).map((t) => (
                <button
                  key={t}
                  className={`btn ${settings.theme === t ? 'btn-primary' : ''}`}
                  onClick={() => onUpdateSettings({ theme: t })}
                  style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}
                >
                  {t} Mode
                </button>
              ))}
            </div>
          </div>

          {/* Typography - Font Family */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
              <Type size={15} color="var(--accent-primary)" />
              Book Font Family
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {(['sans', 'serif', 'mono'] as FontFamily[]).map((f) => (
                <button
                  key={f}
                  className={`btn ${settings.fontFamily === f ? 'btn-primary' : ''}`}
                  onClick={() => onUpdateSettings({ fontFamily: f })}
                  style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
              <Layout size={15} color="var(--accent-primary)" />
              Font Size
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {(['sm', 'base', 'lg', 'xl'] as FontSize[]).map((s) => (
                <button
                  key={s}
                  className={`btn ${settings.fontSize === s ? 'btn-primary' : ''}`}
                  onClick={() => onUpdateSettings({ fontSize: s })}
                  style={{ textTransform: 'uppercase', fontSize: '0.8rem' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border-color)', textAlign: 'right' }}>
          <button className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
