import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  BookOpen,
  GitBranch,
  Clock,
  RefreshCw,
  X,
  Activity,
  Layers,
  Database,
  CheckCircle,
} from 'lucide-react';
import { AdminAnalytics, UserProfile } from '../types';
import { loadLocalAnalytics, syncAnalyticsToGist } from '../services/analyticsService';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose, userProfile }) => {
  const [analytics, setAnalytics] = useState<AdminAnalytics>(() => loadLocalAnalytics());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAnalytics(loadLocalAnalytics());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSyncToGist = async () => {
    if (!userProfile?.token) {
      alert('Admin authentication token is required to sync analytics to GitHub Gist.');
      return;
    }

    setIsSyncing(true);
    setSyncStatusMsg('');

    try {
      const gistId = await syncAnalyticsToGist(userProfile.token);
      setSyncStatusMsg(`Successfully synced analytics to GitHub Gist (${gistId.substring(0, 8)}...)`);
      setAnalytics(loadLocalAnalytics());
    } catch (err: any) {
      setSyncStatusMsg(`Sync error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '850px', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck size={22} color="var(--accent-primary)" />
            <span>Admin Analytics & Reader History</span>
            <span className="badge" style={{ fontSize: '0.7rem', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-primary)' }}>
              Zero-DB Architecture
            </span>
          </div>
          <button className="btn btn-icon" onClick={onClose} style={{ background: 'transparent', border: 'none' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Top Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div className="glass-panel" style={{ padding: '1rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <Users size={28} color="var(--accent-primary)" />
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {analytics.totalReaders}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unique Readers</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <BookOpen size={28} color="var(--accent-success)" />
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {analytics.totalChaptersRead}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Chapters Read</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <GitBranch size={28} color="var(--accent-warning)" />
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {analytics.activeReposCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Repositories</div>
              </div>
            </div>
          </div>

          {/* Sync Button & Status */}
          <div className="glass-panel" style={{ padding: '1rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Database size={16} color="var(--accent-primary)" />
                DB-less Persistence (GitHub Gist API)
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Sync usage metrics and user activity logs to a private GitHub Gist with zero database hosting fees.
              </div>
            </div>

            <button className="btn btn-primary" onClick={handleSyncToGist} disabled={isSyncing} style={{ fontSize: '0.85rem' }}>
              <RefreshCw size={14} className={isSyncing ? 'spin' : ''} />
              {isSyncing ? 'Syncing to Gist...' : 'Sync Analytics to Gist'}
            </button>

            {syncStatusMsg && (
              <div style={{ width: '100%', fontSize: '0.8rem', color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle size={14} />
                <span>{syncStatusMsg}</span>
              </div>
            )}
          </div>

          {/* Real-time Reader Activity Logs */}
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Activity size={16} color="var(--accent-primary)" />
              Real-time Reader Activity Timeline ({analytics.logs.length} events)
            </div>

            <div className="glass-panel" style={{ borderRadius: '0.75rem', overflow: 'hidden', maxHeight: '320px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '0.6rem 0.85rem' }}>Reader</th>
                    <th style={{ padding: '0.6rem 0.85rem' }}>Action</th>
                    <th style={{ padding: '0.6rem 0.85rem' }}>Repository</th>
                    <th style={{ padding: '0.6rem 0.85rem' }}>Chapter Path</th>
                    <th style={{ padding: '0.6rem 0.85rem' }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                        No reader activity logged yet.
                      </td>
                    </tr>
                  ) : (
                    analytics.logs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '0.6rem 0.85rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                          {log.username}
                        </td>
                        <td style={{ padding: '0.6rem 0.85rem', textTransform: 'capitalize' }}>
                          <span className="badge" style={{ fontSize: '0.7rem' }}>
                            {log.action.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '0.6rem 0.85rem', fontFamily: 'var(--font-mono)' }}>
                          {log.repo}
                        </td>
                        <td style={{ padding: '0.6rem 0.85rem', color: 'var(--text-muted)' }}>
                          {log.chapterPath}
                        </td>
                        <td style={{ padding: '0.6rem 0.85rem', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
