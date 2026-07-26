import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Settings,
  Moon,
  Sun,
  Download,
  Bookmark,
  FileText,
  GitBranch,
  Star,
  Layers,
} from 'lucide-react';
import { RepoInfo, Theme, UserSettings } from '../types';
import { PRESET_REPOSITORIES } from '../data/presets';

interface HeaderProps {
  repoInfo: RepoInfo | null;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onSelectRepo: (owner: string, repo: string) => void;
  onGoHome?: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenNotes: () => void;
  onExportPdf: () => void;
  onExportHtml: () => void;
  bookmarksCount: number;
  notesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  repoInfo,
  settings,
  onUpdateSettings,
  onSelectRepo,
  onGoHome,
  onOpenSearch,
  onOpenSettings,
  onOpenNotes,
  onExportPdf,
  onExportHtml,
  bookmarksCount,
  notesCount,
}) => {
  const [repoInput, setRepoInput] = useState('');
  const [isRepoMenuOpen, setIsRepoMenuOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const handleCustomRepoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoInput.trim()) return;

    let input = repoInput.trim();
    // Parse full github url e.g. https://github.com/owner/repo
    if (input.includes('github.com/')) {
      const parts = input.split('github.com/')[1].split('/');
      if (parts.length >= 2) {
        onSelectRepo(parts[0], parts[1]);
        setIsRepoMenuOpen(false);
        setRepoInput('');
        return;
      }
    }

    const parts = input.split('/');
    if (parts.length === 2) {
      onSelectRepo(parts[0], parts[1]);
      setIsRepoMenuOpen(false);
      setRepoInput('');
    } else {
      alert('Please enter a valid format: "owner/repo" or full GitHub URL');
    }
  };

  const cycleTheme = () => {
    const themes: Theme[] = ['dark', 'obsidian', 'sepia', 'light'];
    const nextIndex = (themes.indexOf(settings.theme) + 1) % themes.length;
    onUpdateSettings({ theme: themes[nextIndex] });
  };

  return (
    <header className="header-container glass-panel" style={{ height: 'var(--header-height)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.25rem', borderBottom: '1px solid var(--border-color)', zIndex: 100 }}>
      {/* Brand & Repo Picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div
          onClick={onGoHome}
          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800, fontSize: '1.2rem', color: 'var(--accent-primary)', cursor: 'pointer' }}
          title="Return to Home Landing Page"
        >
          <div style={{ background: 'var(--accent-glow)', padding: '0.4rem', borderRadius: '0.5rem', display: 'flex' }}>
            <BookOpen size={22} color="var(--accent-primary)" />
          </div>
          <span>GitBookify</span>
        </div>

        {/* Current Repository Selector Badge */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn"
            onClick={() => setIsRepoMenuOpen(!isRepoMenuOpen)}
            style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <GitBranch size={16} />
            <span>{repoInfo ? `${repoInfo.owner}/${repoInfo.repo}` : 'Select Repository'}</span>
            {repoInfo?.stars !== undefined && (
              <span className="badge" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <Star size={12} fill="var(--accent-warning)" color="var(--accent-warning)" />
                {repoInfo.stars >= 1000 ? `${(repoInfo.stars / 1000).toFixed(1)}k` : repoInfo.stars}
              </span>
            )}
            <Layers size={14} color="var(--text-dim)" />
          </button>

          {/* Repo Selection Dropdown */}
          {isRepoMenuOpen && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                width: '360px',
                padding: '1rem',
                borderRadius: '0.75rem',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 200,
                background: 'var(--bg-secondary)',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
                Load Any GitHub Repo
              </div>
              <form onSubmit={handleCustomRepoSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. owner/repo or GitHub URL"
                  value={repoInput}
                  onChange={(e) => setRepoInput(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary">
                  Load
                </button>
              </form>

              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Curated Presets
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '240px', overflowY: 'auto' }}>
                {PRESET_REPOSITORIES.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => {
                      onSelectRepo(preset.owner, preset.repo);
                      setIsRepoMenuOpen(false);
                    }}
                    style={{
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{preset.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>{preset.starsBadge}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {preset.owner}/{preset.repo}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center Search Bar Trigger */}
      <button
        onClick={onOpenSearch}
        className="input-field"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          width: '320px',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          padding: '0.45rem 1rem',
        }}
      >
        <Search size={16} />
        <span style={{ flex: 1, textAlign: 'left', fontSize: '0.875rem' }}>Search repository chapters...</span>
        <kbd style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.1rem 0.4rem', fontSize: '0.75rem' }}>
          Ctrl K
        </kbd>
      </button>

      {/* Right Tools & Settings */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        {/* Bookmarks / Notes Drawer Trigger */}
        <button className="btn btn-icon" onClick={onOpenNotes} title="Personal Notes & Bookmarks">
          <Bookmark size={18} />
          {(bookmarksCount > 0 || notesCount > 0) && (
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--accent-primary)',
              }}
            />
          )}
        </button>

        {/* Theme Switcher Toggle */}
        <button className="btn btn-icon" onClick={cycleTheme} title={`Theme: ${settings.theme}`}>
          {settings.theme === 'light' || settings.theme === 'sepia' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Export Menu Dropdown */}
        <div style={{ position: 'relative' }}>
          <button className="btn btn-icon" onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} title="Export Book">
            <Download size={18} />
          </button>
          {isExportMenuOpen && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '200px',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 200,
                background: 'var(--bg-secondary)',
              }}
            >
              <button
                className="btn"
                onClick={() => {
                  onExportPdf();
                  setIsExportMenuOpen(false);
                }}
                style={{ width: '100%', justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
              >
                <FileText size={16} /> Print / Save as PDF
              </button>
              <button
                className="btn"
                onClick={() => {
                  onExportHtml();
                  setIsExportMenuOpen(false);
                }}
                style={{ width: '100%', justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
              >
                <Download size={16} /> Export Offline HTML
              </button>
            </div>
          )}
        </div>

        {/* Settings Modal Trigger */}
        <button className="btn btn-icon" onClick={onOpenSettings} title="Settings & Access Token">
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};
